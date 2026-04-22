/* ============================================================
   AI Summary Widget
   ============================================================ */
"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/use-project-store";
import type { Widget } from "@/types";
import styles from "./ai-summary-widget.module.css";

interface Props { widget: Widget; }

export default function AiSummaryWidget({ widget }: Props) {
  const { project, updateWidget } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);
  const aiConfig = widget.aiSummaryConfig;

  const handleGenerate = async () => {
    if (!project || project.tables.length === 0) return;
    setIsLoading(true);

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
        body: JSON.stringify({ tables: tablesForAI, prompt: aiConfig?.prompt || "" }),
      });

      const data = await res.json();
      updateWidget(widget.id, {
        aiSummaryConfig: { ...aiConfig!, generatedText: data.summary, isLoading: false },
      });
    } catch (error) {
      console.error(error);
      updateWidget(widget.id, {
        aiSummaryConfig: { ...aiConfig!, generatedText: "Failed to generate insights.", isLoading: false },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["ai-widget"]}>
      <div className={styles["ai-header"]}>
        <span className={styles["ai-badge"]}>🤖 AI Insights</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleGenerate}
          disabled={isLoading || !project?.tables.length}
        >
          {isLoading ? "Analyzing..." : "Generate"}
        </button>
      </div>
      <div className={styles["ai-content"]}>
        {isLoading ? (
          <div className={styles["ai-loading"]}>
            <div className={styles["ai-pulse"]} />
            <span>Analyzing your data...</span>
          </div>
        ) : aiConfig?.generatedText ? (
          <div className={styles["ai-text"]}>{aiConfig.generatedText}</div>
        ) : (
          <div className={styles["ai-placeholder"]}>
            Click &quot;Generate&quot; to get AI-powered insights about your data
          </div>
        )}
      </div>
    </div>
  );
}
