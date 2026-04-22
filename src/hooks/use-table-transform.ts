/* ============================================================
   Table Transform Hook
   Handles table transformation operations with undo/redo support
   ============================================================ */

import { useCallback } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { DataTable, TransformRequest, TransformAction, DataType } from "@/types";

export const useTableTransform = () => {
  const { project, applyTableTransform } = useProjectStore();
  const { addToast } = useUiStore();

  const applyTransform = useCallback(
    async (tableId: string, action: TransformAction, targetType?: DataType) => {
      if (!project) return;

      const table = project.tables.find((t) => t.id === tableId);
      if (!table) {
        addToast("Table not found", "error");
        return;
      }

      try {
        // Call the transform API
        const res = await fetch("/api/data/transform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table,
            transform: {
              tableId,
              action,
              targetType,
            } as TransformRequest,
          }),
        });

        if (!res.ok) throw new Error("Transform failed");

        const { table: transformedTable } = await res.json();

        // Apply the transformed table (automatically tracked by useProjectHistory)
        applyTableTransform(tableId, transformedTable);

        addToast(`Transform "${action}" applied successfully`, "success");
      } catch (error) {
        console.error("Transform error:", error);
        addToast("Transform failed", "error");
      }
    },
    [project, applyTableTransform, addToast]
  );

  return { applyTransform };
};
