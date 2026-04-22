/* ============================================================
   Project Store — Zustand
   Manages project data: tables, relationships, measures,
   widgets, canvas settings, and filters.
   ============================================================ */

import { create } from "zustand";
import type {
  Project,
  DataTable,
  Relationship,
  Measure,
  Widget,
  CanvasSettings,
  ActiveFilter,
  WidgetStyle,
} from "@/types";
import { generateId, getDefaultWidgetStyle } from "@/lib/utils";

interface ProjectStore {
  /* --- State --- */
  project: Project | null;
  activeFilters: ActiveFilter[];
  selectedWidgetId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;

  /* --- Project Actions --- */
  setProject: (project: Project) => void;
  updateProjectMeta: (name: string, description: string) => void;
  resetProject: () => void;

  /* --- Table Actions --- */
  addTable: (table: DataTable) => void;
  updateTable: (tableId: string, table: Partial<DataTable>) => void;
  removeTable: (tableId: string) => void;

  /* --- Relationship Actions --- */
  addRelationship: (relationship: Omit<Relationship, "id">) => void;
  removeRelationship: (relationshipId: string) => void;

  /* --- Measure Actions --- */
  addMeasure: (measure: Omit<Measure, "id">) => void;
  updateMeasure: (measureId: string, measure: Partial<Measure>) => void;
  removeMeasure: (measureId: string) => void;

  /* --- Widget Actions --- */
  addWidget: (widget: Widget) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  updateWidgetStyle: (widgetId: string, style: Partial<WidgetStyle>) => void;
  removeWidget: (widgetId: string) => void;
  setSelectedWidget: (widgetId: string | null) => void;
  updateLayouts: (
    layouts: { id: string; x: number; y: number; w: number; h: number }[]
  ) => void;

  /* --- Canvas Settings --- */
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void;

  /* --- Filter Actions --- */
  setFilter: (filter: ActiveFilter) => void;
  clearFilter: (tableId: string, columnName: string) => void;
  clearAllFilters: () => void;

  /* --- Persistence --- */
  saveProject: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  setDirty: (dirty: boolean) => void;
}

const defaultCanvasSettings: CanvasSettings = {
  backgroundColor: "#ffffff",
  width: 1200,
  cols: 24,
  rowHeight: 30,
};

