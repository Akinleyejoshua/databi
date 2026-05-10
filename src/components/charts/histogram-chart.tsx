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

export default function HistogramChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.values.length) return { option: null, hasData: false };

    const valueField = config.values[0];
    const table = tables?.find((t) => t.id === valueField.tableId);
    if (!table || !table.rows) return { option: null, hasData: false };

    // Get filtered and joined data
    const valueTableIds = [...new Set(config.values.map(v => v.tableId))];
    let rows: Record<string, unknown>[] = [];
    if (valueTableIds.length > 1) {
      const tablesToJoin = tables.filter(t => valueTableIds.includes(t.id));
      rows = joinTables(tablesToJoin, [], filters);
    } else {
      rows = applyFilters(table, filters || []);
    }

    if (rows.length === 0) return { option: null, hasData: false };

    const values = rows.map(r => parseFloat(String(r[valueField.columnName] ?? 0))).sort((a, b) => a - b);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const binCount = Math.ceil(Math.sqrt(values.length));
    const binSize = (maxVal - minVal) / binCount || 1;

    const bins: number[] = new Array(binCount).fill(0);
    values.forEach(v => {
      const binIdx = Math.floor((v - minVal) / binSize);
      bins[Math.min(binIdx, binCount - 1)]++;
    });

    const categories = bins.map((_, i) => {
      const start = minVal + i * binSize;
      const end = start + binSize;
      return `${start.toFixed(1)}-${end.toFixed(1)}`;
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
          data: categories
        },
        yAxis: {
          type: "value"
        },
        series: [{
          name: "Frequency",
          type: "bar",
          data: bins,
          itemStyle: {
            color: "#3b82f6",
            borderRadius: [4, 4, 0, 0]
          }
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: `${height}px`, 
        color: "var(--color-text-tertiary)" 
      }}>
        📊 Configure a numeric value field
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
