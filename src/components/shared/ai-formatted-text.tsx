/* ============================================================
   AI Formatted Text — Shared component for rendering AI insights
   ============================================================ */
"use client";

import React from "react";

interface Props {
  text: string;
}

export default function AiFormattedText({ text }: Props) {
  if (!text) return null;

  const lines = text.split("\n");
  return (
    <div className="ai-formatted-content">
      {lines.map((line, idx) => {
        let content = line.trim();
        if (!content) return <div key={idx} style={{ height: "12px" }} />;

        // Section Headers
        const isHeader = content.startsWith("###") || content.startsWith("##") || 
                         (content.endsWith(":") && content.length < 40 && !content.startsWith("•"));
        
        const formattedContent = content
          .replace(/^#+\s*/, "") 
          .split(/(\*\*.*?\*\*)/g)
          .map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={part + i} style={{ color: "var(--color-text)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
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
      })}
    </div>
  );
}
