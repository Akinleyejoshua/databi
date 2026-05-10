"use client";

import { useMemo } from "react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { applyFilters } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

type RAGStatus = "red" | "amber" | "green";

export default function RAGStatusChart({ config, tables, filters, height = 300 }: Props) {
  const { statuses, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { statuses: [], hasData: false };

    const fieldDef = config.fields[0];
    const table = tables?.find((t) => t.id === fieldDef.tableId);
    if (!table || !table.rows) return { statuses: [], hasData: false };

    const rows = applyFilters(table, filters || []);
    if (rows.length === 0) return { statuses: [], hasData: false };

    const items = rows.slice(0, 10).map(row => {
      const label = String(row[fieldDef.columnName] ?? "Item");
      const value = parseFloat(String(row[config.values[0].columnName] ?? 0));

      let status: RAGStatus = "green";
      if (value < 33) status = "red";
      else if (value < 67) status = "amber";

      return { label, value, status };
    });

    return { statuses: items, hasData: items.length > 0 };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        🚦 Configure category and value fields
      </div>
    );
  }

  const statusColors = {
    red: "#ef4444",
    amber: "#f59e0b",
    green: "#10b981"
  };

  return (
    <div style={{ padding: "16px", height: `${height}px`, overflowY: "auto" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: "16px", textAlign: "center" }}>
        {config.title}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {statuses.map(item => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text)" }}>{item.label}</span>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{item.value}%</span>
            </div>
            <div style={{ height: "8px", backgroundColor: "var(--color-border)", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{ height: "100%", width: `${item.value}%`, backgroundColor: statusColors[item.status], transition: "width 0.3s ease" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
