"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { applyFilters } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

export default function GaugeChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.values.length) return { option: null, hasData: false };

    const valueField = config.values[0];
    const table = tables?.find((t) => t.id === valueField.tableId);
    if (!table || !table.rows.length) return { option: null, hasData: false };

    const rows = applyFilters(table, filters || []);
    if (rows.length === 0) return { option: null, hasData: false };

    const value = parseFloat(String(rows[0][valueField.columnName] ?? 0));
    const maxValue = 100;

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
        series: [{
          type: "gauge",
          startAngle: 225,
          endAngle: -45,
          min: 0,
          max: maxValue,
          progress: {
            itemStyle: {
              color: "#3b82f6"
            }
          },
          axisLine: {
            lineStyle: {
              color: [[1, "#ddd"]]
            }
          },
          axisTick: {
            distance: 8
          },
          splitLine: {
            distance: 8
          },
          axisLabel: {
            color: "var(--color-text-secondary)",
            distance: 16
          },
          detail: {
            valueAnimation: true,
            formatter: "{value}%",
            color: "var(--color-text)",
            fontSize: 16
          },
          data: [{ value, name: valueField.columnName }]
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        🎯 Configure a value field
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
