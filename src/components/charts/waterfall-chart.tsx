"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { CHART_COLORS, applyFilters, joinTables } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

export default function WaterfallChart({ config, tables, filters, height = 300 }: Props) {
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
    
    // Sample waterfall: Starting value + incremental changes
    const items = rows.slice(0, 8).map((row, idx) => ({
      name: String(row[fieldDef.columnName] ?? `Step ${idx + 1}`),
      value: parseFloat(String(row[valueField.columnName] ?? 0))
    }));
    
    if (items.length === 0) return { option: null, hasData: false };
    
    const data: any[] = [items[0].value];
    let runningTotal = items[0].value;
    for (let i = 1; i < items.length; i++) {
      const change = items[i].value;
      runningTotal += change;
      data.push(change);
    }
    
    const colors = config.colorScheme?.length ? config.colorScheme : CHART_COLORS;
    
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
          textStyle: { color: "var(--color-text)", fontSize: 11 }
        } : undefined,
        grid: { left: "4%", right: "4%", top: 45, bottom: 30, containLabel: true },
        xAxis: { type: "category", data: items.map(i => i.name) },
        yAxis: { type: "value" },
        series: [{
          name: "Waterfall",
          type: "bar",
          data: data.map((v, i) => ({
            value: v,
            itemStyle: { color: v >= 0 ? "#10b981" : "#ef4444" }
          })),
          stack: "waterfall"
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
