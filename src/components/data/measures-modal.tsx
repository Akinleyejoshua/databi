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
  const { isMeasureModalOpen, setMeasureModalOpen, addToast, selectedTableId, editingMeasureId, setEditingMeasureId } = useUiStore();
  const { project, addMeasure, updateMeasure, saveProject } = useProjectStore();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [tableId, setTableId] = useState("");
  const [formula, setFormula] = useState("");
  const [resultType, setResultType] = useState<DataType>("number");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Hooks ---

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load editing measure
  useEffect(() => {
    if (isMeasureModalOpen && editingMeasureId && project?.measures) {
      const m = project.measures.find(measure => measure.id === editingMeasureId);
      if (m) {
        setName(m.name);
        setTableId(m.tableId);
        setFormula(m.originalFormula || m.formula);
        setResultType(m.resultType);
      }
    } else if (isMeasureModalOpen && selectedTableId) {
      setTableId(selectedTableId);
    }
  }, [isMeasureModalOpen, editingMeasureId, selectedTableId, project?.measures]);

  useEffect(() => {
    if (!isMeasureModalOpen) {
      setName(""); 
      setFormula(""); 
      setResultType("number");
      setEditingMeasureId(null);
    }
  }, [isMeasureModalOpen, setEditingMeasureId]);

  const suggestions = useMemo(() => {
    if (!project?.tables) return [];
    const table = project.tables.find((t) => t.id === tableId);
    return table ? generateKPIs(table) : [];
  }, [tableId, project?.tables]);

  const selectedTable = useMemo(() => 
    project?.tables?.find(t => t.id === tableId),
    [tableId, project?.tables]
  );

  const daxPreview = useMemo(() => {
    if (!formula) return "";
    try {
      return convertToDAX(formula, selectedTable?.name || "Table");
    } catch (e) {
      return formula;
    }
  }, [formula, selectedTable?.name]);

  // --- Early return AFTER hooks ---
  if (!mounted || !isMeasureModalOpen || !project) return null;

  const handleApplySuggestion = (s: SuggestedKPI) => {
    setName(s.name);
    setFormula(s.formula);
    setResultType(s.type);
  };

  const handleSubmit = async () => {
    if (!name || !tableId || !formula) {
      addToast("Please fill all fields", "error");
      return;
    }

    const executableJs = convertToJs(formula);

    // Validation
    try {
      const table = project.tables?.find((t) => t.id === tableId);
      if (table && table.rows?.length > 0) {
        const testFn = new Function("row", "rows", `try { return ${executableJs}; } catch(e) { return null; }`);
        testFn(table.rows[0], table.rows);
      } else {
        new Function("row", "rows", `return ${executableJs}`);
      }
    } catch (e) {
      addToast("Invalid formula syntax", "error");
      console.error("Formula validation error:", e);
      return;
    }

    setIsSaving(true);
    try {
      if (editingMeasureId) {
        updateMeasure(editingMeasureId, {
          name,
          tableId,
          formula: executableJs,
          originalFormula: formula,
          resultType
        });
        addToast(`Measure "${name}" updated`, "success");
      } else {
        addMeasure({ 
          name, 
          tableId, 
          formula: executableJs, 
          originalFormula: formula,
          resultType 
        });
        addToast(`Measure "${name}" created`, "success");
      }

      await saveProject();
      setMeasureModalOpen(false);
    } catch (error) {
      addToast("Failed to save measure", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setMeasureModalOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "850px", width: "95%", maxHeight: "90vh" }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>{editingMeasureId ? "Edit Measure" : "Measure Calculator"}</h2>
            <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{editingMeasureId ? "Update your KPI formula" : "Create KPIs using simplified DAX syntax"}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setMeasureModalOpen(false)}>✕</button>
        </div>

        <div className="modal-body" style={{ 
          display: "grid", 
          gridTemplateColumns: suggestions.length > 0 ? "1fr 280px" : "1fr", 
          gap: "24px", 
          padding: "24px",
          overflowY: "auto" 
        }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label className="label">Table Source</label>
                <select className="select" value={tableId} onChange={(e) => setTableId(e.target.value)}>
                  <option value="">Select table...</option>
                  {project.tables?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Measure Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Total Revenue" />
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "6px" }}>
                <label className="label" style={{ marginBottom: 0 }}>Formula</label>
                <button 
                  type="button"
                  className="btn btn-ghost" 
                  style={{ fontSize: "11px", height: "auto", padding: "4px 8px", background: "var(--color-bg-secondary)" }}
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
                style={{ fontFamily: "monospace", minHeight: "140px", fontSize: "14px", lineHeight: "1.6", backgroundColor: "var(--color-bg-secondary)" }}
              />

              {formula && (
                <div style={{ marginTop: "12px", padding: "12px", background: "var(--color-bg-tertiary)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "6px", fontWeight: 700 }}>DAX Preview</div>
                  <code style={{ color: "var(--color-primary)", fontWeight: 600, wordBreak: "break-all", fontSize: "13px" }}>{daxPreview}</code>
                </div>
              )}

              {showAdvanced && (
                <div style={{ marginTop: "12px", padding: "16px", background: "var(--color-surface-hover)", borderRadius: "10px", border: "1px dashed var(--color-border)" }}>
                  <h4 style={{ fontSize: "13px", marginBottom: "10px", fontWeight: 600 }}>Available Functions:</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                    <code>SUM([Col])</code>
                    <code>AVG([Col])</code>
                    <code>COUNT([Col])</code>
                    <code>DISTINCTCOUNT([Col])</code>
                    <code>MIN([Col])</code>
                    <code>MAX([Col])</code>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "14px" }}>
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

          {suggestions.length > 0 && (
            <div style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", color: "var(--color-text-secondary)" }}>Suggested KPIs</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoveredSuggestion(i)}
                    onMouseLeave={() => setHoveredSuggestion(null)}
                    onClick={() => handleApplySuggestion(s)}
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      background: hoveredSuggestion === i ? "var(--color-surface-hover)" : "var(--color-surface)",
                      border: "1px solid",
                      borderColor: hoveredSuggestion === i ? "var(--color-primary)" : "var(--color-border)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      transform: hoveredSuggestion === i ? "translateY(-2px)" : "none",
                      boxShadow: hoveredSuggestion === i ? "0 4px 12px var(--color-shadow)" : "none"
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "13px", color: hoveredSuggestion === i ? "var(--color-primary)" : "inherit" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "6px", lineHeight: "1.4" }}>{s.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="modal-footer" style={{ marginTop: "0", padding: "20px 24px", background: "var(--color-bg-secondary)" }}>
          <button type="button" className="btn btn-secondary" onClick={() => setMeasureModalOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} style={{ minWidth: "140px" }} disabled={isSaving}>
            {isSaving ? "Saving..." : (editingMeasureId ? "Update Measure" : "Create Measure")}
          </button>
        </div>
      </div>
    </div>
  );
}
