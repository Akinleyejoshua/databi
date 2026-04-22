/* ============================================================
   Save Manager Hook
   Handles auto-save and manual save with debouncing
   ============================================================ */

import { useEffect, useRef, useCallback } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";

export const useSaveManager = () => {
  const { project, isDirty, isSaving, saveProject, setDirty } = useProjectStore();
  const { autoSaveEnabled, unsavedChanges, setUnsavedChanges, addToast } = useUiStore();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSavingRef = useRef(false);

  // Update unsaved changes indicator
  useEffect(() => {
    setUnsavedChanges(isDirty);
  }, [isDirty, setUnsavedChanges]);

  // Manual save function
  const handleSave = useCallback(async () => {
    if (!project) {
      addToast("No project loaded", "error");
      return;
    }

    try {
      await saveProject();
      addToast("Project saved successfully", "success");
    } catch (error) {
      console.error("Save error:", error);
      addToast("Failed to save project", "error");
    }
  }, [project, saveProject, addToast]);

  // Auto-save with debouncing (5 seconds after last change)
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || isSaving || isAutoSavingRef.current) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!project || !isDirty) return;

      isAutoSavingRef.current = true;
      try {
        await saveProject();
        console.log("Auto-save completed");
      } catch (error) {
        console.error("Auto-save error:", error);
        addToast("Auto-save failed", "error");
      } finally {
        isAutoSavingRef.current = false;
      }
    }, 5000); // 5 second debounce

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSaveEnabled, isDirty, isSaving, project, saveProject, addToast]);

  return {
    handleSave,
    isDirty,
    isSaving,
    unsavedChanges,
    autoSaveEnabled,
  };
};
