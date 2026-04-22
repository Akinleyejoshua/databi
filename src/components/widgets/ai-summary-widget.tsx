/* ============================================================
   AI Summary Widget — Robust Version
   ============================================================ */
"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { Widget } from "@/types";
import styles from "./ai-summary-widget.module.css";

interface Props { widget: Widget; }

export default function AiSummaryWidget({ widget }: Props) {
  const { project, updateWidget } = useProjectStore();
  const { addToast } = useUiStore();
  
  // Use local state for immediate feedback, but sync with widget config
  const [localLoading, setLocalLoading] = useState(false);
  const aiConfig = widget.aiSummaryConfig;

  const handleGenerate = async () => {
    if (!project || project.tables.length === 0) {
      addToast("No data available for analysis", "error");
      return;
    }
    
    setLocalLoading(true);
    addToast("Starting AI analysis...", "info");

    try {
      const tablesToSend = aiConfig?.tableIds?.length
        ? project.tables.filter((t) => aiConfig.tableIds.includes(t.id))
        : project.tables;

      const tablesForAI = tablesToSend.map((t) => ({
        name: t.name,
        rowCount: t.rowCount,
        columns: t.columns,
        rows: t.rows.slice(0, 50),
      }));

      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tables: tablesForAI, 
          prompt: aiConfig?.prompt || "" 
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Save result to store
      updateWidget(widget.id, {
        aiSummaryConfig: { 
          ...(aiConfig || { prompt: "", tableIds: [] }), 
          generatedText: data.summary || "Analysis returned no content.", 
          isLoading: false 
        },
      });
      
      addToast("Analysis generated!", "success");
    } catch (error: any) {
      console.error("AI Insight Error:", error);
      addToast(error.message || "Failed to generate insights", "error");
      
      updateWidget(widget.id, {
        aiSummaryConfig: { 
          ...(aiConfig || { prompt: "", tableIds: [] }), 
          generatedText: `Failed to generate insights: ${error.message}`, 
          isLoading: false 
        },
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const hasAnalysis = aiConfig?.generatedText && aiConfig.generatedText.trim().length > 0;

  return (
    <div className={styles["ai-widget"]} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className={styles["ai-header"]}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className={styles["ai-badge"]}>🤖 AI Insight</span>
          {localLoading && <div className={styles["ai-pulse"]} style={{ width: "8px", height: "8px" }} />}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleGenerate}
          disabled={localLoading || !project?.tables.length}
          style={{ height: "28px", padding: "0 12px" }}
        >
          {localLoading ? "Analyzing..." : hasAnalysis ? "Regenerate" : "Generate"}
        </button>
      </div>

      <div className={styles["ai-content"]} style={{ flex: 1, overflowY: "auto", minHeight: "100px" }}>
        {localLoading ? (
          <div className={styles["ai-loading"]}>
            <div className={styles["ai-pulse"]} />
            <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
              Scanning tables and detecting patterns...
            </span>
          </div>
        ) : hasAnalysis ? (
          <div className={styles["ai-text"]} style={{ padding: "8px 0" }}>
            {aiConfig.generatedText}
          </div>
        ) : (
          <div className={styles["ai-placeholder"]}>
            <div style={{ fontSize: "24px", marginBottom: "12px" }}>💡</div>
            <p>Click <strong>Generate</strong> to analyze your dataset with AI.</p>
            <p style={{ fontSize: "11px", marginTop: "8px", opacity: 0.7 }}>
              AI will look for trends, outliers, and key summaries across your tables.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
