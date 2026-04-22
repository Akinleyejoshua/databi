/* ============================================================
   Data Transformation Engine
   ============================================================ */

import type { DataTable, TransformRequest, DataType } from "@/types";

export function transformData(
  table: DataTable,
  request: TransformRequest
): DataTable {
  const newTable = { ...table, rows: [...table.rows] };

  switch (request.action) {
    case "remove-nulls":
      return removeNulls(newTable, request.column);
    case "remove-duplicates":
      return removeDuplicates(newTable, request.column);
    case "aggregate":
      return aggregate(
        newTable,
        request.groupByColumns || [],
        request.column!,
        request.aggregation || "sum"
      );
    case "cast-type":
      return castType(newTable, request.column!, request.targetType!);
    default:
      return newTable;
  }
}

function removeNulls(table: DataTable, column?: string): DataTable {
  if (column) {
    table.rows = table.rows.filter(
      (row) => row[column] !== null && row[column] !== undefined && row[column] !== ""
    );
  } else {
    table.rows = table.rows.filter((row) =>
      Object.values(row).every(
        (val) => val !== null && val !== undefined && val !== ""
      )
    );
  }
  table.rowCount = table.rows.length;
  return table;
}

function removeDuplicates(table: DataTable, column?: string): DataTable {
  if (column) {
    const seen = new Set();
    table.rows = table.rows.filter((row) => {
      const key = JSON.stringify(row[column]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } else {
    const seen = new Set();
    table.rows = table.rows.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  table.rowCount = table.rows.length;
  return table;
}

function aggregate(
  table: DataTable,
  groupByColumns: string[],
  valueColumn: string,
  aggregation: string
): DataTable {
  const groups = new Map<string, Record<string, unknown>[]>();

  for (const row of table.rows) {
    const key = groupByColumns.map((col) => String(row[col])).join("|||");
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }

  const newRows: Record<string, unknown>[] = [];

  for (const [, groupRows] of groups) {
    const newRow: Record<string, unknown> = {};

    for (const col of groupByColumns) {
      newRow[col] = groupRows[0][col];
    }

    const values = groupRows
      .map((r) => Number(r[valueColumn]))
      .filter((v) => !isNaN(v));

    switch (aggregation) {
      case "sum":
        newRow[valueColumn] = values.reduce((a, b) => a + b, 0);
        break;
      case "average":
        newRow[valueColumn] =
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
        break;
      case "count":
        newRow[valueColumn] = groupRows.length;
        break;
    }

    newRows.push(newRow);
  }

  const newColumns = [
    ...groupByColumns.map((col) => table.columns.find((c) => c.name === col)!),
    table.columns.find((c) => c.name === valueColumn)!,
  ].filter(Boolean);

  return {
    ...table,
    columns: newColumns,
    rows: newRows,
    rowCount: newRows.length,
  };
}

function castType(
  table: DataTable,
  column: string,
  targetType: DataType
): DataTable {
  table.rows = table.rows.map((row) => {
    const newRow = { ...row };
    const val = row[column];

    switch (targetType) {
      case "number":
        newRow[column] = Number(val) || 0;
        break;
      case "string":
        newRow[column] = String(val ?? "");
        break;
      case "boolean":
        newRow[column] = Boolean(val);
        break;
      case "date":
        newRow[column] = new Date(String(val)).toISOString();
        break;
    }

    return newRow;
  });

  table.columns = table.columns.map((col) =>
    col.name === column ? { ...col, type: targetType } : col
  );

  return table;
}
