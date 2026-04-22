/* ============================================================
   Relationships Modal
   ============================================================ */
"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { Relationship } from "@/types";

export default function RelationshipsModal() {
  const { isRelationshipModalOpen, setRelationshipModalOpen, addToast } = useUiStore();
  const { project, addRelationship } = useProjectStore();

  const [sourceTableId, setSourceTableId] = useState("");
  const [sourceColumn, setSourceColumn] = useState("");
  const [targetTableId, setTargetTableId] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [cardinality, setCardinality] = useState<Relationship["cardinality"]>("one-to-many");

  if (!isRelationshipModalOpen || !project) return null;

  const sourceTable = project.tables.find((t) => t.id === sourceTableId);
  const targetTable = project.tables.find((t) => t.id === targetTableId);

  const handleSubmit = () => {
    if (!sourceTableId || !sourceColumn || !targetTableId || !targetColumn) {
      addToast("Please fill all fields", "error");
      return;
    }
    addRelationship({ sourceTableId, sourceColumn, targetTableId, targetColumn, cardinality });
    addToast("Relationship created", "success");
    setSourceTableId(""); setSourceColumn(""); setTargetTableId(""); setTargetColumn("");
    setRelationshipModalOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setRelationshipModalOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Relationship</h2>
          <button className="btn btn-ghost btn-icon" onClick={() => setRelationshipModalOpen(false)}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="label">Source Table</label>
            <select className="select" value={sourceTableId} onChange={(e) => { setSourceTableId(e.target.value); setSourceColumn(""); }}>
              <option value="">Select table...</option>
              {project.tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {sourceTable && (
            <div>
              <label className="label">Source Column</label>
              <select className="select" value={sourceColumn} onChange={(e) => setSourceColumn(e.target.value)}>
                <option value="">Select column...</option>
                {sourceTable.columns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Target Table</label>
            <select className="select" value={targetTableId} onChange={(e) => { setTargetTableId(e.target.value); setTargetColumn(""); }}>
              <option value="">Select table...</option>
              {project.tables.filter((t) => t.id !== sourceTableId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {targetTable && (
            <div>
              <label className="label">Target Column</label>
              <select className="select" value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)}>
                <option value="">Select column...</option>
                {targetTable.columns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Cardinality</label>
            <select className="select" value={cardinality} onChange={(e) => setCardinality(e.target.value as Relationship["cardinality"])}>
              <option value="one-to-one">One-to-One</option>
              <option value="one-to-many">One-to-Many</option>
              <option value="many-to-many">Many-to-Many</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setRelationshipModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Create</button>
        </div>
      </div>
    </div>
  );
}
