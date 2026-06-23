"use client";

import { useMemo } from "react";
import type { ChartConfig, DataTable, ActiveFilter, Relationship, Measure } from "@/types";
import { applyFilters, joinTables, formatWithCurrency } from "@/lib/utils";
import { convertToJs } from "@/lib/kpi-engine";
import { executeMeasure } from "@/lib/measure-engine";

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

    let joinedRows: Record<string, unknown>[] = [];
    if (relationships?.length > 0 && tables?.length > 1) {
      const otherTables = tables.filter(t => t.id !== table.id);
      joinedRows = joinTables([table, ...otherTables], relationships, filters);
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
            const formulaJs = convertToJs(measure.originalFormula || measure.formula);
            const evalFn = new Function("row", "rows", "measures", "executeMeasure", `return ${formulaJs}`);
            val = String(evalFn(row, joinedRows, measures, executeMeasure));
          } catch (e) {
            console.error("Error evaluating dimension measure in table:", e);
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
      { key: fieldDef.columnName, label: fieldDef.aggregation === "measure" ? (measures.find(m => m.id === fieldDef.columnName)?.name || fieldDef.columnName) : fieldDef.columnName },
      ...config.values.map(v => ({
        key: v.columnName,
        label: v.aggregation === "measure" ? (measures.find(m => m.id === v.columnName)?.name || v.columnName) : v.columnName
      }))
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
              const formulaJs = convertToJs(measure.originalFormula || measure.formula);
              const evalFn = new Function("row", "rows", "measures", "executeMeasure", `return ${formulaJs}`);
              val = Number(evalFn(matching[0], matching, measures, executeMeasure)) || 0;
            } catch (e) {
              console.error("Error evaluating value measure in table:", e);
            }
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

  const formatValue = (val: any) => {
    if (val === undefined || val === null) return "-";
    // Check if the value is actually numeric before formatting
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return formatWithCurrency(num, config.currency);
  };

  const totals = useMemo(() => {
    if (!hasData || !rows.length) return {};
    const totalsObj: Record<string, number> = {};
    config.values.forEach(v => {
      const sum = rows.reduce((acc, row) => acc + (Number(row[v.columnName]) || 0), 0);
      totalsObj[v.columnName] = sum;
    });
    return totalsObj;
  }, [rows, config.values, hasData]);

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
              <th key={col.key} style={{ padding: "10px 14px", fontWeight: 600, color: "var(--color-text)", textTransform: "capitalize" }}>
                {col.label}
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
                <td key={col.key} style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>
                  {formatValue(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "var(--color-bg-secondary)", borderTop: "2px solid var(--color-border)", fontWeight: "bold", position: "sticky", bottom: 0 }}>
            <td style={{ padding: "10px 14px", color: "var(--color-text)" }}>Total</td>
            {config.values.map(v => (
              <td key={v.columnName} style={{ padding: "10px 14px", color: "var(--color-text)" }}>
                {formatValue(totals[v.columnName])}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
