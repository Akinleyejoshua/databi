/* ============================================================
   Utility Functions
   ============================================================ */

import type { DataTable, ActiveFilter, Relationship } from "@/types";

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format a number with commas and optional decimal places
 */
export function formatNumber(
  value: number,
  decimals: number = 0
): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Abbreviated number (1K, 1M, 1B)
 */
export function abbreviateNumber(value: number): string {
  if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + "M";
  if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + "K";
  return value.toFixed(0);
}

/**
 * Apply global slicer/filter state to table rows
 */
export function applyFilters(
  table: DataTable,
  filters: ActiveFilter[]
): Record<string, unknown>[] {
  let rows = [...table.rows];

  for (const filter of filters) {
    if (filter.tableId === table.id && filter.values.length > 0) {
      rows = rows.filter((row) =>
        filter.values.includes(row[filter.columnName])
      );
    }
  }

  return rows;
}

/**
 * Get linked data from related tables via joins
 */
export function joinTables(
  sourceTables: DataTable[],
  relationships: Relationship[],
  filters: ActiveFilter[]
): Record<string, unknown>[] {
  if (sourceTables.length === 0) return [];
  if (sourceTables.length === 1) {
    return applyFilters(sourceTables[0], filters);
  }

  let result = applyFilters(sourceTables[0], filters);

  for (let i = 1; i < sourceTables.length; i++) {
    const nextTable = sourceTables[i];
    const nextRows = applyFilters(nextTable, filters);

    const rel = relationships.find(
      (r) =>
        (r.sourceTableId === sourceTables[0].id &&
          r.targetTableId === nextTable.id) ||
        (r.targetTableId === sourceTables[0].id &&
          r.sourceTableId === nextTable.id)
    );

    if (!rel) continue;

    const isForward = rel.sourceTableId === sourceTables[0].id;
    const leftCol = isForward ? rel.sourceColumn : rel.targetColumn;
    const rightCol = isForward ? rel.targetColumn : rel.sourceColumn;

    const joined: Record<string, unknown>[] = [];
    for (const leftRow of result) {
      for (const rightRow of nextRows) {
        if (leftRow[leftCol] === rightRow[rightCol]) {
          joined.push({
            ...leftRow,
            ...Object.fromEntries(
              Object.entries(rightRow).map(([k, v]) => [
                k === leftCol ? k : `${nextTable.name}.${k}`,
                v,
              ])
            ),
          });
        }
      }
    }

    result = joined;
  }

  return result;
}

/**
 * Compute aggregation on a column
 */
export function computeAggregation(
  rows: Record<string, unknown>[],
  column: string,
  aggregation: "sum" | "average" | "count" | "min" | "max"
): number {
  if (aggregation === "count") return rows.length;

  const values = rows
    .map((r) => Number(r[column]))
    .filter((v) => !isNaN(v));

  if (values.length === 0) return 0;

  switch (aggregation) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "average":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
  }
}

/**
 * Detect column data type from values
 */
export function detectColumnType(
  values: unknown[]
): "string" | "number" | "boolean" | "date" {
  const sample = values.filter((v) => v !== null && v !== undefined && v !== "").slice(0, 100);

  if (sample.length === 0) return "string";

  const allNumbers = sample.every((v) => !isNaN(Number(v)));
  if (allNumbers) return "number";

  const allBooleans = sample.every(
    (v) =>
      typeof v === "boolean" ||
      String(v).toLowerCase() === "true" ||
      String(v).toLowerCase() === "false"
  );
  if (allBooleans) return "boolean";

  const allDates = sample.every((v) => {
    const d = new Date(String(v));
    return !isNaN(d.getTime()) && String(v).length > 4;
  });
  if (allDates) return "date";

  return "string";
}

/**
 * Default widget style
 */
export function getDefaultWidgetStyle() {
  return {
    backgroundColor: "var(--color-surface)",
    textColor: "var(--color-text)",
    fontSize: 14,
    fontWeight: "400",
    borderRadius: 10,
    borderColor: "var(--color-border)",
    borderWidth: 1,
    padding: 16,
    opacity: 1,
  };
}

/**
 * Default chart colors
 */
export const CHART_COLORS = [
  "#4169E1",
  "#6C8EF2",
  "#2F52C7",
  "#1A3A9E",
  "#8BA4F5",
  "#A3B9F8",
  "#0D2878",
  "#3D5FC4",
  "#5577DD",
  "#7A97EE",
];

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
