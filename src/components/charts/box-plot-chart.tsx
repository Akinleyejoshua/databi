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

function calculateQuartiles(data: number[]): [number, number, number, number, number] {
  const sorted = data.sort((a, b) => a - b);
  const q1_idx = Math.floor(sorted.length * 0.25);
  const q2_idx = Math.floor(sorted.length * 0.5);
  const q3_idx = Math.floor(sorted.length * 0.75);
  return [sorted[0], sorted[q1_idx], sorted[q2_idx], sorted[q3_idx], sorted[sorted.length - 1]];
}

export default function BoxPlotChart({ config, tables, filters, height = 300 }: Props) {
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
    
    const groups = new Map<string, number[]>();
    rows.forEach(row => {
      const category = String(row[fieldDef.columnName] ?? "Unknown");
      const value = parseFloat(String(row[valueField.columnName] ?? 0));
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category)!.push(value);
    });
    
    const categories = Array.from(groups.keys());
    const boxData = categories.map(cat => calculateQuartiles(groups.get(cat)!));
    
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
          textStyle: { color: "var(--color-text)", fontSize: 11 }
        } : undefined,
        grid: { left: "4%", right: "4%", top: 45, bottom: 30, containLabel: true },
        xAxis: { type: "category", data: categories },
        yAxis: { type: "value" },
        series: [{
          name: "Box Plot",
          type: "boxplot",
          data: boxData,
          itemStyle: { color: "#3b82f6", borderColor: "#2563eb" }
        }]
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
