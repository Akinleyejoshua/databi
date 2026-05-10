"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { applyFilters, joinTables, CHART_COLORS } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

export default function RadarChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { option: null, hasData: false };

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

    const categories = Array.from(new Set(rows.map(r => String(r[fieldDef.columnName] ?? "Unknown")))).slice(0, 8);
    const colors = config.colorScheme?.length ? config.colorScheme : CHART_COLORS;

    const series = config.values.map((v, i) => {
      const data = categories.map(cat => {
        const row = rows.find(r => String(r[fieldDef.columnName]) === cat);
        return parseFloat(String(row?.[v.columnName] ?? 0));
      });
      return {
        name: v.columnName,
        value: data,
        itemStyle: { color: colors[i % colors.length] }
      };
    });

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
          trigger: "item",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "var(--color-border)",
          textStyle: { color: "var(--color-text)", fontSize: 11 }
        } : undefined,
        legend: config.showLegend ? { bottom: 4, textStyle: { fontSize: 10 } } : undefined,
        radar: { indicator: categories.map(c => ({ name: c, max: 100 })) },
        series: [{
          type: "radar",
          data: series.map((s, i) => ({
            name: s.name,
            value: s.value,
            itemStyle: { color: colors[i % colors.length] },
            areaStyle: { opacity: 0.3 }
          }))
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        🕷️ Configure category and value fields
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
