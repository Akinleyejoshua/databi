"use client";

import { useMemo } from "react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

export default function SparklineChart({ config, tables, filters, height = 300 }: Props) {
  const { sparkData, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { sparkData: [], hasData: false };

    const table = tables?.find((t) => t.id === config.fields[0].tableId);
    if (!table || !table.rows) return { sparkData: [], hasData: false };

    const xField = config.fields[0];
    const yField = config.values[0];

    const data = table.rows.map(row => ({
      label: String(row[xField.columnName] ?? ""),
      value: parseFloat(String(row[yField.columnName] ?? 0))
    }));

    return { sparkData: data, hasData: data.length > 0 };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        ✨ Configure category and value fields
      </div>
    );
  }

  const minVal = Math.min(...sparkData.map(d => d.value));
  const maxVal = Math.max(...sparkData.map(d => d.value));
  const range = maxVal - minVal || 1;

  const width = 100 / sparkData.length;
  const baseHeight = height ? height * 0.6 : 60;

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: "12px", textAlign: "center" }}>
        {config.title}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: `${baseHeight}px`, gap: "2px", marginBottom: "8px" }}>
        {sparkData.map((item, idx) => {
          const heightPercent = ((item.value - minVal) / range) * 100;
          return (
            <div
              key={idx}
              title={`${item.label}: ${item.value}`}
              style={{
                width: `${width - 0.5}%`,
                height: `${Math.max(10, heightPercent)}%`,
                backgroundColor: "#3b82f6",
                borderRadius: "2px 2px 0 0",
                opacity: 0.8,
                transition: "opacity 0.2s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-text-secondary)" }}>
        <span>{minVal.toFixed(1)}</span>
        <span>{((minVal + maxVal) / 2).toFixed(1)}</span>
        <span>{maxVal.toFixed(1)}</span>
      </div>
    </div>
  );
}
