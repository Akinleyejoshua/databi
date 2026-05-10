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

export default function SankeyChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || config.values.length < 2) return { option: null, hasData: false };

    const sourceField = config.fields[0];
    const targetField = config.fields.length > 1 ? config.fields[1] : null;
    const valueField = config.values[0];

    const table = tables?.find((t) => t.id === sourceField.tableId);
    if (!table || !table.rows) return { option: null, hasData: false };

    // Get filtered and joined data
    const valueTableIds = [...new Set(config.values.map(v => v.tableId))].filter(id => id !== sourceField.tableId);
    let rows: Record<string, unknown>[] = [];
    if (valueTableIds.length > 0) {
      const tablesToJoin = tables.filter(t => t.id === sourceField.tableId || valueTableIds.includes(t.id));
      rows = joinTables(tablesToJoin, [], filters);
    } else {
      rows = applyFilters(table, filters || []);
    }

    const nodes = new Set<string>();
    const links: { source: string; target: string; value: number }[] = [];

    rows.forEach(row => {
      const source = String(row[sourceField.columnName] ?? "Unknown");
      const target = targetField ? String(row[targetField.columnName] ?? "Unknown") : String(row[valueField.columnName] ?? "Unknown");
      const value = parseFloat(String(row[valueField.columnName] ?? 0));

      nodes.add(source);
      nodes.add(target);

      const existing = links.find(l => l.source === source && l.target === target);
      if (existing) {
        existing.value += value;
      } else {
        links.push({ source, target, value });
      }
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
        series: [{
          type: "sankey",
          data: Array.from(nodes).map(n => ({ name: n })),
          links,
          orient: "horizontal",
          label: { position: "right", fontSize: 10, color: "var(--color-text-secondary)" },
          lineStyle: { color: "rgba(37, 99, 235, 0.2)", curveness: 0.5 }
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        📊 Configure source, target, and value fields
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
