/* ============================================================
   KPI & DAX Engine
   ============================================================ */

import { DataTable, DataType } from "@/types";

export interface SuggestedKPI {
  name: string;
  formula: string;
  dax: string;
  type: DataType;
  description: string;
}

/**
 * Converts simplified syntax like SUM([Sales]) to internal JS rows.reduce(...)
 */
export function convertToJs(formula: string): string {
  let js = formula;

  // 1. Handle Aggregations
  // SUM([Column]) -> rows.reduce((s, r) => s + (Number(r["Column"]) || 0), 0)
  js = js.replace(/SUM\(\s*\[?(.*?)\]?\s*\)/gi, (_, col) => {
    return `rows.reduce((s, r) => s + (Number(r["${col}"]) || 0), 0)`;
  });

  // AVG([Column]) -> rows.length ? rows.reduce((s, r) => s + (Number(r["Column"]) || 0), 0) / rows.length : 0
  js = js.replace(/AVG\(\s*\[?(.*?)\]?\s*\)/gi, (_, col) => {
    return `(rows.length ? rows.reduce((s, r) => s + (Number(r["${col}"]) || 0), 0) / rows.length : 0)`;
  });

  // COUNT([Column]) -> rows.length
  js = js.replace(/COUNT\(\s*\[?(.*?)\]?\s*\)/gi, "rows.length");

  // DISTINCTCOUNT([Column]) -> new Set(rows.map(r => r["Column"])).size
  js = js.replace(/DISTINCTCOUNT\(\s*\[?(.*?)\]?\s*\)/gi, (_, col) => {
    return `new Set(rows.map(r => r["${col}"])).size`;
  });

  // MIN([Column]) -> Math.min(...rows.map(r => Number(r["Column"]) || 0))
  js = js.replace(/MIN\(\s*\[?(.*?)\]?\s*\)/gi, (_, col) => {
    return `Math.min(...rows.map(r => Number(r["${col}"]) || 0))`;
  });

  // MAX([Column]) -> Math.max(...rows.map(r => Number(r["Column"]) || 0))
  js = js.replace(/MAX\(\s*\[?(.*?)\]?\s*\)/gi, (_, col) => {
    return `Math.max(...rows.map(r => Number(r["${col}"]) || 0))`;
  });

  // 2. Handle simple column references [Col] -> (Number(row["Col"]) || 0)
  // Only if not already handled by aggregations
  js = js.replace(/\[(.*?)\]/g, (_, col) => {
    return `(Number(row["${col}"]) || 0)`;
  });

  return js;
}

/**
 * Converts any formula to a DAX-like string for display
 */
export function convertToDAX(formula: string, tableName: string = "Table"): string {
  let dax = formula;

  // If it's already JS, try to reverse it or just wrap it
  if (dax.includes("rows.reduce")) {
    dax = dax.replace(/rows\.reduce\(\(s, r\) => s \+ \(Number\(r\["(.*?)"\]\) \|\| 0\), 0\)/g, "SUM('${tableName}'[$1])");
  }

  // Handle simplified syntax [Col] -> 'Table'[Col]
  dax = dax.replace(/\[(.*?)\]/g, `'${tableName}'[$1]`);

  return dax;
}

/**
 * Generates suggested KPIs based on table schema
 */
export function generateKPIs(table: DataTable): SuggestedKPI[] {
  const kpis: SuggestedKPI[] = [];
  const numericCols = table.columns.filter(c => c.type === "number");
  const allCols = table.columns;

  // 1. Total for each numeric column
  numericCols.forEach(col => {
    kpis.push({
      name: `Total ${col.name}`,
      formula: `SUM([${col.name}])`,
      dax: `SUM('${table.name}'[${col.name}])`,
      type: "number",
      description: `Sum of all values in ${col.name}`
    });

    kpis.push({
      name: `Average ${col.name}`,
      formula: `AVG([${col.name}])`,
      dax: `AVERAGE('${table.name}'[${col.name}])`,
      type: "number",
      description: `Average value of ${col.name}`
    });
  });

  // 2. Count for all columns
  kpis.push({
    name: `Total Records`,
    formula: `COUNT([${allCols[0]?.name || "ID"}])`,
    dax: `COUNT('${table.name}'[${allCols[0]?.name || "ID"}])`,
    type: "number",
    description: "Total number of rows"
  });

  // 3. Distinct counts for non-numeric or categorical columns
  allCols.filter(c => c.type !== "number").slice(0, 3).forEach(col => {
    kpis.push({
      name: `Unique ${col.name}s`,
      formula: `DISTINCTCOUNT([${col.name}])`,
      dax: `DISTINCTCOUNT('${table.name}'[${col.name}])`,
      type: "number",
      description: `Number of unique values in ${col.name}`
    });
  });

  return kpis;
}
