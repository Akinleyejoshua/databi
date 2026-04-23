/* ============================================================
   Upload Modal — File upload & URL import for Excel/CSV/JSON
   ============================================================ */
"use client";

import { useState, useRef } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { DataTable } from "@/types";
import styles from "./upload-modal.module.css";

type ImportTab = "file" | "url";

export default function UploadModal() {
  const { isUploadModalOpen, setUploadModalOpen, addToast } = useUiStore();
  const { addTable } = useProjectStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedTables, setParsedTables] = useState<DataTable[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<ImportTab>("file");
  const [urlInput, setUrlInput] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(3600); // 1 hour in seconds
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
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

  const handleUrlImport = async () => {
    let finalUrl = urlInput.trim();
    if (!finalUrl) {
      addToast("Please enter a valid URL", "error");
      return;
    }

    // Extract URL if user pasted an iframe
    if (finalUrl.toLowerCase().startsWith("<iframe")) {
      const srcMatch = finalUrl.match(/src="([^"]+)"/i);
      if (srcMatch && srcMatch[1]) {
        finalUrl = srcMatch[1];
      }
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/data/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: finalUrl,
          refreshInterval: refreshInterval * 1000, // Convert to milliseconds
          isAutoRefresh,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "URL import failed");
      }

      const data = await res.json();
      setParsedTables(data.tables);
      setSelectedSheets(new Set(data.tables.map((t: DataTable) => t.id)));
      addToast(`Imported ${data.tables.length} table(s) from URL`, "success");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to import from URL",
        "error"
      );
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

        {/* Tab Navigation */}
        {parsedTables.length === 0 && (
          <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", paddingBottom: 0 }}>
            <button
              onClick={() => {
                setActiveTab("file");
                setUrlInput("");
              }}
              style={{
                flex: 1,
                padding: "12px",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom: activeTab === "file" ? "2px solid var(--color-primary)" : "none",
                color: activeTab === "file" ? "var(--color-primary)" : "var(--color-text-secondary)",
                fontWeight: activeTab === "file" ? "600" : "500",
              }}
            >
              📁 File Upload
            </button>
            <button
              onClick={() => {
                setActiveTab("url");
              }}
              style={{
                flex: 1,
                padding: "12px",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom: activeTab === "url" ? "2px solid var(--color-primary)" : "none",
                color: activeTab === "url" ? "var(--color-primary)" : "var(--color-text-secondary)",
                fontWeight: activeTab === "url" ? "600" : "500",
              }}
            >
              🔗 URL Import
            </button>
          </div>
        )}

        <div className="modal-body">
          {parsedTables.length === 0 ? (
            activeTab === "file" ? (
              // File Upload Tab
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
              // URL Import Tab
              <div style={{ padding: "20px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Dataset URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/data.csv"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleUrlImport()}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                    }}
                  />
                  <small style={{ display: "block", marginTop: "6px", color: "var(--color-text-secondary)" }}>
                    Supported: CSV, Excel, JSON, GitHub Raw, Dropbox, Google Drive, OneDrive, SharePoint, Excel Online (Microsoft 365), 1drv.ms URLs, or API endpoints
                  </small>
                </div>

                <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "var(--color-bg-secondary)", borderRadius: "6px" }}>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "12px" }}>
                    <input
                      type="checkbox"
                      checked={isAutoRefresh}
                      onChange={(e) => setIsAutoRefresh(e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    <span style={{ fontWeight: "500" }}>Auto-refresh data</span>
                  </label>

                  {isAutoRefresh && (
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                        Refresh interval:
                      </label>
                      <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid var(--color-border)",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      >
                        <option value={300}>Every 5 minutes</option>
                        <option value={900}>Every 15 minutes</option>
                        <option value={1800}>Every 30 minutes</option>
                        <option value={3600}>Every 1 hour</option>
                        <option value={86400}>Every 24 hours</option>
                      </select>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUrlImport}
                  disabled={isUploading || !urlInput.trim()}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: urlInput.trim() && !isUploading ? "var(--color-primary)" : "var(--color-bg-tertiary)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: urlInput.trim() && !isUploading ? "pointer" : "not-allowed",
                    fontWeight: "500",
                  }}
                >
                  {isUploading ? "Loading..." : "Import from URL"}
                </button>
              </div>
            )
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
                      {table.source?.type === "url" && (
                        <span style={{ marginLeft: "8px", color: "var(--color-primary)" }}>
                          🔗 URL Source
                        </span>
                      )}
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
