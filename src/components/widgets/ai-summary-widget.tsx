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

  // Helper to format AI response into rich UI components
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line.trim();
      if (!content) return <div key={idx} style={{ height: "12px" }} />;

      // Section Headers (Detecting Markdown or Capitalized labels)
      const isHeader = content.startsWith("###") || content.startsWith("##") || 
                       (content.endsWith(":") && content.length < 40 && !content.startsWith("•"));
      
      // Bold tags **text**
      const formattedContent = content
        .replace(/^#+\s*/, "") // Remove # headers
        .split(/(\*\*.*?\*\*)/g)
        .map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} style={{ color: "var(--color-text)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });

      if (isHeader) {
        let icon = "📊";
        const lower = content.toLowerCase();
        if (lower.includes("summary")) icon = "📝";
        if (lower.includes("trend")) icon = "📈";
        if (lower.includes("anomaly") || lower.includes("outlier")) icon = "🔍";
        if (lower.includes("recommend")) icon = "🚀";
        if (lower.includes("insight")) icon = "💡";

        return (
          <h4 key={idx} style={{ 
            fontSize: "14px", 
            fontWeight: 800, 
            marginTop: "20px", 
            marginBottom: "10px", 
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: "1px solid var(--color-border-light)",
            paddingBottom: "4px"
          }}>
            <span>{icon}</span>
            {formattedContent}
          </h4>
        );
      }

      // Bullet points
      if (content.startsWith("-") || content.startsWith("•") || content.match(/^\d+\./)) {
        return (
          <div key={idx} style={{ 
            display: "flex", 
            gap: "10px", 
            marginBottom: "8px", 
            paddingLeft: "4px",
            fontSize: "13px",
            lineHeight: "1.6"
          }}>
            <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>•</span>
            <div style={{ flex: 1 }}>{formattedContent}</div>
          </div>
        );
      }

      return (
        <p key={idx} style={{ 
          marginBottom: "12px", 
          fontSize: "13px", 
          lineHeight: "1.7",
          color: "var(--color-text-secondary)" 
        }}>
          {formattedContent}
        </p>
      );
    });
  };

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
            {renderFormattedText(aiConfig.generatedText)}
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
