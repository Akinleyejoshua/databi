/* ============================================================
   KPI Widget — High-level metric display
   ============================================================ */
"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/use-project-store";
import type { Widget } from "@/types";
import { applyFilters, computeAggregation, abbreviateNumber } from "@/lib/utils";
import { executeMeasure, isMeasure, getMeasure, resolveValue } from "@/lib/measure-engine";

interface Props { widget: Widget; }

export default function KpiWidget({ widget }: Props) {
  const { project, activeFilters } = useProjectStore();
  const kpi = widget.kpiConfig;

  const value = useMemo(() => {
    if (!project || !kpi?.tableId || !kpi?.valueColumn) return null;
    const table = project.tables.find((t) => t.id === kpi.tableId);
    if (!table) return null;
    
    const rows = applyFilters(table, activeFilters);

    // Check if valueColumn is a measure
    if (isMeasure(kpi.valueColumn, project.measures)) {
      const measure = getMeasure(kpi.valueColumn, project.measures);
      if (measure) {
        return executeMeasure(measure, table, rows);
      }
    }

    // Otherwise, compute as regular column aggregation
    return computeAggregation(rows, kpi.valueColumn, kpi.aggregation);
  }, [project, kpi, activeFilters]);

  if (value === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
        Configure KPI settings
      </div>
    );
  }

  // Get the display label (could be measure name or column name)
  const displayLabel = useMemo(() => {
    if (!kpi?.valueColumn || !project) return "Metric";
    
    const measure = getMeasure(kpi.valueColumn, project.measures);
    if (measure) {
      return measure.name;
    }
    
    return kpi?.label || "Metric";
  }, [kpi?.valueColumn, project, project?.measures]);

  // Format value with currency if specified
  const formatValue = (num: number) => {
    if (kpi?.currency) {
      try {
        const decimalPlaces = kpi?.decimalPlaces ?? 2;
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: kpi.currency,
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(num);
      } catch (error) {
        // Fallback if currency code is invalid
        return `${kpi?.prefix || ""}${abbreviateNumber(num)}${kpi?.suffix || ""}`;
      }
    }
    return `${kpi?.prefix || ""}${abbreviateNumber(num)}${kpi?.suffix || ""}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "4px" }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {displayLabel}
      </span>
      <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-primary)", lineHeight: 1.1 }}>
        {formatValue(value)}
      </span>
      <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
        {isMeasure(kpi?.valueColumn || "", project?.measures || []) ? "Calculated Measure" : kpi?.aggregation + " of " + kpi?.valueColumn}
      </span>
    </div>
  );
}
