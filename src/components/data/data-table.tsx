/* ============================================================
   Data Table — Browse raw dataset tables
   ============================================================ */
"use client";

import { useState, useMemo, useRef } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import { useTableTransform } from "@/hooks/use-table-transform";
import type { DataTable as DataTableType, TransformAction, DataType } from "@/types";
import styles from "./data-table.module.css";

// A value is considered "empty" if it is null, undefined, or a blank string.
function isEmptyValue(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

export default function DataTableView() {
  const { project, updateTable, removeTable } = useProjectStore();
  const { selectedTableId, setSelectedTableId, addToast } = useUiStore();
  const { applyTransform } = useTableTransform();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [transformColumn, setTransformColumn] = useState("");
  const [isTransforming, setIsTransforming] = useState(false);
  // Highlight mode applied to the selected column: "none" | "null" | "empty" | "duplicate" | "all"
  type HighlightMode = "none" | "null" | "empty" | "duplicate" | "all";
  const [highlightMode, setHighlightMode] = useState<HighlightMode>("none");
  const [editing, setEditing] = useState<{ row: number; col: string } | null>(null);
  const [draft, setDraft] = useState<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pageSize = 50;

  const table = useMemo(
    () => project?.tables.find((t) => t.id === selectedTableId) || null,
    [project?.tables, selectedTableId]
  );

  if (!project || project.tables.length === 0) {
    return (
      <div className={styles["no-data"]}>
        <div className="empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          <h3>No Data Loaded</h3>
          <p>Upload an Excel or CSV file to begin exploring your data</p>
        </div>
      </div>
    );
  }

  const filteredRows = useMemo(() => {
    if (!table) return [];
    return searchTerm
      ? table.rows.filter((row) =>
          Object.values(row).some((val) =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : table.rows;
  }, [table, searchTerm]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

  // Compute duplicate value flags across the FULL filtered dataset (per column),
  // so a value highlighted as duplicate stays consistent across pages.
  const duplicateFlags = useMemo(() => {
    const flags: Record<string, Set<number>> = {};
    if (!table) return flags;
    for (const col of table.columns) {
      const seen = new Map<string, number>();
      const dupRows = new Set<number>();
      filteredRows.forEach((row, idx) => {
        const raw = row[col.name];
        if (isEmptyValue(raw)) return;
        const key = String(raw);
        if (seen.has(key)) {
          dupRows.add(seen.get(key)!);
          dupRows.add(idx);
        } else {
          seen.set(key, idx);
        }
      });
      flags[col.name] = dupRows;
    }
    return flags;
  }, [filteredRows, table]);

  if (!table) {
    return (
      <div className={styles["no-data"]}>
        <div className="empty-state">
          <h3>Select a Table</h3>
          <p>Choose a table from the sidebar to view its data</p>
        </div>
      </div>
    );
  }

  // Persist a single cell edit immediately (on blur / Enter).
  const commitCellEdit = (rowIndex: number, colName: string, value: string) => {
    const targetRow = filteredRows[rowIndex];
    if (!targetRow) return;
    const rowId = targetRow.__id as number | undefined;
    const globalIndex = rowId ?? table.rows.indexOf(targetRow);
    if (globalIndex < 0) return;

    const updatedRows = table.rows.map((r, i) => {
      if (i !== globalIndex) return r;
      const next = { ...r };
      const col = table.columns.find((c) => c.name === colName);
      if (col?.type === "number") {
        const n = Number(value);
        next[colName] = value.trim() === "" ? null : (Number.isNaN(n) ? value : n);
      } else if (col?.type === "boolean") {
        next[colName] = value === "true" || value === "1";
      } else {
        next[colName] = value;
      }
      return next;
    });

    updateTable(table.id, { rows: updatedRows, rowCount: updatedRows.length });
    addToast("Cell updated", "success");
  };

  const startEdit = (rowIndex: number, colName: string, current: unknown) => {
    setEditing({ row: rowIndex, col: colName });
    setDraft(current === null || current === undefined ? "" : String(current));
  };

  const finishEdit = (save: boolean) => {
    if (!editing) return;
    if (save) commitCellEdit(editing.row, editing.col, draft);
    setEditing(null);
    setDraft("");
  };

  // Build a compact page list with ellipsis for large tables
  const buildPageItems = (): (number | "...")[] => {
    const items: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) items.push(i);
      return items;
    }
    const current = page;
    items.push(0);
    const start = Math.max(1, current - 1);
    const end = Math.min(totalPages - 2, current + 1);
    if (start > 1) items.push("...");
    for (let i = start; i <= end; i++) items.push(i);
    if (end < totalPages - 2) items.push("...");
    items.push(totalPages - 1);
    return items;
  };
  const pageItems = buildPageItems();

  const handleTransform = async (action: TransformAction, targetType?: DataType) => {
    setIsTransforming(true);
    try {
      const res = await fetch("/api/data/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table,
          transform: {
            tableId: table.id,
            action,
            column: transformColumn || undefined,
            targetType,
          },
        }),
      });

      if (!res.ok) throw new Error("Transform failed");

      const data = await res.json();
      updateTable(table.id, {
        rows: data.table.rows,
        rowCount: data.table.rowCount,
        columns: data.table.columns,
      });

      addToast(`Transform "${action}" applied successfully`, "success");
    } catch (error) {
      addToast("Transform failed", "error");
      console.error(error);
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className={styles["data-view"]}>
      {/* Table Tabs */}
      <div className={styles["table-tabs"]}>
        {project.tables.map((t) => (
          <button
            key={t.id}
            className={`${styles["table-tab"]} ${t.id === selectedTableId ? styles["table-tab--active"] : ""}`}
            onClick={() => { setSelectedTableId(t.id); setPage(0); }}
          >
            {t.name}
            <span className={styles["tab-count"]}>{t.rowCount}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles["toolbar-left"]}>
          <div className={styles["search-box"]}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles["search-input"]}
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            />
          </div>

          <select
            className="select"
            style={{ width: "160px" }}
            value={transformColumn}
            onChange={(e) => setTransformColumn(e.target.value)}
          >
            <option value="">All columns</option>
            {table.columns.map((col) => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>

          <select
            className="select"
            style={{ width: "150px" }}
            value={highlightMode}
            onChange={(e) => setHighlightMode(e.target.value as HighlightMode)}
            title="Highlight data-quality issues in the selected column"
          >
            <option value="none">No highlight</option>
            <option value="null">Highlight nulls</option>
            <option value="empty">Highlight empty</option>
            <option value="duplicate">Highlight duplicates</option>
            <option value="all">Highlight all issues</option>
          </select>
        </div>

        <div className={styles["toolbar-right"]}>
          <span className={styles["debug-info"]}>
            Rows in memory: {table.rows.length} / {table.rowCount}
          </span>
          <button className="btn btn-danger btn-sm" onClick={() => {
            if (confirm(`Are you sure you want to delete table "${table.name}"? This action cannot be undone.`)) {
              removeTable(table.id);
              setSelectedTableId(null);
              addToast(`Table "${table.name}" deleted`, "success");
            }
          }}>
            Delete Table
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles["table-wrapper"]}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles["row-num"]}>#</th>
              {table.columns.map((col) => (
                <th key={col.name}>
                  <div className={styles["th-content"]}>
                    <span>{col.name}</span>
                    <span className={styles["th-type"]}>{col.type}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={table.columns.length + 1} style={{ textAlign: "center", padding: "48px", color: "var(--color-text-tertiary)" }}>
                  {searchTerm ? "No rows match your search" : "This table has no data rows"}
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => {
                const isEditingRow = editing?.row === idx;
                return (
                  <tr key={idx}>
                    <td className={styles["row-num"]}>{page * pageSize + idx + 1}</td>
                    {table.columns.map((col) => {
                      const value = row[col.name];
                      const empty = isEmptyValue(value);
                      const isDuplicate = !empty && duplicateFlags[col.name]?.has(idx);
                      const isEditingCell = isEditingRow && editing?.col === col.name;
                      const colMatches = !transformColumn || transformColumn === col.name;
                      const hlEmpty = colMatches && (highlightMode === "empty" || highlightMode === "all");
                      const hlNull = colMatches && (highlightMode === "null" || highlightMode === "all");
                      const hlDup = colMatches && (highlightMode === "duplicate" || highlightMode === "all");
                      const cellClass = [
                        hlEmpty && empty ? styles["cell-empty"] : "",
                        hlNull && empty ? styles["cell-empty"] : "",
                        hlDup && isDuplicate ? styles["cell-duplicate"] : "",
                      ].filter(Boolean).join(" ");

                      if (isEditingCell) {
                        return (
                          <td key={col.name} className={cellClass}>
                            <input
                              className={styles["cell-input"]}
                              autoFocus
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onBlur={() => finishEdit(true)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); finishEdit(true); }
                                else if (e.key === "Escape") { e.preventDefault(); finishEdit(false); }
                              }}
                            />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.name}
                          className={`${styles["cell-editable"]} ${cellClass}`}
                          title="Click to edit"
                          onClick={() => startEdit(idx, col.name, value)}
                        >
                          {empty ? (
                            <span className={styles["null-cell"]}>null</span>
                          ) : (
                            String(value)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <span className={styles["page-info"]}>
          {filteredRows.length} rows · Page {page + 1} of {totalPages || 1}
        </span>
        <div className={styles["page-btns"]}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage(0)}
            disabled={page === 0}
            aria-label="First page"
          >
            «
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            aria-label="Previous page"
          >
            ‹
          </button>
          {pageItems.map((item, i) =>
            item === "..." ? (
              <span key={`e${i}`} className={styles["page-ellipsis"]}>…</span>
            ) : (
              <button
                key={item}
                className={`btn btn-sm ${item === page ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setPage(item)}
                aria-current={item === page ? "page" : undefined}
              >
                {item + 1}
              </button>
            )
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
          >
            ›
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            aria-label="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
