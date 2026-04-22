/* ============================================================
   KPI Widget — High-level metric display
   ============================================================ */
"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/use-project-store";
import type { Widget } from "@/types";
import { applyFilters, computeAggregation, abbreviateNumber } from "@/lib/utils";

interface Props { widget: Widget; }

export default function KpiWidget({ widget }: Props) {
  const { project, activeFilters } = useProjectStore();
  const kpi = widget.kpiConfig;

  const value = useMemo(() => {
    if (!project || !kpi?.tableId || !kpi?.valueColumn) return null;
    const table = project.tables.find((t) => t.id === kpi.tableId);
    if (!table) return null;
    const rows = applyFilters(table, activeFilters);
    return computeAggregation(rows, kpi.valueColumn, kpi.aggregation);
  }, [project, kpi, activeFilters]);

  if (value === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
        Configure KPI settings
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "4px" }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {kpi?.label || "Metric"}
      </span>
      <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-primary)", lineHeight: 1.1 }}>
        {kpi?.prefix}{abbreviateNumber(value)}{kpi?.suffix}
      </span>
      <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
        {kpi?.aggregation} of {kpi?.valueColumn}
      </span>
    </div>
  );
}
