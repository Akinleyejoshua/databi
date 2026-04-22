/* ============================================================
   Data Table — Browse raw dataset tables
   ============================================================ */
"use client";

import { useState, useMemo } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { DataTable as DataTableType, TransformAction, DataType } from "@/types";
import styles from "./data-table.module.css";

export default function DataTableView() {
  const { project, updateTable, removeTable } = useProjectStore();
  const { selectedTableId, setSelectedTableId, addToast } = useUiStore();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [transformColumn, setTransformColumn] = useState("");
  const [isTransforming, setIsTransforming] = useState(false);

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

  const filteredRows = searchTerm
    ? table.rows.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : table.rows;

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

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
        </div>

        <div className={styles["toolbar-right"]}>
          <button className="btn btn-danger btn-sm" onClick={() => {
            removeTable(table.id);
            setSelectedTableId(null);
            addToast(`Table "${table.name}" removed`, "info");
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
            {pageRows.map((row, idx) => (
              <tr key={idx}>
                <td className={styles["row-num"]}>{page * pageSize + idx + 1}</td>
                {table.columns.map((col) => (
                  <td key={col.name}>
                    {row[col.name] === null || row[col.name] === undefined ? (
                      <span className={styles["null-cell"]}>null</span>
                    ) : (
                      String(row[col.name])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <span className={styles["page-info"]}>
          {filteredRows.length} rows · Page {page + 1} of {totalPages || 1}
        </span>
        <div className={styles["page-btns"]}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Prev</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Next →</button>
        </div>
      </div>
    </div>
  );
}
