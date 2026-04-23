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

  // Helper to replace [Col] with r["Col"] inside a string
  // Using [^"']+ prevents matching already replaced JS array notation like r["Col"]
  const replaceCols = (str: string, rowVar: string = "r") => {
    return str.replace(/\[([^"']+?)\]/g, (_, col) => `(Number(${rowVar}["${col.trim()}"]) || 0)`);
  };

  // 1. Handle Aggregations with complex expressions
  // SUM([Price] * [Qty]) -> rows.reduce((s, r) => s + ((Number(r["Price"])||0) * (Number(r["Qty"])||0)), 0)
  js = js.replace(/SUM\(\s*(.*?)\s*\)/gi, (_, inner) => {
    return `rows.reduce((s, r) => s + ${replaceCols(inner, "r")}, 0)`;
  });

  // AVG([Col])
  js = js.replace(/AVG\(\s*(.*?)\s*\)/gi, (_, inner) => {
    return `(rows.length ? rows.reduce((s, r) => s + ${replaceCols(inner, "r")}, 0) / rows.length : 0)`;
  });

  // COUNT([Col])
  js = js.replace(/COUNT\(\s*(.*?)\s*\)/gi, "rows.length");

  // DISTINCTCOUNT([Col])
  js = js.replace(/DISTINCTCOUNT\(\s*\[?(.*?)\]?\s*\)/gi, (_, col) => {
    const cleanCol = col.trim().replace(/^\[|\]$/g, "").replace(/["']/g, "");
    return `new Set(rows.map(r => r["${cleanCol}"])).size`;
  });

  // MIN([Col])
  js = js.replace(/MIN\(\s*(.*?)\s*\)/gi, (_, inner) => {
    return `(rows.length ? Math.min(...rows.map(r => ${replaceCols(inner, "r")})) : 0)`;
  });

  // MAX([Col])
  js = js.replace(/MAX\(\s*(.*?)\s*\)/gi, (_, inner) => {
    return `(rows.length ? Math.max(...rows.map(r => ${replaceCols(inner, "r")})) : 0)`;
  });

  // 2. Handle standalone column references [Col] -> (Number(row["Col"]) || 0)
  js = js.replace(/\[([^"']+?)\]/g, (_, col) => {
    return `(Number(row["${col.trim()}"]) || 0)`;
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
 * Generates suggested KPIs based on table schema with business logic detection
 */
export function generateKPIs(table: DataTable): SuggestedKPI[] {
  const kpis: SuggestedKPI[] = [];
  const numericCols = table.columns.filter(c => c.type === "number");
  const allCols = table.columns;
  const colNames = allCols.map(c => c.name.toLowerCase());

  // --- 1. Business Logic Detection (Revenue, COGS, Profit, etc.) ---

  // REVENUE
  const salesCol = allCols.find(c => /sales|revenue|amount|turnover|total_price|price_total/i.test(c.name));
  const priceCol = allCols.find(c => /unit_price|price|rate|selling_price/i.test(c.name));
  const qtyCol = allCols.find(c => /qty|quantity|count|volume|units_sold|units/i.test(c.name));

  if (salesCol) {
    kpis.push({
      name: "Total Revenue",
      formula: `SUM([${salesCol.name}])`,
      dax: `SUM('${table.name}'[${salesCol.name}])`,
      type: "number",
      description: "Total revenue from sales"
    });
  } else if (priceCol && qtyCol) {
    kpis.push({
      name: "Total Revenue",
      formula: `SUM([${priceCol.name}] * [${qtyCol.name}])`,
      dax: `SUMX('${table.name}', [${priceCol.name}] * [${qtyCol.name}])`,
      type: "number",
      description: "Total Revenue calculated as Price * Quantity"
    });
  }

  // COGS & TOTAL COST
  const costCol = allCols.find(c => /unit_cost|cost_per_unit|purchase_price|buy_price/i.test(c.name));
  const totalCostCol = allCols.find(c => /total_cost|cogs|total_expense|cost_total/i.test(c.name));

  if (totalCostCol) {
    kpis.push({
      name: "COGS",
      formula: `SUM([${totalCostCol.name}])`,
      dax: `SUM('${table.name}'[${totalCostCol.name}])`,
      type: "number",
      description: "Total Cost of Goods Sold"
    });
  } else if (costCol && qtyCol) {
    kpis.push({
      name: "Total Cost",
      formula: `SUM([${costCol.name}] * [${qtyCol.name}])`,
      dax: `SUMX('${table.name}', [${costCol.name}] * [${qtyCol.name}])`,
      type: "number",
      description: "Total Cost calculated as Unit Cost * Quantity"
    });
  }

  // PROFIT (Calculated if Revenue and Cost are available)
  const revenueRef = salesCol ? `SUM([${salesCol.name}])` : (priceCol && qtyCol ? `SUM([${priceCol.name}] * [${qtyCol.name}])` : null);
  const costRef = totalCostCol ? `SUM([${totalCostCol.name}])` : (costCol && qtyCol ? `SUM([${costCol.name}] * [${qtyCol.name}])` : null);

  if (revenueRef && costRef) {
    kpis.push({
      name: "Gross Profit",
      formula: `${revenueRef} - ${costRef}`,
      dax: `[Total Revenue] - [Total Cost]`,
      type: "number",
      description: "Total Revenue minus Total Cost"
    });
  }

  // TOTAL CUSTOMERS
  const customerCol = allCols.find(c => /customer|client|user_id|buyer|email/i.test(c.name));
  if (customerCol) {
    kpis.push({
      name: "Total Customers",
      formula: `DISTINCTCOUNT([${customerCol.name}])`,
      dax: `DISTINCTCOUNT('${table.name}'[${customerCol.name}])`,
      type: "number",
      description: "Count of unique customers"
    });
  }

  // --- 2. Generic Numeric Aggregations ---
  numericCols.forEach(col => {
    // Only add if not already covered by business logic
    if (kpis.some(k => k.formula.includes(`[${col.name}]`) && k.formula.length < 20)) return;

    kpis.push({
      name: `Total ${col.name}`,
      formula: `SUM([${col.name}])`,
      dax: `SUM('${table.name}'[${col.name}])`,
      type: "number",
      description: `Sum of all values in ${col.name}`
    });
  });

  // --- 3. Distinct counts for Categorical columns (limited) ---
  allCols.filter(c => c.type === "string" && !kpis.some(k => k.formula.includes(`[${c.name}]`))).slice(0, 2).forEach(col => {
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
