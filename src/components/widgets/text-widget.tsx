/* ============================================================
   Text Widget — Editable text on canvas
   ============================================================ */
"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { Widget } from "@/types";

interface Props {
  widget: Widget;
}

export default function TextWidget({ widget }: Props) {
  const { updateWidget } = useProjectStore();
  const { isPreviewMode } = useUiStore();
  const [isEditing, setIsEditing] = useState(false);

  const content = widget.textConfig?.content || "Click to edit";
  const align = widget.textConfig?.align || "left";

  if (isEditing && !isPreviewMode) {
    return (
      <textarea
        autoFocus
        value={content}
        onChange={(e) =>
          updateWidget(widget.id, {
            textConfig: { ...widget.textConfig!, content: e.target.value },
          })
        }
        onBlur={() => setIsEditing(false)}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          border: "1px dashed var(--color-primary)",
          borderRadius: "4px",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          fontSize: `${widget.style.fontSize}px`,
          fontWeight: widget.style.fontWeight,
          color: widget.style.textColor,
          textAlign: align,
          padding: "4px 8px",
        }}
      />
    );
  }

  return (
    <div
      onDoubleClick={() => !isPreviewMode && setIsEditing(true)}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        fontSize: `${widget.style.fontSize}px`,
        fontWeight: widget.style.fontWeight,
        color: widget.style.textColor,
        cursor: isPreviewMode ? "default" : "text",
        whiteSpace: "pre-wrap",
        padding: "4px 8px",
        overflow: "hidden",
      }}
    >
      {content}
    </div>
  );
}
