/* ============================================================
   Measures Editor Modal
   ============================================================ */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { DataType } from "@/types";
import { generateKPIs, convertToJs, convertToDAX, type SuggestedKPI } from "@/lib/kpi-engine";

export default function MeasuresModal() {
  const { isMeasureModalOpen, setMeasureModalOpen, addToast } = useUiStore();
  const { project, addMeasure } = useProjectStore();

  const [name, setName] = useState("");
  const [tableId, setTableId] = useState("");
  const [formula, setFormula] = useState("");
  const [resultType, setResultType] = useState<DataType>("number");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null);

  // Suggestions based on selected table
  const suggestions = useMemo(() => {
    const table = project?.tables.find((t) => t.id === tableId);
    return table ? generateKPIs(table) : [];
  }, [tableId, project?.tables]);

  const selectedTable = useMemo(() => 
    project?.tables.find(t => t.id === tableId),
    [tableId, project?.tables]
  );

  useEffect(() => {
    if (!isMeasureModalOpen) {
      setName(""); setTableId(""); setFormula(""); setResultType("number");
    }
  }, [isMeasureModalOpen]);

  if (!isMeasureModalOpen || !project) return null;

  const handleApplySuggestion = (s: SuggestedKPI) => {
    setName(s.name);
    setFormula(s.formula);
    setResultType(s.type);
  };

  const handleSubmit = () => {
    if (!name || !tableId || !formula) {
      addToast("Please fill all fields", "error");
      return;
    }

    // Convert simplified syntax to executable JS
    const executableJs = convertToJs(formula);

    // Validate formula by trying to create a function
    try {
      const table = project.tables.find((t) => t.id === tableId);
      if (table && table.rows.length > 0) {
        // Wrap in try-catch to avoid runtime errors during validation
        const testFn = new Function("row", "rows", `try { return ${executableJs}; } catch(e) { return null; }`);
        testFn(table.rows[0], table.rows);
      } else {
        // Just check syntax
        new Function("row", "rows", `return ${executableJs}`);
      }
    } catch (e) {
      console.error("Formula validation error:", e);
      addToast("Invalid formula syntax", "error");
      return;
    }

    addMeasure({ 
      name, 
      tableId, 
      formula: executableJs, 
      originalFormula: formula,
      resultType 
    });

    addToast(`Measure "${name}" created`, "success");
    setMeasureModalOpen(false);
  };

  const daxPreview = useMemo(() => {
    if (!formula) return "";
    return convertToDAX(formula, selectedTable?.name || "Table");
  }, [formula, selectedTable?.name]);

  return (
    <div className="modal-overlay" onClick={() => setMeasureModalOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px", width: "90%" }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Measure Calculator</h2>
            <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Create KPIs using simplified DAX syntax</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setMeasureModalOpen(false)}>✕</button>
        </div>

        <div className="modal-body" style={{ display: "grid", gridTemplateColumns: suggestions.length > 0 ? "1fr 250px" : "1fr", gap: "24px", padding: "24px" }}>
          
          {/* Main Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="label">Table Source</label>
                <select className="select" value={tableId} onChange={(e) => setTableId(e.target.value)}>
                  <option value="">Select table...</option>
                  {project.tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Measure Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Total Revenue" />
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px" }}>
                <label className="label" style={{ marginBottom: 0 }}>Formula</label>
                <button 
                  className="btn btn-ghost" 
                  style={{ fontSize: "11px", height: "auto", padding: "2px 8px" }}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? "Hide Helper" : "Show Helper"}
                </button>
              </div>
              
              <textarea
                className="textarea"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder={`e.g. SUM([Amount]) or [Sales] * 0.1`}
                style={{ fontFamily: "monospace", minHeight: "120px", fontSize: "14px", lineHeight: "1.5" }}
              />

              {formula && (
                <div style={{ marginTop: "8px", padding: "8px 12px", background: "var(--color-bg-secondary)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>DAX Preview</div>
                  <code style={{ color: "var(--color-primary)", fontWeight: 500, wordBreak: "break-all" }}>{daxPreview}</code>
                </div>
              )}

              {showAdvanced && (
                <div style={{ marginTop: "12px", padding: "12px", background: "var(--color-surface-hover)", borderRadius: "8px", border: "1px dashed var(--color-border)" }}>
                  <h4 style={{ fontSize: "12px", marginBottom: "8px" }}>Available Functions:</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                    <code>SUM([Col])</code>
                    <code>AVG([Col])</code>
                    <code>COUNT([Col])</code>
                    <code>DISTINCTCOUNT([Col])</code>
                    <code>MIN([Col])</code>
                    <code>MAX([Col])</code>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "12px" }}>
                    Tip: Use <code>[ColumnName]</code> to reference table columns.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Result Type</label>
              <div style={{ display: "flex", gap: "12px" }}>
                {["number", "string", "boolean"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`btn ${resultType === type ? "btn-primary" : "btn-secondary"}`}
                    style={{ flex: 1, textTransform: "capitalize" }}
                    onClick={() => setResultType(type as DataType)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Suggestions Sidebar */}
          {suggestions.length > 0 && (
            <div style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Suggested KPIs</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="suggestion-card"
                    onMouseEnter={() => setHoveredSuggestion(i)}
                    onMouseLeave={() => setHoveredSuggestion(null)}
                    onClick={() => handleApplySuggestion(s)}
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      background: hoveredSuggestion === i ? "var(--color-surface-hover)" : "var(--color-surface)",
                      border: "1px solid",
                      borderColor: hoveredSuggestion === i ? "var(--color-primary)" : "var(--color-border)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      transform: hoveredSuggestion === i ? "translateY(-1px)" : "none"
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>{s.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="modal-footer" style={{ marginTop: "24px", padding: "16px 24px" }}>
          <button className="btn btn-secondary" onClick={() => setMeasureModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Create Measure</button>
        </div>
      </div>
    </div>
  );
}
