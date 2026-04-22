/* ============================================================
   UI Store — Zustand
   Manages UI state: theme, panels, modals, active tabs
   ============================================================ */

import { create } from "zustand";
import type { EditorTab, DataPanel, SidebarPanel } from "@/types";

interface UiStore {
  /* --- Theme --- */
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;

  /* --- Editor Navigation --- */
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;

  /* --- Panels --- */
  dataPanel: DataPanel;
  setDataPanel: (panel: DataPanel) => void;

  sidebarPanel: SidebarPanel;
  setSidebarPanel: (panel: SidebarPanel) => void;

  /* --- Modals --- */
  isUploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;

  isNewProjectModalOpen: boolean;
  setNewProjectModalOpen: (open: boolean) => void;

  isShareModalOpen: boolean;
  setShareModalOpen: (open: boolean) => void;

  isRelationshipModalOpen: boolean;
  setRelationshipModalOpen: (open: boolean) => void;

  isMeasureModalOpen: boolean;
  setMeasureModalOpen: (open: boolean) => void;

  editingMeasureId: string | null;
  setEditingMeasureId: (id: string | null) => void;

  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;

  /* --- Data View --- */
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;

  /* --- Canvas --- */
  isPreviewMode: boolean;
  setPreviewMode: (mode: boolean) => void;

  cursorMode: "select" | "pan";
  setCursorMode: (mode: "select" | "pan") => void;

  /* --- AI Insights --- */
  globalAnalysis: string | null;
  setGlobalAnalysis: (analysis: string | null) => void;
  isAnalyzingGlobal: boolean;
  setIsAnalyzingGlobal: (loading: boolean) => void;

  /* --- Toasts --- */
  toasts: { id: string; message: string; type: "success" | "error" | "info" }[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;

  /* --- Auto-Save --- */
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  unsavedChanges: boolean;
  setUnsavedChanges: (unsaved: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  /* --- Theme --- */
  theme: "dark",
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", newTheme);
      }
      return { theme: newTheme };
    }),
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    set({ theme });
  },

  /* --- Editor Navigation --- */
  activeTab: "data",
  setActiveTab: (tab) => set({ activeTab: tab }),

  /* --- Panels --- */
  dataPanel: "tables",
  setDataPanel: (panel) => set({ dataPanel: panel }),

  sidebarPanel: "widgets",
  setSidebarPanel: (panel) => set({ sidebarPanel: panel }),

  /* --- Modals --- */
  isUploadModalOpen: false,
  setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),

  isNewProjectModalOpen: false,
  setNewProjectModalOpen: (open) => set({ isNewProjectModalOpen: open }),

  isShareModalOpen: false,
  setShareModalOpen: (open) => set({ isShareModalOpen: open }),

  isRelationshipModalOpen: false,
  setRelationshipModalOpen: (open) => set({ isRelationshipModalOpen: open }),

  isMeasureModalOpen: false,
  setMeasureModalOpen: (open) => set({ isMeasureModalOpen: open }),

  editingMeasureId: null,
  setEditingMeasureId: (id) => set({ editingMeasureId: id }),

  isSettingsModalOpen: false,
  setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),

  /* --- Data View --- */
  selectedTableId: null,
  setSelectedTableId: (id) => set({ selectedTableId: id }),

  /* --- Canvas --- */
  isPreviewMode: false,
  setPreviewMode: (mode) => set({ isPreviewMode: mode }),

  cursorMode: "select",
  setCursorMode: (mode) => set({ cursorMode: mode }),

  /* --- AI Insights --- */
  globalAnalysis: null,
  setGlobalAnalysis: (analysis) => set({ globalAnalysis: analysis }),
  isAnalyzingGlobal: false,
  setIsAnalyzingGlobal: (loading) => set({ isAnalyzingGlobal: loading }),

  /* --- Toasts --- */
  toasts: [],
  addToast: (message, type = "info") =>
    set((state) => {
      const id = `toast-${Date.now()}`;
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 4000);
      return { toasts: [...state.toasts, { id, message, type }] };
    }),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  /* --- Auto-Save --- */
  autoSaveEnabled: false,
  setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
  unsavedChanges: false,
  setUnsavedChanges: (unsaved) => set({ unsavedChanges: unsaved }),
}));
