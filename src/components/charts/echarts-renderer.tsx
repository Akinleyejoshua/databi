/* ============================================================
   ECharts Renderer — Renders all chart types
   ============================================================ */
"use client";

import { useMemo, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter, Measure, Relationship } from "@/types";
import { applyFilters, CHART_COLORS, parseSafeNumber, joinTables } from "@/lib/utils";

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

  // Resize when the container changes
  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance()?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { option: null, hasData: false };

    const fieldDef = config.fields[0];
    const table = tables.find((t) => t.id === fieldDef.tableId);
    if (!table) return { option: null, hasData: false };

    // Determine if we need to join tables
    const valueTableIds = [...new Set(config.values.map(v => v.tableId))].filter(id => id !== fieldDef.tableId);
    let rows: Record<string, unknown>[] = [];
    
    if (valueTableIds.length > 0 && relationships.length > 0) {
      const tablesToJoin = tables.filter(t => t.id === fieldDef.tableId || valueTableIds.includes(t.id));
      rows = joinTables(tablesToJoin, relationships, filters);
    } else {
      rows = applyFilters(table, filters);
    }

    if (rows.length === 0) return { option: null, hasData: false };

    const categories = [...new Set(rows.map((r) => String(r[fieldDef.columnName])))];
    const colors = config.colorScheme?.length ? config.colorScheme : CHART_COLORS;

    const series = config.values.map((v, i) => {
      // Check if it's a measure
      if (v.aggregation === "measure") {
        const measure = measures.find((m) => m.id === v.columnName);
        
        let evalFn: Function | null = null;
        if (measure) {
          try {
            evalFn = new Function("row", "rows", `return ${measure.formula}`);
          } catch (e) {
            console.error("Invalid measure formula", e);
          }
        }

        const data = categories.map((cat) => {
          const matching = rows.filter((r) => String(r[fieldDef.columnName]) === cat);
          if (!evalFn || matching.length === 0) return 0;
          try {
            const res = evalFn(matching[0], matching);
            return Number(res) || 0;
          } catch (e) {
            return 0;
          }
        });

        const base: Record<string, unknown> = {
          name: measure ? measure.name : "Unknown Measure",
          data,
          itemStyle: { color: colors[i % colors.length] },
        };
        
        return buildSeriesObject(base, config.chartType, categories, data, colors, i);
      }

      // Standard Column Aggregation
      const data = categories.map((cat) => {
        const matching = rows.filter((r) => String(r[fieldDef.columnName]) === cat);
        const vals = matching.map((r) => parseSafeNumber(r[v.columnName])).filter((n) => !isNaN(n));

        switch (v.aggregation) {
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

      return buildSeriesObject(base, config.chartType, categories, data, colors, i);
    });

    const isPie = config.chartType === "pie" || config.chartType === "donut";
    const isHorizontalBar = config.chartType === "bar";

    return {
      hasData: true,
      option: {
        title: { text: config.title, left: "center", top: 8, textStyle: { fontSize: 14, fontFamily: "Bricolage Grotesque", fontWeight: 600 } },
        tooltip: config.showTooltip ? { trigger: isPie ? "item" : "axis" } : undefined,
        legend: config.showLegend ? { bottom: 4, textStyle: { fontSize: 11 } } : undefined,
        grid: isPie ? undefined : { left: "8%", right: "4%", top: 40, bottom: config.showLegend ? 40 : 24, containLabel: true },
        xAxis: isPie ? undefined : (isHorizontalBar
          ? { type: "value" as const }
          : { type: "category" as const, data: categories, axisLabel: { rotate: categories.length > 8 ? 30 : 0, fontSize: 11 } }),
        yAxis: isPie ? undefined : (isHorizontalBar
          ? { type: "category" as const, data: categories }
          : { type: "value" as const }),
        series,
        color: colors,
      }
    };
  }, [config, tables, filters, measures, relationships]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-tertiary)", fontSize: "13px", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontSize: "24px" }}>🔍</span>
        <span>{(!config.fields.length || !config.values.length) ? "Configure Fields & Values" : "No data found for current filters"}</span>
      </div>
    );
  }

  return (
    <ReactECharts 
      ref={chartRef}
      option={option} 
      style={{ height: "100%", width: "100%", minHeight: "150px" }} 
      opts={{ renderer: "svg" }} 
      notMerge={true}
      lazyUpdate={true}
    />
  );
}

function buildSeriesObject(base: any, chartType: string, categories: string[], data: number[], colors: string[], index: number) {
  switch (chartType) {
    case "bar": return { ...base, type: "bar" };
    case "column": return { ...base, type: "bar" };
    case "line": case "time-series": return { ...base, type: "line", smooth: true };
    case "area": return { ...base, type: "line", smooth: true, areaStyle: { opacity: 0.3 } };
    case "scatter": return { ...base, type: "scatter", symbolSize: 10 };
    case "pie": case "donut":
      return {
        type: "pie",
        name: base.name,
        radius: chartType === "donut" ? ["40%", "70%"] : "70%",
        data: categories.map((cat, j) => ({ name: cat, value: data[j], itemStyle: { color: colors[j % colors.length] } })),
        label: { show: true, fontSize: 11 },
      };
    default: return { ...base, type: "bar" };
  }
}
