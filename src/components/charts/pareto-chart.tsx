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

export default function ParetoChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { option: null, hasData: false };

    const fieldDef = config.fields[0];
    const valueField = config.values[0];
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

    const data = rows
      .map(row => ({
        name: String(row[fieldDef.columnName] ?? "Unknown"),
        value: parseFloat(String(row[valueField.columnName] ?? 0))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    if (data.length === 0) return { option: null, hasData: false };

    let cumulative = 0;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const cumulativePercents = data.map(d => {
      cumulative += d.value;
      return (cumulative / total) * 100;
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
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "var(--color-border)",
          textStyle: {
            color: "var(--color-text)",
            fontSize: 11
          }
        } : undefined,
        grid: {
          left: "4%",
          right: "4%",
          top: 45,
          bottom: 30,
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: data.map(d => d.name)
        },
        yAxis: [
          { type: "value", name: "Frequency" },
          { type: "value", name: "Cumulative %" }
        ],
        series: [
          {
            name: "Frequency",
            type: "bar",
            data: data.map(d => d.value),
            itemStyle: { color: "#3b82f6" },
            yAxisIndex: 0
          },
          {
            name: "Cumulative %",
            type: "line",
            data: cumulativePercents,
            itemStyle: { color: "#ef4444" },
            yAxisIndex: 1,
            symbol: "circle",
            symbolSize: 6
          }
        ]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        📊 Configure category and value fields
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
