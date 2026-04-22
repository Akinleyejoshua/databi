/* ============================================================
   Undo/Redo Integration Hook
   Manages history for all project state changes
   ============================================================ */

import { useEffect, useRef, useCallback } from "react";
import { useProjectStore } from "./use-project-store";
import { useHistoryStore } from "./use-history-store";
import type { Project } from "@/types";

export const useProjectHistory = () => {
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const { past, future, pushHistory, clearHistory } = useHistoryStore();

  const lastSavedStateRef = useRef<string>("");

  // Track project changes and push to history
  useEffect(() => {
    if (!project) {
      clearHistory();
      lastSavedStateRef.current = "";
      return;
    }

    const currentState = JSON.stringify(project);

    // If this is the first load or state hasn't changed, don't push to history
    if (lastSavedStateRef.current === "" || lastSavedStateRef.current === currentState) {
      if (lastSavedStateRef.current === "") {
        lastSavedStateRef.current = currentState;
        clearHistory();
        console.log("History initialized for project:", project.name);
      }
      return;
    }

    // State has changed, push previous state to history
    const previousState = JSON.parse(lastSavedStateRef.current);
    pushHistory(previousState);
    lastSavedStateRef.current = currentState;
    console.log("Project change tracked - History size:", useHistoryStore.getState().past.length);
  }, [project, pushHistory, clearHistory]);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const currentState = project;
    const previousState = past[past.length - 1];

    // Update history: move current to future, remove from past
    useHistoryStore.setState((state) => ({
      past: state.past.slice(0, -1),
      future: currentState ? [currentState, ...state.future] : state.future,
    }));

    // Restore previous state
    lastSavedStateRef.current = JSON.stringify(previousState);
    setProject(previousState);
  }, [past, project, setProject]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const currentState = project;
    const nextState = future[0];

    // Update history: move next to past, remove from future
    useHistoryStore.setState((state) => ({
      past: currentState ? [...state.past, currentState] : state.past,
      future: state.future.slice(1),
    }));

    // Restore next state
    lastSavedStateRef.current = JSON.stringify(nextState);
    setProject(nextState);
  }, [future, project, setProject]);

  return {
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pastLength: past.length,
    futureLength: future.length,
  };
};

export const useHistoryShortcuts = () => {
  const { undo, redo, canUndo, canRedo } = useProjectHistory();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input or textarea, but allow contentEditable elements
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target && target.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      // Make key lowercase for consistent comparison
      const key = e.key.toLowerCase();

      // Ctrl+Z or Cmd+Z for undo (case-insensitive)
      if ((e.ctrlKey || e.metaKey) && key === "z" && !e.shiftKey) {
        e.preventDefault();
        console.log("Undo triggered - canUndo:", canUndo);
        if (canUndo) {
          undo();
        }
      }

      // Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z for redo (case-insensitive)
      if (
        ((e.ctrlKey || e.metaKey) && key === "z" && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && key === "y" && !e.shiftKey)
      ) {
        e.preventDefault();
        console.log("Redo triggered - canRedo:", canRedo);
        if (canRedo) {
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return { undo, redo, canUndo, canRedo };
};
