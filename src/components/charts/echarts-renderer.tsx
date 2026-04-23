/* ============================================================
   ECharts Renderer — Renders all chart types
   ============================================================ */
"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter, Measure, Relationship } from "@/types";
import { applyFilters, CHART_COLORS, parseSafeNumber, joinTables, abbreviateNumber } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  relationships?: Relationship[];
  measures?: Measure[];
  width?: number;
  height?: number;
}

export default function EChartsRenderer({ config, tables, filters, relationships = [], measures = [], height = 300 }: Props) {
  const chartRef = useRef<ReactECharts>(null);

  // Resize when the container changes (handles canvas widget resizing)
  useEffect(() => {
    if (!chartRef.current) return;

    const chartInstance = chartRef.current.getEchartsInstance();
    const container = chartInstance.getDom();

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.resize();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const currentMapKey = (config.mapRegion === "world" || !config.mapRegion)
    ? "world"
    : (config.mapRegion === "country" ? config.mapCountry : config.customMapUrl) || "world";

  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { option: null, hasData: false };

    const fieldDef = config.fields[0];
    const table = tables?.find((t) => t.id === fieldDef.tableId);
    if (!table || !table.rows) return { option: null, hasData: false };

    // Determine if we need to join tables
    const valueTableIds = [...new Set(config.values.map(v => v.tableId))].filter(id => id !== fieldDef.tableId);
    let rows: Record<string, unknown>[] = [];

    if (valueTableIds.length > 0 && relationships?.length > 0) {
      const tablesToJoin = tables.filter(t => t.id === fieldDef.tableId || valueTableIds.includes(t.id));
      rows = joinTables(tablesToJoin, relationships, filters);
    } else {
      rows = applyFilters(table, filters || []);
    }

    if (rows.length === 0) return { option: null, hasData: false };

    // Calculate Categories with optimized grouping
    const categoriesSet = new Set<string>();
    const groups = new Map<string, Record<string, unknown>[]>();

    // Prepare groups
    rows.forEach(row => {
      let val: string;
      if (fieldDef.aggregation === "measure") {
        const measure = measures.find(m => m.id === fieldDef.columnName);
        if (measure) {
          try {
            const evalFn = new Function("row", "rows", `return ${measure.formula}`);
            val = String(evalFn(row, rows));
          } catch (e) {
            val = "Error";
          }
        } else {
          val = "Unknown Measure";
        }
      } else {
        val = String(row[fieldDef.columnName] ?? "Blank");
      }

      categoriesSet.add(val);
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val)!.push(row);
    });

    const categories = Array.from(categoriesSet);
    const colors = config.colorScheme?.length ? config.colorScheme : CHART_COLORS;

    // Determine Axis Types (PowerBI style)
    // If the field is numeric, we might want a value axis, but for Bar/Column we usually want categories.
    // For Line/Scatter, if the X field is numeric, we use 'value'.
    const xIsNumeric = rows.length > 0 && !isNaN(Number(rows[0][fieldDef.columnName])) && fieldDef.aggregation !== "measure";
    const isScatter = config.chartType === "scatter";
    const isPie = config.chartType === "pie" || config.chartType === "donut";
    const isHorizontalBar = config.chartType === "bar";

    const isMap = config.chartType === "map";

    const series = config.values.map((v, i) => {
      // Logic for raw data (Scatter plots with raw values)
      if (isScatter && (!v.aggregation || v.aggregation === "none")) {
        const data = rows.map(r => {
          const x = parseSafeNumber(r[fieldDef.columnName]);
          const y = parseSafeNumber(r[v.columnName]);
          return [x, y];
        });
        return {
          name: v.columnName,
          type: "scatter",
          data,
          itemStyle: { color: colors[i % colors.length] }
        };
      }

      // Logic for Aggregated Data
      const data = categories.map((cat) => {
        const matching = groups.get(cat) || [];

        if (v.aggregation === "measure") {
          const measure = measures.find((m) => m.id === v.columnName);
          if (!measure || matching.length === 0) return 0;
          try {
            const evalFn = new Function("row", "rows", `return ${measure.formula}`);
            return Number(evalFn(matching[0], matching)) || 0;
          } catch (e) {
            return 0;
          }
        }

        // Standard Aggregation
        const vals = matching.map((r) => parseSafeNumber(r[v.columnName]));

        // Smart Default: If column is text, default to 'count' even if 'sum' was picked
        const sampleVal = matching[0]?.[v.columnName];
        const isActuallyNumeric = typeof sampleVal === "number" || (!isNaN(parseFloat(String(sampleVal))) && String(sampleVal).length > 0);
        const agg = (!isActuallyNumeric && (v.aggregation === "sum" || v.aggregation === "average")) ? "count" : (v.aggregation || "sum");

        switch (agg) {
          case "sum": return vals.reduce((a, b) => a + b, 0);
          case "average": return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          case "count": return matching.length;
          case "min": return vals.length ? Math.min(...vals) : 0;
          case "max": return vals.length ? Math.max(...vals) : 0;
          default: return vals[0] || 0;
        }
      });

      const base: Record<string, unknown> = {
        name: v.columnName,
        data,
        itemStyle: { color: colors[i % colors.length] },
      };

      return buildSeriesObject(base, config.chartType, categories, data, colors, i, currentMapKey);
    });

    const showAsValueAxis = (config.chartType === "line" || config.chartType === "area" || config.chartType === "scatter") && xIsNumeric;

    let visualMap;
    if (isMap && series.length > 0) {
      const mapData = series[0].data as { name: string, value: number }[];
      const maxVal = Math.max(...mapData.map(d => d.value || 0), 100);
      visualMap = {
        left: 'right',
        min: 0,
        max: maxVal,
        inRange: { color: ['#e0f3f8', '#2563eb', '#1e3a8a'] },
        text: ['High', 'Low'],
        calculable: true,
        textStyle: { fontSize: 10 }
      };
    }

    return {
      hasData: true,
      option: {
        title: {
          text: config.title,
          left: "center",
          top: 8,
          textStyle: { fontSize: 13, fontFamily: "inherit", fontWeight: 600, color: "var(--color-text)" }
        },
        tooltip: config.showTooltip ? {
          trigger: isPie || isMap ? "item" : "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "var(--color-border)",
          textStyle: { color: "var(--color-text)", fontSize: 11 },
          formatter: isMap ? (params: any) => {
            if (Array.isArray(params)) return params[0].name;
            const data = params.data;
            return `${data?.originalName || params.name}: ${params.value || 0}`;
          } : undefined
        } : undefined,
        legend: config.showLegend && !isMap ? { bottom: 4, textStyle: { fontSize: 10, color: "var(--color-text-secondary)" } } : undefined,
        visualMap,
        grid: isPie || isMap ? undefined : { left: "4%", right: "4%", top: 45, bottom: config.showLegend ? 45 : 30, containLabel: true },
        xAxis: isPie || isMap ? undefined : (isHorizontalBar
          ? { type: "value", axisLabel: { fontSize: 10, formatter: (v: number) => abbreviateNumber(v) }, axisName: config.xAxisLabel || undefined, axisNameTextStyle: { color: "var(--color-text-secondary)", fontSize: 11, fontWeight: 500 } }
          : {
            type: showAsValueAxis ? "value" : "category",
            data: showAsValueAxis ? undefined : categories,
            axisLabel: { rotate: categories.length > 8 ? 30 : 0, fontSize: 10, color: "var(--color-text-secondary)" },
            axisName: config.xAxisLabel || undefined,
            axisNameTextStyle: { color: "var(--color-text-secondary)", fontSize: 11, fontWeight: 500 }
          }),
        yAxis: isPie || isMap ? undefined : (isHorizontalBar
          ? { type: "category", data: categories, axisLabel: { fontSize: 10, color: "var(--color-text-secondary)" }, axisName: config.yAxisLabel || undefined, axisNameTextStyle: { color: "var(--color-text-secondary)", fontSize: 11, fontWeight: 500 } }
          : { type: "value", axisLabel: { fontSize: 10, formatter: (v: number) => abbreviateNumber(v), color: "var(--color-text-secondary)" }, axisName: config.yAxisLabel || undefined, axisNameTextStyle: { color: "var(--color-text-secondary)", fontSize: 11, fontWeight: 500 } }),
        series,
        animation: true,
        animationDuration: 1000,
      }
    };
  }, [config, tables, filters, measures, relationships]);

  const [mapLoaded, setMapLoaded] = useState<string | null>(null);

  useEffect(() => {
    if (config.chartType === "map") {
      const type = config.mapRegion || "world";
      const regionKey = type === "world" ? "world" : (type === "country" ? config.mapCountry : config.customMapUrl);
      if (!regionKey || mapLoaded === regionKey) return;

      import("echarts").then((echarts) => {
        if (echarts.getMap(regionKey)) {
          setMapLoaded(regionKey);
          return;
        }

        let mapUrl = "";
        if (type === "world") {
          mapUrl = "https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json";
        } else if (type === "country") {
          const isoCodes: Record<string, string> = {
            nigeria: "ng",
            usa: "us",
            brazil: "br",
            canada: "ca",
            china: "cn",
            france: "fr",
            germany: "de",
            india: "in",
            uk: "gb"
          };
          let code = isoCodes[config.mapCountry || ""] || config.mapCountry;
          if (config.mapCountry === "other" && config.customMapUrl) {
            code = config.customMapUrl;
          }
          if (code && code !== "other") {
            mapUrl = `https://code.highcharts.com/mapdata/countries/${code.toLowerCase()}/${code.toLowerCase()}-all.geo.json`;
          }
        } else if (type === "custom") {
          mapUrl = config.customMapUrl || "";
        }

        if (mapUrl) {
          fetch(mapUrl)
            .then(res => res.json())
            .then(geoJson => {
              // Normalize names in GeoJSON for better matching
              if (geoJson.features) {
                geoJson.features.forEach((f: any) => {
                  if (f.properties && f.properties.name) {
                    f.properties.name = normalizeStateName(f.properties.name);
                  }
                });
              }
              echarts.registerMap(regionKey, geoJson);
              setMapLoaded(regionKey);
            })
            .catch(err => {
              console.error(`Failed to load map for ${regionKey}:`, err);
            });
        }
      });
    }
  }, [config.chartType, config.mapRegion, config.mapCountry, config.customMapUrl, mapLoaded]);


  const isMapReady = config.chartType !== "map" || mapLoaded === currentMapKey;

  if (!hasData || !isMapReady) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-tertiary)", fontSize: "12px", flexDirection: "column", gap: "10px", textAlign: "center", padding: "20px" }}>
        <div style={{ fontSize: "32px", opacity: 0.5 }}>📊</div>
        <div style={{ fontWeight: 500 }}>
          {config.chartType === "map" && !isMapReady ? `Loading Map...` : (!config.fields.length || !config.values.length) ? "Configure Chart Fields" : "No data available"}
        </div>
        <div style={{ fontSize: "11px", opacity: 0.7 }}>Add dimensions to Fields and metrics to Values</div>
      </div>
    );
  }

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height: "100%", width: "100%" }}
      opts={{ renderer: "svg" }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
}

