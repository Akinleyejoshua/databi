/* ============================================================
   AI Summary Widget — Robust Version
   ============================================================ */
"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { Widget } from "@/types";
import styles from "./ai-summary-widget.module.css";
import AiFormattedText from "@/components/shared/ai-formatted-text";

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
      const mode = aiConfig?.analysisMode || "data";
      let payload: any = { mode, prompt: aiConfig?.prompt || "" };

      if (mode === "charts") {
        // Gather all chart configs and their definitions
        payload.charts = project.widgets
          .filter(w => w.type === "chart" && w.chartConfig)
          .map(w => ({
            title: w.title,
            type: w.chartConfig?.chartType,
            fields: w.chartConfig?.fields,
            values: w.chartConfig?.values
          }));
      } else {
        const tablesToSend = aiConfig?.tableIds?.length
          ? project.tables.filter((t) => aiConfig.tableIds.includes(t.id))
          : project.tables;

        payload.tables = tablesToSend.map((t) => ({
          name: t.name,
          rowCount: t.rowCount,
          columns: t.columns,
          // Only send rows if in 'data' mode
          rows: mode === "data" ? t.rows.slice(0, 50) : [],
        }));
      }

      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Save result to store
      updateWidget(widget.id, {
        aiSummaryConfig: { 
          ...(aiConfig || { prompt: "", tableIds: [], analysisMode: "data" }), 
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
          ...(aiConfig || { prompt: "", tableIds: [], analysisMode: "data" }), 
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
          <span className={styles["ai-badge"]}>🤖 AI Data Analyst</span>
          {localLoading && <div className={styles["ai-pulse"]} style={{ width: "8px", height: "8px" }} />}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleGenerate();
          }}
          disabled={localLoading || !project?.tables.length}
          style={{ height: "28px", padding: "0 12px", borderRadius: "14px" }}
        >
          {localLoading ? "Analyzing..." : hasAnalysis ? "Regenerate" : "Generate Analysis"}
        </button>
      </div>

      <div className={styles["ai-content"]} style={{ 
        flex: 1, 
        overflowY: "auto", 
        minHeight: "100px",
        padding: "16px 4px"
      }}>
        {localLoading ? (
          <div className={styles["ai-loading"]}>
            <div className={styles["ai-pulse"]} />
            <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
              Crunching numbers and identifying trends...
            </span>
          </div>
        ) : hasAnalysis ? (
          <div className={styles["ai-container"]} style={{ paddingRight: "8px" }}>
            <AiFormattedText text={aiConfig.generatedText} />
          </div>
        ) : (
          <div className={styles["ai-placeholder"]}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>💡</div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text)", marginBottom: "8px" }}>
              Ready to analyze your data?
            </h3>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              Click the button above to generate AI-powered summaries, detect anomalies, and get strategic recommendations based on your tables.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
