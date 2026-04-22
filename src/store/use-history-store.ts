/* ============================================================
   History/Undo-Redo Store — Zustand
   Manages undo/redo history for all project operations.
   ============================================================ */

import { create } from "zustand";
import type { Project } from "@/types";

interface HistoryState {
  past: Project[];
  future: Project[];
}

interface HistoryStore extends HistoryState {
  /* --- History Actions --- */
  pushHistory: (project: Project) => void;
  undo: () => Project | null;
  redo: () => Project | null;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const DEFAULT_HISTORY_SIZE = 100;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],

  pushHistory: (project) =>
    set((state) => {
      // When new action is performed, clear future history
      const newPast = [...state.past, project].slice(-DEFAULT_HISTORY_SIZE);
      console.log("📝 History pushed - new size:", newPast.length);
      return {
        past: newPast,
        future: [],
      };
    }),

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return null;

    const previousState = past[past.length - 1];
    const newPast = past.slice(0, -1);
    const newFuture = past.length > 0 ? [past[past.length - 1], ...future] : future;

    // Get current state from project store to add to future
    const currentState = past[past.length - 1];

    set({
      past: newPast,
      future: [currentState, ...future],
    });

    return previousState;
  },

  redo: () => {
    const { future, past } = get();
    if (future.length === 0) return null;

    const nextState = future[0];
    const newFuture = future.slice(1);
    const newPast = [past[past.length - 1], ...past];

    set({
      past: newPast,
      future: newFuture,
    });

    return nextState;
  },

  clearHistory: () =>
    set({
      past: [],
      future: [],
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));

/* ============================================================
   History Manager Hook
   Simplifies integration with project store
   ============================================================ */

export const useUndoRedo = () => {
  const { past, future, pushHistory, undo, redo, clearHistory, canUndo, canRedo } =
    useHistoryStore();

  const handleUndo = (currentProject: Project) => {
    const previousProject = undo();
    if (previousProject && currentProject) {
      return previousProject;
    }
    return null;
  };

  const handleRedo = (currentProject: Project) => {
    const nextProject = redo();
    if (nextProject && currentProject) {
      return nextProject;
    }
    return null;
  };

  return {
    past,
    future,
    pushHistory,
    handleUndo,
    handleRedo,
    clearHistory,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
};