function normalizeStateName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\bstate\b/g, "")
    .replace(/\bprovince\b/g, "")
    .replace(/\bterritory\b/g, "")
    .replace(/\bdepartment\b/g, "")
    .replace(/\bregion\b/g, "")
    .replace(/\bgovernorate\b/g, "")
    .trim();
}

function buildSeriesObject(base: any, chartType: string, categories: string[], data: number[], colors: string[], index: number, mapName: string = "world") {
  switch (chartType) {
    case "bar": return { ...base, type: "bar", borderRadius: [0, 4, 4, 0] };
    case "column": return { ...base, type: "bar", borderRadius: [4, 4, 0, 0] };
    case "line": case "time-series": return { ...base, type: "line", smooth: true, symbol: "circle", symbolSize: 6 };
    case "area": return { ...base, type: "line", smooth: true, areaStyle: { opacity: 0.2 }, symbol: "circle", symbolSize: 4 };
    case "scatter": return { ...base, type: "scatter", symbolSize: 10, itemStyle: { ...base.itemStyle, opacity: 0.7 } };
    case "map":
      return {
        type: "map",
        map: mapName,
        name: base.name,
        roam: true,
        data: categories.map((cat, j) => ({
          name: normalizeStateName(cat),
          value: data[j],
          originalName: cat
        })),
        emphasis: { label: { show: true } }
      };
    case "pie": case "donut":
      return {
        type: "pie",
        name: base.name,
        radius: chartType === "donut" ? ["45%", "75%"] : "75%",
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        data: categories.map((cat, j) => ({ name: cat, value: data[j], itemStyle: { color: colors[j % colors.length] } })),
        label: { show: true, fontSize: 10, formatter: "{b}: {d}%" },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: "bold" } }
      };
    default: return { ...base, type: "bar" };
  }
}
