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

export default function HeatmapChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || config.values.length < 2) return { option: null, hasData: false };

    const xField = config.fields[0];
    const yField = config.fields.length > 1 ? config.fields[1] : config.fields[0];
    const valueField = config.values[0];

    const table = tables?.find((t) => t.id === xField.tableId);
    if (!table || !table.rows) return { option: null, hasData: false };

    // Get filtered and joined data
    const valueTableIds = [...new Set(config.values.map(v => v.tableId))].filter(id => id !== xField.tableId);
    let rows: Record<string, unknown>[] = [];
    if (valueTableIds.length > 0) {
      const tablesToJoin = tables.filter(t => t.id === xField.tableId || valueTableIds.includes(t.id));
      rows = joinTables(tablesToJoin, [], filters);
    } else {
      rows = applyFilters(table, filters || []);
    }

    const xValues = new Set<string>();
    const yValues = new Set<string>();
    const heatData: [number, number, number][] = [];
    const xMap = new Map<string, number>();
    const yMap = new Map<string, number>();

    rows.forEach(row => {
      const x = String(row[xField.columnName] ?? "Unknown");
      const y = String(row[yField.columnName] ?? "Unknown");
      const value = parseFloat(String(row[valueField.columnName] ?? 0));
      xValues.add(x);
      yValues.add(y);
      if (!xMap.has(x)) xMap.set(x, xMap.size);
      if (!yMap.has(y)) yMap.set(y, yMap.size);
      heatData.push([xMap.get(x)!, yMap.get(y)!, value]);
    });

    const xCategories = Array.from(xValues);
    const yCategories = Array.from(yValues);

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
        xAxis: { type: "category", data: xCategories },
        yAxis: { type: "category", data: yCategories },
        visualMap: {
          min: 0,
          max: Math.max(...heatData.map(d => d[2]), 100),
          inRange: {
            color: ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"]
          },
          orient: "vertical",
          right: 10
        },
        series: [{
          name: valueField.columnName,
          type: "heatmap",
          data: heatData,
          itemStyle: { borderRadius: 4 }
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        🔥 Configure X, Y, and value fields
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
