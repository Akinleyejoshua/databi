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

export default function RAGStatusChart({ config, tables, filters, height = 300 }: Props) {
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
    
    const categoryField = config.fields[0];
    const valueField = config.values[0];
    
    const ragData = rows.map(row => {
      const value = parseFloat(String(row[valueField.columnName] ?? 0));
      let color = "#ef4444"; // Red for bad
      if (value >= 80) color = "#10b981"; // Green for good
      else if (value >= 60) color = "#f59e0b"; // Amber for warning
      
      return {
        name: String(row[categoryField.columnName] ?? ""),
        value,
        itemStyle: { color }
      };
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
        grid: {
          left: "4%",
          right: "4%",
          top: 45,
          bottom: 30,
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: ragData.map(d => d.name)
        },
        yAxis: {
          type: "value",
          max: 100
        },
        series: [{
          name: valueField.columnName,
          type: "bar",
          data: ragData,
          barWidth: "60%"
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        🚦 Configure category and value fields
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
