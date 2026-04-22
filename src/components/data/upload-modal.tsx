/* ============================================================
   Upload Modal — File upload for Excel/CSV
   ============================================================ */
"use client";

import { useState, useRef } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { DataTable } from "@/types";
import styles from "./upload-modal.module.css";

export default function UploadModal() {
  const { isUploadModalOpen, setUploadModalOpen, addToast } = useUiStore();
  const { addTable } = useProjectStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedTables, setParsedTables] = useState<DataTable[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadModalOpen) return null;

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setParsedTables(data.tables);
      setSelectedSheets(new Set(data.tables.map((t: DataTable) => t.id)));
    } catch (error) {
      addToast("Failed to parse file. Please check the format.", "error");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    const toImport = parsedTables.filter((t) => selectedSheets.has(t.id));
    toImport.forEach((table) => addTable(table));
    addToast(`Imported ${toImport.length} table(s) successfully`, "success");
    setParsedTables([]);
    setSelectedSheets(new Set());
    setUploadModalOpen(false);
  };

  const toggleSheet = (id: string) => {
    const next = new Set(selectedSheets);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSheets(next);
  };

  const handleClose = () => {
    setParsedTables([]);
    setSelectedSheets(new Set());
    setUploadModalOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h2>Import Data</h2>
          <button className="btn btn-ghost btn-icon" onClick={handleClose}>✕</button>
        </div>

        <div className="modal-body">
          {parsedTables.length === 0 ? (
            <div
              className={`${styles["drop-zone"]} ${isDragging ? styles["drop-zone--active"] : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className={styles["upload-loading"]}>
                  <div className={styles["upload-spinner"]} />
                  <p>Parsing file...</p>
                </div>
              ) : (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <h3>Drop your file here</h3>
                  <p>or click to browse</p>
                  <span className={styles["file-types"]}>Supports .xlsx, .xls, .csv</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <div className={styles["sheet-selector"]}>
              <p className={styles["sheet-info"]}>
                Found <strong>{parsedTables.length}</strong> table(s). Select which to import:
              </p>
              {parsedTables.map((table) => (
                <label key={table.id} className={styles["sheet-item"]}>
                  <input
                    type="checkbox"
                    checked={selectedSheets.has(table.id)}
                    onChange={() => toggleSheet(table.id)}
                  />
                  <div className={styles["sheet-details"]}>
                    <span className={styles["sheet-name"]}>{table.name}</span>
                    <span className={styles["sheet-meta"]}>
                      {table.rowCount} rows · {table.columns.length} columns
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {parsedTables.length > 0 && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => { setParsedTables([]); setSelectedSheets(new Set()); }}>
              Back
            </button>
            <button className="btn btn-primary" onClick={handleImport} disabled={selectedSheets.size === 0}>
              Import {selectedSheets.size} Table(s)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
