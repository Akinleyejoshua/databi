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

export default function StepChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { option: null, hasData: false };

    const fieldDef = config.fields[0];
    const table = tables?.find((t) => t.id === fieldDef.tableId);
    if (!table || !table.rows) return { option: null, hasData: false };

    const rows = applyFilters(table, filters || []);
    if (rows.length === 0) return { option: null, hasData: false };

    const categories = rows.map(r => String(r[fieldDef.columnName] ?? "Unknown"));
    const valueField = config.values[0];
    const data = rows.map(r => parseFloat(String(r[valueField.columnName] ?? 0)));

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
          name: valueField.columnName,
          type: "line",
          step: "start",
          data,
          smooth: false,
          itemStyle: { color: "#3b82f6" },
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.2 },
          symbol: "circle",
          symbolSize: 6
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        📈 Configure category and value fields
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
