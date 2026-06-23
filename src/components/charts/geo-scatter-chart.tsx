"use client";

import { useMemo, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { applyFilters, joinTables } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

export default function GeoScatterChart({ config, tables, filters, height = 300 }: Props) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    import("echarts").then((echarts) => {
      if (echarts.getMap("world")) {
        setMapLoaded(true);
        return;
      }
      fetch("https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json")
        .then((res) => res.json())
        .then((geoJson) => {
          echarts.registerMap("world", geoJson);
          setMapLoaded(true);
        })
        .catch((err) => {
          console.error("Failed to load world map:", err);
        });
    });
  }, []);

  const { option, hasData } = useMemo(() => {
    if (config.fields.length < 2 || !config.values.length) return { option: null, hasData: false };

    const fieldDef = config.fields[0];
    const table = tables?.find((t) => t.id === fieldDef.tableId);
    if (!table || !table.rows) return { option: null, hasData: false };

    // Get filtered and joined data
    const valueTableIds = [...new Set(config.values.map(v => v.tableId))].filter(id => id !== fieldDef.tableId);
    let rows: Record<string, unknown>[] = [];
    if (valueTableIds.length > 0) {
      const tablesToJoin = tables.filter(t => t.id === fieldDef.tableId || valueTableIds.includes(t.id));
      rows = joinTables(tablesToJoin, [], filters);
    } else {
      rows = applyFilters(table, filters || []);
    }

    if (rows.length === 0) return { option: null, hasData: false };

    // Longitude, Latitude, Value
    const lngField = config.fields[0];
    const latField = config.fields.length > 1 ? config.fields[1] : null;
    const valueField = config.values[0];

    const data = rows.map(row => {
      const lng = parseFloat(String(row[lngField.columnName] ?? 0));
      const lat = latField ? parseFloat(String(row[latField.columnName] ?? 0)) : 0;
      const value = parseFloat(String(row[valueField.columnName] ?? 0));
      return [lng, lat, value];
    });

    return {
      hasData: true,
      option: {
        title: {
          text: config.title,
          left: "center",
          top: 8,
          textStyle: {
            fontSize: 13,
            fontFamily: "inherit",
            fontWeight: 600,
            color: "var(--color-text)"
          }
        },
        tooltip: config.showTooltip ? {
          trigger: "item",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "var(--color-border)",
          formatter: (params: any) => {
            const val = params.value;
            if (!val) return "";
            return `<div style="padding: 4px 8px;">
              <strong>Coordinates:</strong> [${val[0]}, ${val[1]}]<br/>
              <strong>Value:</strong> ${val[2]}
            </div>`;
          },
          textStyle: {
            color: "var(--color-text)",
            fontSize: 11
          }
        } : undefined,
        geo: {
          map: "world",
          roam: true,
          label: {
            emphasis: {
              show: false
            }
          },
          itemStyle: {
            areaColor: "#f3f4f6",
            borderColor: "#d1d5db"
          }
        },
        series: [{
          type: "scatter",
          coordinateSystem: "geo",
          data,
          symbolSize: (val: number[]) => {
            const size = Math.sqrt(val[2]) * 2;
            return isNaN(size) ? 8 : Math.max(size, 6);
          },
          itemStyle: {
            color: "#3b82f6",
            opacity: 0.8
          }
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData || !mapLoaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)", flexDirection: "column", gap: "8px" }}>
        🗺️ {!mapLoaded ? "Loading Map..." : "Configure longitude, latitude, and value fields"}
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
