/* ============================================================
   History Debug Info Component
   Shows current history state for debugging
   ============================================================ */

"use client";

import { useProjectHistory } from "@/store/use-project-history";
import { useHistoryStore } from "@/store/use-history-store";

export function HistoryDebugInfo() {
  const { canUndo, canRedo } = useProjectHistory();
  const { past, future } = useHistoryStore();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: "12px 16px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "#fff",
        borderRadius: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <div>History Debug Info</div>
      <div style={{ marginTop: "8px", opacity: 0.8 }}>
        <div>Past: {past.length}</div>
        <div>Future: {future.length}</div>
        <div style={{ marginTop: "8px" }}>
          Undo: <span style={{ color: canUndo ? "#4ade80" : "#ef4444" }}>{canUndo ? "✓" : "✗"}</span>
        </div>
        <div>
          Redo: <span style={{ color: canRedo ? "#4ade80" : "#ef4444" }}>{canRedo ? "✓" : "✗"}</span>
        </div>
      </div>
      <div style={{ marginTop: "8px", fontSize: "10px", opacity: 0.6 }}>Ctrl+Z: Undo</div>
      <div style={{ fontSize: "10px", opacity: 0.6 }}>Ctrl+Shift+Z: Redo</div>
    </div>
  );
}
