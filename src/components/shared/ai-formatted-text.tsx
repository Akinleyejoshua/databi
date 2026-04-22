/* ============================================================
   AI Formatted Text — Premium Grid Version
   ============================================================ */
"use client";

import React from "react";
import styles from "../widgets/ai-summary-widget.module.css";

interface Props {
  text: string;
}

export default function AiFormattedText({ text }: Props) {
  if (!text) return null;

  // 1. Identify Sections
  // We'll look for ### Key Findings, ### Recommendations, ### Risks, ### Opportunities
  const sections = text.split(/###\s+/);
  
  // The first part (before the first ###) is the intro
  const introText = sections[0].trim();
  const cardSections = sections.slice(1);

  const getSectionIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("finding")) return "🎯";
    if (lower.includes("recommend")) return "📈";
    if (lower.includes("risk")) return "⚠️";
    if (lower.includes("opportunit")) return "💡";
    return "📊";
  };

  const getSectionClass = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("finding")) return styles["card-findings"];
    if (lower.includes("recommend")) return styles["card-recommendations"];
    if (lower.includes("risk")) return styles["card-risks"];
    if (lower.includes("opportunit")) return styles["card-opportunities"];
    return "";
  };

  const formatLine = (line: string) => {
    return line
      .split(/(\*\*.*?\*\*)/g)
      .map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
  };

  return (
    <div className={styles["ai-container"]}>
      {introText && (
        <div className={styles["ai-intro"]}>
          {introText.split("\n").map((line, i) => (
            <p key={i}>{formatLine(line)}</p>
          ))}
        </div>
      )}

      <div className={styles["ai-grid"]}>
        {cardSections.map((section, idx) => {
          const lines = section.trim().split("\n");
          const title = lines[0].trim();
          const contentLines = lines.slice(1).filter(l => l.trim().length > 0);

          return (
            <div key={idx} className={`${styles["ai-card"]} ${getSectionClass(title)}`}>
              <div className={styles["ai-card-header"]}>
                <span>{getSectionIcon(title)}</span>
                {title}
              </div>
              <div className={styles["ai-card-content"]}>
                <ul>
                  {contentLines.map((line, lIdx) => (
                    <li key={lIdx}>
                      {formatLine(line.replace(/^[•\-\*\d\.]+\s*/, ""))}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

