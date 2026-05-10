"use client";

import { useMemo } from "react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { applyFilters, joinTables } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

export default function PictographChart({ config, tables, filters, height = 300 }: Props) {
  const { data, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { data: [], hasData: false };

    const fieldDef = config.fields[0];
    const valueField = config.values[0];
    const table = tables?.find((t) => t.id === fieldDef.tableId);
    if (!table || !table.rows) return { data: [], hasData: false };

    // Get filtered and joined data
    const valueTableIds = [...new Set(config.values.map(v => v.tableId))].filter(id => id !== fieldDef.tableId);
    let rows: Record<string, unknown>[] = [];
    if (valueTableIds.length > 0) {
      const tablesToJoin = tables.filter(t => t.id === fieldDef.tableId || valueTableIds.includes(t.id));
      rows = joinTables(tablesToJoin, [], filters);
    } else {
      rows = applyFilters(table, filters || []);
    }

    if (rows.length === 0) return { data: [], hasData: false };

    const items = rows.slice(0, 8).map(r => ({
      label: String(r[fieldDef.columnName] ?? "Unknown"),
      value: Math.round(parseFloat(String(r[valueField.columnName] ?? 0)))
    }));

    return { data: items, hasData: items.length > 0 };
  }, [config, tables, filters]);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        🎨 Configure category and value fields
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", height: `${height}px`, overflowY: "auto" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: "16px", textAlign: "center" }}>
        {config.title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {data.map(item => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{item.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)" }}>{item.value}</span>
            </div>
            <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
              {Array.from({ length: Math.min(item.value, 20) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#3b82f6",
                    borderRadius: "2px"
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
