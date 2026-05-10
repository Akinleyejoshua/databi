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

export default function DotPlotChart({ config, tables, filters, height = 300 }: Props) {
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

    if (rows.length === 0) return { option: null, hasData: false };

    const colors = config.colorScheme?.length ? config.colorScheme : CHART_COLORS;
    const data = rows.map((row, idx) => ({
      name: String(row[fieldDef.columnName] ?? `Point ${idx + 1}`),
      value: parseFloat(String(row[valueField.columnName] ?? 0)),
      itemStyle: { color: colors[idx % colors.length] }
    }));

    const categories = data.map(d => d.name);

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
          name: valueField.columnName,
          type: "scatter",
          symbolSize: 12,
          data: data.map((d, i) => ({
            value: d.value,
            itemStyle: { color: colors[i % colors.length] }
          })),
          label: { show: false }
        }]
      }
    };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        ⚫ Configure category and value fields
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
