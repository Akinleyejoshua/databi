/* ============================================================
   Measures Editor Modal
   ============================================================ */
"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { DataType } from "@/types";

export default function MeasuresModal() {
  const { isMeasureModalOpen, setMeasureModalOpen, addToast } = useUiStore();
  const { project, addMeasure } = useProjectStore();

  const [name, setName] = useState("");
  const [tableId, setTableId] = useState("");
  const [formula, setFormula] = useState("");
  const [resultType, setResultType] = useState<DataType>("number");

  if (!isMeasureModalOpen || !project) return null;

  const handleSubmit = () => {
    if (!name || !tableId || !formula) {
      addToast("Please fill all fields", "error");
      return;
    }

    // Validate formula by trying to create a function
    try {
      const table = project.tables.find((t) => t.id === tableId);
      if (table && table.rows.length > 0) {
        const testFn = new Function("row", "rows", `return ${formula}`);
        testFn(table.rows[0], table.rows);
      }
    } catch (e) {
      addToast("Invalid formula syntax", "error");
      return;
    }

    addMeasure({ name, tableId, formula, resultType });
    addToast(`Measure "${name}" created`, "success");
    setName(""); setTableId(""); setFormula(""); setResultType("number");
    setMeasureModalOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setMeasureModalOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Measure</h2>
          <button className="btn btn-ghost btn-icon" onClick={() => setMeasureModalOpen(false)}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="label">Measure Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Total Revenue" />
          </div>
          <div>
            <label className="label">Table</label>
            <select className="select" value={tableId} onChange={(e) => setTableId(e.target.value)}>
              <option value="">Select table...</option>
              {project.tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Formula (JavaScript expression)</label>
            <textarea
              className="textarea"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder={`e.g. rows.reduce((sum, r) => sum + Number(r["Amount"]), 0)`}
              style={{ fontFamily: "monospace", minHeight: "100px" }}
            />
            <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
              Available variables: <code>row</code> (current row), <code>rows</code> (all rows)
            </p>
          </div>
          <div>
            <label className="label">Result Type</label>
            <select className="select" value={resultType} onChange={(e) => setResultType(e.target.value as DataType)}>
              <option value="number">Number</option>
              <option value="string">String</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setMeasureModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Create Measure</button>
        </div>
      </div>
    </div>
  );
}
