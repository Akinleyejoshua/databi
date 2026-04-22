/* ============================================================
   Measure Engine
   Executes measure formulas against table data
   ============================================================ */

import type { DataTable, Measure } from "@/types";

/**
 * Execute a measure formula against table data
 * Returns the calculated value
 */
export const executeMeasure = (
  measure: Measure,
  table: DataTable,
  rows: Record<string, unknown>[] = table.rows
): number | null => {
  if (!measure || !rows || rows.length === 0) {
    return null;
  }

  try {
    // Create a function that can execute the measure formula
    // The formula has access to individual row data and the entire rows array
    const formulaFn = new Function(
      "row",
      "rows",
      `try { return ${measure.formula}; } catch(e) { console.error('Measure error:', e); return 0; }`
    );

    // For aggregate measures, we need to calculate across all rows
    // The formula should handle both row-level and aggregate calculations
    let result: number | null = null;

    // Try to execute as an aggregate function first
    try {
      result = formulaFn(null, rows);
      if (result !== null && result !== undefined) {
        return Number(result);
      }
    } catch (e) {
      // If aggregate fails, try row-level aggregation
      console.warn("Measure aggregate execution failed:", e);
    }

    // Fallback: execute for each row and sum (for SUM aggregation)
    const values: number[] = [];
    for (const row of rows) {
      try {
        const rowResult = formulaFn(row, rows);
        if (rowResult !== null && rowResult !== undefined) {
          values.push(Number(rowResult));
        }
      } catch (e) {
        console.warn("Row execution failed:", e);
      }
    }

    // Sum all row values as fallback aggregation
    result = values.length > 0 ? values.reduce((a, b) => a + b, 0) : 0;
    return result;
  } catch (error) {
    console.error("Measure execution error:", error);
    return null;
  }
};

/**
 * Resolve a value that could be either a column name or a measure name
 */
export const resolveValue = (
  valueIdentifier: string,
  tableId: string,
  table: DataTable,
  measures: Measure[],
  rows: Record<string, unknown>[] = table.rows
): number | null => {
  // Check if it's a measure
  const measure = measures.find(
    (m) => m.id === valueIdentifier || m.name === valueIdentifier
  );

  if (measure && measure.tableId === tableId) {
    return executeMeasure(measure, table, rows);
  }

  // Otherwise treat it as a column and compute aggregation
  // Return the sum of the column values
  try {
    const values = rows
      .map((row) => {
        const val = row[valueIdentifier];
        return val !== null && val !== undefined ? Number(val) : 0;
      })
      .filter((v) => !isNaN(v));

    return values.length > 0 ? values.reduce((a, b) => a + b, 0) : null;
  } catch (error) {
    console.error("Value resolution error:", error);
    return null;
  }
};

/**
 * Get measure by name or id
 */
export const getMeasure = (
  identifier: string,
  measures: Measure[]
): Measure | undefined => {
  return measures.find((m) => m.id === identifier || m.name === identifier);
};

/**
 * Check if a value identifier is a measure
 */
export const isMeasure = (
  valueIdentifier: string,
  measures: Measure[]
): boolean => {
  return measures.some((m) => m.id === valueIdentifier || m.name === valueIdentifier);
};
