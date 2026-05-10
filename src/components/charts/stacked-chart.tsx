"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter, Measure, Relationship } from "@/types";
import { applyFilters, joinTables, abbreviateNumber, getCurrencySymbol, parseSafeNumber, CHART_COLORS } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  relationships?: Relationship[];
  measures?: Measure[];
  height?: number;
}

export default function StackedChart({ config, tables, filters, relationships = [], measures = [], height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { option: null, hasData: false };

    const fieldDef = config.fields[0];
    const table = tables?.find((t) => t.id === fieldDef.tableId);
    if (!table || !table.rows) return { option: null, hasData: false };

    const valueTableIds = [...new Set(config.values.map(v => v.tableId))].filter(id => id !== fieldDef.tableId);
    let rows: Record<string, unknown>[] = [];

    if (valueTableIds.length > 0 && relationships?.length > 0) {
      const tablesToJoin = tables.filter(t => t.id === fieldDef.tableId || valueTableIds.includes(t.id));
      rows = joinTables(tablesToJoin, relationships, filters);
    } else {
      rows = applyFilters(table, filters || []);
    }

    if (rows.length === 0) return { option: null, hasData: false };

    const categoriesSet = new Set<string>();
    const groups = new Map<string, Record<string, unknown>[]>();

    rows.forEach(row => {
      const val = String(row[fieldDef.columnName] ?? "Blank");
      categoriesSet.add(val);
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val)!.push(row);
    });

    const categories = Array.from(categoriesSet);
    const colors = config.colorScheme?.length ? config.colorScheme : CHART_COLORS;

    const series = config.values.map((v, i) => {
      const data = categories.map((cat) => {
        const matching = groups.get(cat) || [];
        const vals = matching.map((r) => parseSafeNumber(r[v.columnName]));
        const agg = v.aggregation || "sum";

        switch (agg) {
          case "sum": return vals.reduce((a, b) => a + b, 0);
          case "average": return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          case "count": return matching.length;
          case "min": return vals.length ? Math.min(...vals) : 0;
          case "max": return vals.length ? Math.max(...vals) : 0;
          default: return vals[0] || 0;
        }
      });

      return {
        name: v.columnName,
        type: config.chartType === "stacked-bar" ? "bar" : "bar",
        data,
        stack: "total",
        itemStyle: { color: colors[i % colors.length] },
        borderRadius: config.chartType === "stacked-bar" ? [0, 4, 4, 0] : [4, 4, 0, 0],
      };
    });

    const isHorizontalBar = config.chartType === "stacked-bar";

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
        legend: config.showLegend ? { bottom: 4, textStyle: { fontSize: 10, color: "var(--color-text-secondary)" } } : undefined,
        grid: { left: "4%", right: "4%", top: 45, bottom: config.showLegend ? 45 : 30, containLabel: true },
        xAxis: isHorizontalBar ? { type: "value", axisLabel: { fontSize: 10 } } : {
          type: "category",
          data: categories,
          axisLabel: { rotate: categories.length > 8 ? 30 : 0, fontSize: 10 }
        },
        yAxis: isHorizontalBar ? { type: "category", data: categories } : { type: "value", axisLabel: { fontSize: 10 } },
        series,
        animation: true,
        animationDuration: 1000,
      }
    };
  }, [config, tables, filters, measures, relationships]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)", fontSize: "12px" }}>
        📊 No data available
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
