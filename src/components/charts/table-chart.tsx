"use client";

import { useMemo } from "react";
import type { ChartConfig, DataTable, ActiveFilter, Relationship, Measure } from "@/types";
import { applyFilters, joinTables } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  relationships?: Relationship[];
  measures?: Measure[];
  height?: number;
}

export default function TableChart({
  config,
  tables,
  filters,
  relationships = [],
  measures = [],
  height = 300
}: Props) {
  const { columns, rows, hasData } = useMemo(() => {
    if (!config.fields.length || !config.values.length) return { columns: [], rows: [], hasData: false };

    const fieldDef = config.fields[0];
    const table = tables?.find((t) => t.id === fieldDef.tableId);
    if (!table || !table.rows) return { columns: [], rows: [], hasData: false };

    // Determine if we need to join tables
    const valueTableIds = [...new Set(config.values.map(v => v.tableId))].filter(id => id !== fieldDef.tableId);
    let joinedRows: Record<string, unknown>[] = [];

    if (valueTableIds.length > 0 && relationships?.length > 0) {
      const tablesToJoin = tables.filter(t => t.id === fieldDef.tableId || valueTableIds.includes(t.id));
      joinedRows = joinTables(tablesToJoin, relationships, filters);
    } else {
      joinedRows = applyFilters(table, filters || []);
    }

    if (joinedRows.length === 0) return { columns: [], rows: [], hasData: false };

    // Grouping
    const groups = new Map<string, Record<string, unknown>[]>();
    joinedRows.forEach(row => {
      let val: string;
      if (fieldDef.aggregation === "measure") {
        const measure = measures.find(m => m.id === fieldDef.columnName);
        if (measure) {
          try {
            const evalFn = new Function("row", "rows", `return ${measure.formula}`);
            val = String(evalFn(row, joinedRows));
          } catch (e) {
            val = "Error";
          }
        } else {
          val = "Unknown Measure";
        }
      } else {
        val = String(row[fieldDef.columnName] ?? "Blank");
      }

      if (!groups.has(val)) groups.set(val, []);
      groups.get(val)!.push(row);
    });

    let categories = Array.from(groups.keys());

    // Setup columns header
    const headers = [
      fieldDef.columnName,
      ...config.values.map(v => v.columnName)
    ];

    // Compute metric values
    const dataRows = categories.map(cat => {
      const matching = groups.get(cat) || [];
      const rowObj: Record<string, any> = {
        [fieldDef.columnName]: cat
      };

      config.values.forEach(v => {
        let val = 0;
        if (v.aggregation === "measure") {
          const measure = measures.find((m) => m.id === v.columnName);
          if (measure && matching.length > 0) {
            try {
              const evalFn = new Function("row", "rows", `return ${measure.formula}`);
              val = Number(evalFn(matching[0], matching)) || 0;
            } catch (e) {}
          }
        } else {
          const parseSafeNumber = (num: any): number => {
            if (num === null || num === undefined) return 0;
            const parsed = parseFloat(String(num));
            return isNaN(parsed) ? 0 : parsed;
          };
          const vals = matching.map((r) => parseSafeNumber(r[v.columnName]));
          const sampleVal = matching[0]?.[v.columnName];
          const isActuallyNumeric = typeof sampleVal === "number" || (!isNaN(parseFloat(String(sampleVal))) && String(sampleVal).length > 0);
          const agg = (!isActuallyNumeric && (v.aggregation === "sum" || v.aggregation === "average")) ? "count" : (v.aggregation || "sum");
          switch (agg) {
            case "sum": val = vals.reduce((a, b) => a + b, 0); break;
            case "average": val = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; break;
            case "count": val = matching.length; break;
            case "min": val = vals.length ? Math.min(...vals) : 0; break;
            case "max": val = vals.length ? Math.max(...vals) : 0; break;
            default: val = vals[0] || 0;
          }
        }
        rowObj[v.columnName] = val;
      });

      return rowObj;
    });

    // Apply Limits
    let finalRows = [...dataRows];
    const limitType = config.limitType || "all";
    const limitCount = config.limitCount || 10;
    if (limitType !== "all" && config.values.length > 0) {
      const sortingField = config.values[0].columnName;
      if (limitType === "top") {
        finalRows.sort((a, b) => b[sortingField] - a[sortingField]);
        finalRows = finalRows.slice(0, limitCount);
      } else if (limitType === "bottom") {
        finalRows.sort((a, b) => a[sortingField] - b[sortingField]);
        finalRows = finalRows.slice(0, limitCount);
      } else if (limitType === "first") {
        finalRows = finalRows.slice(0, limitCount);
      } else if (limitType === "last") {
        finalRows = finalRows.slice(-limitCount);
      }
    }

    return {
      columns: headers,
      rows: finalRows,
      hasData: true
    };
  }, [config, tables, filters, measures, relationships]);

  const getCurrencySymbol = (currency?: string) => {
    if (!currency) return "";
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", NGN: "₦", INR: "₹", JPY: "¥", CNY: "¥", AUD: "$", CAD: "$", BRL: "R$"
    };
    return symbols[currency] || "";
  };

  const formatValue = (val: any, columnName: string) => {
    if (typeof val === "number") {
      const currency = config.currency;
      const symbol = getCurrencySymbol(currency);
      const isInteger = Number.isInteger(val);
      const formatted = isInteger ? val.toLocaleString() : val.toFixed(2);
      return `${symbol}${formatted}`;
    }
    return String(val);
  };

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        📋 Configure table fields and values
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px`, overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "8px", background: "var(--color-surface)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
        <thead>
          <tr style={{ background: "var(--color-bg-secondary)", borderBottom: "2px solid var(--color-border)" }}>
            {columns.map((col, idx) => (
              <th key={col} style={{ padding: "10px 14px", fontWeight: 600, color: "var(--color-text)", textTransform: "capitalize" }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr 
              key={rowIdx} 
              style={{ 
                borderBottom: "1px solid var(--color-border-light)",
                background: rowIdx % 2 === 0 ? "transparent" : "var(--color-bg-secondary)"
              }}
            >
              {columns.map(col => (
                <td key={col} style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>
                  {formatValue(row[col], col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
