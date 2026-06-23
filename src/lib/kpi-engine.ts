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

  // 0. Support PowerBI SUMX, AVERAGEX, and DIVIDE
  js = js.replace(/SUMX\(\s*['"]?.*?['"]?\s*,\s*(.*?)\s*\)/gi, "SUM($1)");
  js = js.replace(/AVERAGEX\(\s*['"]?.*?['"]?\s*,\s*(.*?)\s*\)/gi, "AVG($1)");
  js = js.replace(/DIVIDE\(\s*([^,]+?)\s*,\s*([^,)]+?)\s*(?:,\s*([^)]+?)\s*)?\)/gi, (_, num, den, alt) => {
    const fallback = alt ? alt.trim() : "0";
    return `((${den.trim()}) === 0 ? ${fallback} : (${num.trim()}) / (${den.trim()}))`;
  });

  // Helper to replace [Col] with _get(rowVar, "Col") inside a string
  const replaceCols = (str: string, rowVar: string = "r") => {
    return str.replace(/\[([^"']+?)\]/g, (_, col) => `_get(${rowVar}, "${col.trim()}")`);
  };

  // 1. Handle Aggregations with complex expressions
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
    return `new Set(rows.map(r => _get(r, "${cleanCol}"))).size`;
  });

  // MIN([Col])
  js = js.replace(/MIN\(\s*(.*?)\s*\)/gi, (_, inner) => {
    return `(rows.length ? Math.min(...rows.map(r => ${replaceCols(inner, "r")})) : 0)`;
  });

  // MAX([Col])
  js = js.replace(/MAX\(\s*(.*?)\s*\)/gi, (_, inner) => {
    return `(rows.length ? Math.max(...rows.map(r => ${replaceCols(inner, "r")})) : 0)`;
  });

  // 2. Handle standalone column references [Col] -> _get(row, "Col")
  js = js.replace(/\[([^"']+?)\]/g, (_, col) => {
    return `_get(row, "${col.trim()}")`;
  });

  return `(() => {
    const _get = (r, c) => {
      if (!r) return 0;
      if (typeof measures !== 'undefined' && Array.isArray(measures)) {
        const m = measures.find(x => x.name === c || x.id === c);
        if (m) {
          if (typeof executeMeasure === 'function') {
            return executeMeasure(m, null, rows) || 0;
          }
        }
      }
      if (r[c] !== undefined) return Number(r[c]) || 0;
      const s = '.' + c;
      for (const k in r) { if (k.endsWith(s)) return Number(r[k]) || 0; }
      return 0;
    };
    return ${js};
  })()`;
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

  // --- 1. Business Logic Detection (Revenue, COGS, Profit, etc.) ---

  // REVENUE
  const salesCol = numericCols.find(c => /sales|revenue|amount|turnover|total_price|price_total/i.test(c.name));
  const priceCol = numericCols.find(c => /unit_price|price|rate|selling_price/i.test(c.name));
  const qtyCol = numericCols.find(c => /qty|quantity|count|volume|units_sold|units/i.test(c.name));

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
      formula: `SUMX('${table.name}', [${priceCol.name}] * [${qtyCol.name}])`,
      dax: `SUMX('${table.name}', [${priceCol.name}] * [${qtyCol.name}])`,
      type: "number",
      description: "Total Revenue calculated as Price * Quantity"
    });
  }

  // COGS & TOTAL COST
  const costCol = numericCols.find(c => /unit_cost|cost_per_unit|purchase_price|buy_price/i.test(c.name));
  const totalCostCol = numericCols.find(c => /total_cost|cogs|total_expense|cost_total/i.test(c.name));

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
      formula: `SUMX('${table.name}', [${costCol.name}] * [${qtyCol.name}])`,
      dax: `SUMX('${table.name}', [${costCol.name}] * [${qtyCol.name}])`,
      type: "number",
      description: "Total Cost calculated as Unit Cost * Quantity"
    });
  }

  // PROFIT (Calculated if Revenue and Cost are available)
  const revenueRef = salesCol ? `SUM([${salesCol.name}])` : (priceCol && qtyCol ? `SUMX('${table.name}', [${priceCol.name}] * [${qtyCol.name}])` : null);
  const costRef = totalCostCol ? `SUM([${totalCostCol.name}])` : (costCol && qtyCol ? `SUMX('${table.name}', [${costCol.name}] * [${qtyCol.name}])` : null);

  if (revenueRef && costRef) {
    kpis.push({
      name: "Gross Profit",
      formula: `${revenueRef} - ${costRef}`,
      dax: `[Total Revenue] - [Total Cost]`,
      type: "number",
      description: "Total Revenue minus Total Cost"
    });

    kpis.push({
      name: "Gross Profit Margin",
      formula: `DIVIDE(${revenueRef} - ${costRef}, ${revenueRef})`,
      dax: `DIVIDE([Gross Profit], [Total Revenue])`,
      type: "number",
      description: "Gross Profit margin percentage"
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

  return kpis;
}
