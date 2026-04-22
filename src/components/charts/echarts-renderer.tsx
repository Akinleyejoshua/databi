/* ============================================================
   ECharts Renderer — Renders all chart types
   ============================================================ */
"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { applyFilters, CHART_COLORS } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  width?: number;
  height?: number;
}

export default function EChartsRenderer({ config, tables, filters, height = 300 }: Props) {
  const option = useMemo(() => {
    if (!config.fields.length || !config.values.length) return null;

    const fieldDef = config.fields[0];
    const table = tables.find((t) => t.id === fieldDef.tableId);
    if (!table) return null;

    const rows = applyFilters(table, filters);
    const categories = [...new Set(rows.map((r) => String(r[fieldDef.columnName])))];
    const colors = config.colorScheme?.length ? config.colorScheme : CHART_COLORS;

    const series = config.values.map((v, i) => {
      const vTable = tables.find((t) => t.id === v.tableId);
      const vRows = vTable ? applyFilters(vTable, filters) : rows;

      const data = categories.map((cat) => {
        const matching = vRows.filter((r) => String(r[fieldDef.columnName]) === cat);
        const vals = matching.map((r) => Number(r[v.columnName])).filter((n) => !isNaN(n));

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

      switch (config.chartType) {
        case "bar": return { ...base, type: "bar" };
        case "column": return { ...base, type: "bar" };
        case "line": case "time-series": return { ...base, type: "line", smooth: true };
        case "area": return { ...base, type: "line", smooth: true, areaStyle: { opacity: 0.3 } };
        case "scatter": return { ...base, type: "scatter", symbolSize: 10 };
        case "pie": case "donut":
          return {
            type: "pie",
            name: v.columnName,
            radius: config.chartType === "donut" ? ["40%", "70%"] : "70%",
            data: categories.map((cat, j) => ({ name: cat, value: data[j], itemStyle: { color: colors[j % colors.length] } })),
            label: { show: true, fontSize: 11 },
          };
        default: return { ...base, type: "bar" };
      }
    });

    const isPie = config.chartType === "pie" || config.chartType === "donut";
    const isHorizontalBar = config.chartType === "bar";

    return {
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
    };
  }, [config, tables, filters]);

  if (!option) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-tertiary)", fontSize: "13px", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontSize: "24px" }}>📊</span>
        <span>Configure Fields & Values</span>
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />;
}
