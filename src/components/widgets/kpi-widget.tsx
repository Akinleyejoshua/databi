/* ============================================================
   KPI Widget — High-level metric display
   ============================================================ */
"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/use-project-store";
import type { Widget } from "@/types";
import { applyFilters, computeAggregation, abbreviateNumber, getCurrencySymbol } from "@/lib/utils";
import { executeMeasure, isMeasure, getMeasure, resolveValue } from "@/lib/measure-engine";

interface Props { widget: Widget; }

export default function KpiWidget({ widget }: Props) {
  const { project, activeFilters } = useProjectStore();
  const kpi = widget.kpiConfig;

  // Format value with currency if specified
  const formatValue = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "-";
    if (kpi?.currency) {
      const symbol = getCurrencySymbol(kpi.currency);
      const decimalPlaces = kpi?.decimalPlaces ?? 2;
      const formatted = num.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
      return `${symbol}${formatted}`;
    }
    return `${kpi?.prefix || ""}${abbreviateNumber(num)}${kpi?.suffix || ""}`;
  };

  const value = useMemo(() => {
    if (!project || !kpi?.tableId || !kpi?.valueColumn) return null;
    const table = project.tables.find((t) => t.id === kpi.tableId);
    if (!table) return null;
    
    const rows = applyFilters(table, activeFilters);

    // Check if valueColumn is a measure
    if (isMeasure(kpi.valueColumn, project.measures)) {
      const measure = getMeasure(kpi.valueColumn, project.measures);
      if (measure) {
        const result = executeMeasure(measure, table, rows);
        return result === null ? 0 : result;
      }
    }

    // Otherwise, compute as regular column aggregation
    const aggResult = computeAggregation(rows, kpi.valueColumn, kpi.aggregation);
    return isNaN(aggResult) ? 0 : aggResult;
  }, [project, kpi, activeFilters]);

  const comparisonValue = useMemo(() => {
    if (!project || !kpi?.tableId || !kpi?.comparisonColumn) return null;
    const table = project.tables.find((t) => t.id === kpi.tableId);
    if (!table) return null;
    
    const rows = applyFilters(table, activeFilters);
    const agg = kpi.comparisonAggregation || kpi.aggregation;
    const aggResult = computeAggregation(rows, kpi.comparisonColumn, agg);
    return isNaN(aggResult) ? null : aggResult;
  }, [project, kpi, activeFilters]);

  const trendInfo = useMemo(() => {
    if (value === null || comparisonValue === null) return null;
    if (comparisonValue === 0) return null;
    const diff = value - comparisonValue;
    const percent = (diff / comparisonValue) * 100;
    const formattedPercent = percent.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return {
      percent,
      isPositive: percent > 0,
      isZero: percent === 0,
      formatted: `${percent > 0 ? "+" : ""}${formattedPercent}%`
    };
  }, [value, comparisonValue]);

  // Get the display label (could be measure name or column name)
  const displayLabel = useMemo(() => {
    if (!kpi?.valueColumn || !project) return "Metric";
    
    const measure = getMeasure(kpi.valueColumn, project.measures);
    if (measure) {
      return measure.name;
    }
    
    return kpi?.label || "Metric";
  }, [kpi?.valueColumn, kpi?.label, project, project?.measures]);

  if (!kpi?.tableId || !kpi?.valueColumn) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
        Configure KPI settings
      </div>
    );
  }

  const presetTextColor = widget.style.textColor;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "4px", color: presetTextColor }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: presetTextColor || "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {displayLabel}
      </span>
      <span style={{ fontSize: "32px", fontWeight: 800, color: presetTextColor || "var(--color-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {formatValue(value ?? 0)}
      </span>
      {trendInfo && (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2.5px",
          fontSize: "11px",
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: "6px",
          backgroundColor: trendInfo.isZero 
            ? "var(--color-bg-secondary)" 
            : (trendInfo.isPositive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)"),
          color: trendInfo.isZero 
            ? "var(--color-text-secondary)" 
            : (trendInfo.isPositive ? "var(--color-success)" : "var(--color-danger)"),
          marginTop: "2px",
          marginBottom: "2px"
        }}>
          {trendInfo.isZero ? "" : (trendInfo.isPositive ? "▲" : "▼")} {trendInfo.formatted}
        </span>
      )}
      <span style={{ fontSize: "10px", color: presetTextColor || "var(--color-text-tertiary)", opacity: 0.8 }}>
        {isMeasure(kpi?.valueColumn || "", project?.measures || []) 
          ? "Calculated Measure" 
          : `${kpi?.aggregation} of ${kpi?.valueColumn}`}
        {kpi?.comparisonColumn && ` vs ${kpi.comparisonAggregation || kpi.aggregation} of ${kpi.comparisonColumn}`}
      </span>
    </div>
  );
}
