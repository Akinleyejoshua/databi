"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { applyFilters } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

export default function CandlestickChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || config.values.length < 4) return { option: null, hasData: false };

    const table = tables?.find((t) => t.id === config.fields[0].tableId);
    if (!table || !table.rows) return { option: null, hasData: false };

    const rows = applyFilters(table, filters || []);
    if (rows.length === 0) return { option: null, hasData: false };

    const dateField = config.fields[0];
    const openField = config.values[0];
    const closeField = config.values[1];
    const lowField = config.values[2];
    const highField = config.values[3];

    const candleData = rows.map(row => [
      parseFloat(String(row[openField.columnName] ?? 0)),
      parseFloat(String(row[closeField.columnName] ?? 0)),
      parseFloat(String(row[lowField.columnName] ?? 0)),
      parseFloat(String(row[highField.columnName] ?? 0))
    ]);

    const categories = rows.map(row => String(row[dateField.columnName] ?? ""));

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
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "var(--color-border)",
          textStyle: { color: "var(--color-text)", fontSize: 11 }
        } : undefined,
        grid: { left: "4%", right: "4%", top: 45, bottom: 30, containLabel: true },
        xAxis: { type: "category", data: categories },
        yAxis: { type: "value" },
        series: [{
          name: "Candlestick",
          type: "candlestick",
          data: candleData,
          itemStyle: {
            color: "#10b981",
            color0: "#ef4444",
            borderColor: "#059669",
            borderColor0: "#dc2626"
          }
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        🕯️ Configure date, open, close, low, and high fields
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