const defaultProject: Project = {
  name: "Untitled Project",
  description: "",
  tables: [],
  relationships: [],
  measures: [],
  widgets: [],
  canvasSettings: defaultCanvasSettings,
  filters: {},
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  activeFilters: [],
  selectedWidgetId: null,
  isDirty: false,
  isSaving: false,
  isLoading: false,

  /* --- Project Actions --- */
  setProject: (project) => set({ project, isDirty: false }),

  updateProjectMeta: (name, description) =>
    set((state) => ({
      project: state.project ? { ...state.project, name, description } : null,
      isDirty: true,
    })),

  resetProject: () =>
    set({
      project: { ...defaultProject },
      activeFilters: [],
      selectedWidgetId: null,
      isDirty: false,
    }),

  /* --- Table Actions --- */
  addTable: (table) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, tables: [...state.project.tables, table] }
        : null,
      isDirty: true,
    })),

  updateTable: (tableId, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            tables: state.project.tables.map((t) =>
              t.id === tableId ? { ...t, ...updates } : t
            ),
          }
        : null,
      isDirty: true,
    })),

  removeTable: (tableId) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            tables: state.project.tables.filter((t) => t.id !== tableId),
            relationships: state.project.relationships.filter(
              (r) =>
                r.sourceTableId !== tableId && r.targetTableId !== tableId
            ),
          }
        : null,
      isDirty: true,
    })),

  /* --- Relationship Actions --- */
  addRelationship: (relationship) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            relationships: [
              ...state.project.relationships,
              { ...relationship, id: generateId() },
            ],
          }
        : null,
      isDirty: true,
    })),

  removeRelationship: (relationshipId) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            relationships: state.project.relationships.filter(
              (r) => r.id !== relationshipId
            ),
          }
        : null,
      isDirty: true,
    })),

  /* --- Measure Actions --- */
  addMeasure: (measure) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            measures: [
              ...state.project.measures,
              { ...measure, id: generateId() },
            ],
          }
        : null,
      isDirty: true,
    })),

  updateMeasure: (measureId, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            measures: state.project.measures.map((m) =>
              m.id === measureId ? { ...m, ...updates } : m
            ),
          }
        : null,
      isDirty: true,
    })),

  removeMeasure: (measureId) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            measures: state.project.measures.filter(
              (m) => m.id !== measureId
            ),
          }
        : null,
      isDirty: true,
    })),

  /* --- Widget Actions --- */
  addWidget: (widget) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, widgets: [...state.project.widgets, widget] }
        : null,
      isDirty: true,
      selectedWidgetId: widget.id,
    })),

  updateWidget: (widgetId, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            widgets: state.project.widgets.map((w) =>
              w.id === widgetId ? { ...w, ...updates } : w
            ),
          }
        : null,
      isDirty: true,
    })),

  updateWidgetStyle: (widgetId, styleUpdates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            widgets: state.project.widgets.map((w) =>
              w.id === widgetId
                ? { ...w, style: { ...w.style, ...styleUpdates } }
                : w
            ),
          }
        : null,
      isDirty: true,
    })),

  removeWidget: (widgetId) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            widgets: state.project.widgets.filter((w) => w.id !== widgetId),
          }
        : null,
      selectedWidgetId:
        state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
      isDirty: true,
    })),

  setSelectedWidget: (widgetId) => set({ selectedWidgetId: widgetId }),

  updateLayouts: (layouts) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            widgets: state.project.widgets.map((w) => {
              const layout = layouts.find((l) => l.id === w.id);
              return layout
                ? {
                    ...w,
                    layout: {
                      ...w.layout,
                      x: layout.x,
                      y: layout.y,
                      w: layout.w,
                      h: layout.h,
                    },
                  }
                : w;
            }),
          }
        : null,
      isDirty: true,
    })),

  /* --- Canvas Settings --- */
  updateCanvasSettings: (settings) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            canvasSettings: {
              ...state.project.canvasSettings,
              ...settings,
            },
          }
        : null,
      isDirty: true,
    })),

  /* --- Filter Actions --- */
  setFilter: (filter) =>
    set((state) => {
      const existing = state.activeFilters.findIndex(
        (f) =>
          f.tableId === filter.tableId && f.columnName === filter.columnName
      );
      const newFilters = [...state.activeFilters];
      if (existing >= 0) {
        newFilters[existing] = filter;
      } else {
        newFilters.push(filter);
      }
      return { activeFilters: newFilters };
    }),

  clearFilter: (tableId, columnName) =>
    set((state) => ({
      activeFilters: state.activeFilters.filter(
        (f) => !(f.tableId === tableId && f.columnName === columnName)
      ),
    })),

  clearAllFilters: () => set({ activeFilters: [] }),

  /* --- Persistence --- */
  saveProject: async () => {
    const { project } = get();
    if (!project) return;

    set({ isSaving: true });

    try {
      const method = project._id ? "PUT" : "POST";
      const url = project._id
        ? `/api/projects/${project._id}`
        : "/api/projects";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });

      if (!res.ok) throw new Error("Failed to save project");

      const saved = await res.json();
      set({ project: saved, isDirty: false, isSaving: false });
    } catch (error) {
      console.error("Save error:", error);
      set({ isSaving: false });
      throw error;
    }
  },

  loadProject: async (id) => {
    set({ isLoading: true });

    try {
      const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load project");

      const project = await res.json();
      set({ project, isDirty: false, isLoading: false });
    } catch (error) {
      console.error("Load error:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  setDirty: (dirty) => set({ isDirty: dirty }),
}));
