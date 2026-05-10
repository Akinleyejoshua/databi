"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { applyFilters, joinTables } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

export default function GeoBubbleChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || config.values.length < 2) return { option: null, hasData: false };

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

    // Longitude, Latitude, Size
    const lngField = config.fields[0];
    const latField = config.fields.length > 1 ? config.fields[1] : null;
    const sizeField = config.values[0];
    const colorField = config.values.length > 1 ? config.values[1] : null;

    const data = rows.map(row => {
      const lng = parseFloat(String(row[lngField.columnName] ?? 0));
      const lat = latField ? parseFloat(String(row[latField.columnName] ?? 0)) : 0;
      const size = parseFloat(String(row[sizeField.columnName] ?? 0));
      const color = colorField ? parseFloat(String(row[colorField.columnName] ?? 50)) : 50;
      return [lng, lat, size, color];
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
          textStyle: {
            color: "var(--color-text)",
            fontSize: 11
          }
        } : undefined,
        geo: {
          map: "world",
          roam: true,
          itemStyle: {
            areaColor: "#f3f4f6",
            borderColor: "#d1d5db"
          }
        },
        series: [{
          type: "scatter",
          coordinateSystem: "geo",
          data,
          symbolSize: (val: number[]) => Math.sqrt(val[2]) * 3,
          itemStyle: {
            color: (params: any) => {
              const colorVal = params.data[3];
              return colorVal > 70 ? "#10b981" : colorVal > 40 ? "#f59e0b" : "#ef4444";
            },
            opacity: 0.8
          }
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        🗺️ Configure longitude, latitude, size, and color fields
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
