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
  Sheet,
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
  applyTableTransform: (tableId: string, transformedTable: DataTable) => void;
  updateTableSource: (tableId: string, url: string, refreshInterval?: number, isAutoRefresh?: boolean) => void;
  getUrlBasedTables: () => DataTable[];

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

  /* --- Sheet / Page Actions --- */
  addSheet: (name: string) => void;
  renameSheet: (sheetId: string, newName: string) => void;
  removeSheet: (sheetId: string) => void;
  setActiveSheet: (sheetId: string) => void;

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
  containerPreset: "default",
  containerBorderRadius: undefined,
  containerShadow: undefined,
  containerBorderColor: undefined,
  containerBorderWidth: undefined,
  containerBgColor: undefined,
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
function cleanTableName(name: string): string {
  try {
    return decodeURIComponent(name).replace(/%20/g, " ").trim();
  } catch {
    return name.replace(/%20/g, " ").trim();
  }
}

function sanitizeProjectTables(project: Project | null): Project | null {
  if (!project) return null;

  const sheets = project.sheets && project.sheets.length > 0
    ? project.sheets
    : [{ id: "default", name: "Page 1", widgets: project.widgets || [] }];
  
  const activeSheetId = project.activeSheetId || sheets[0].id;
  const activeWidgets = sheets.find(s => s.id === activeSheetId)?.widgets || sheets[0].widgets;

  return {
    ...project,
    tables: project.tables.map((t) => ({
      ...t,
      name: cleanTableName(t.name),
    })),
    sheets,
    activeSheetId,
    widgets: activeWidgets
  };
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  activeFilters: [],
  selectedWidgetId: null,
  isDirty: false,
  isSaving: false,
  isLoading: false,

  /* --- Project Actions --- */
  setProject: (project) => set({ project: sanitizeProjectTables(project), activeFilters: [], selectedWidgetId: null, isDirty: false }),

  updateProjectMeta: (name, description) =>
    set((state) => ({
      project: state.project ? { ...state.project, name, description } : null,
      isDirty: true,
    })),

  resetProject: () =>
    set({
      project: sanitizeProjectTables({ ...defaultProject }),
      activeFilters: [],
      selectedWidgetId: null,
      isDirty: false,
    }),

  /* --- Table Actions --- */
  addTable: (table) =>
    set((state) => {
      const cleanedTable = {
        ...table,
        name: cleanTableName(table.name),
      };
      return {
        project: state.project
          ? {
              ...state.project,
              tables: [
                ...state.project.tables.filter((t) => t.id !== table.id),
                cleanedTable,
              ],
            }
          : null,
        isDirty: true,
      };
    }),

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

  applyTableTransform: (tableId, transformedTable) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            tables: state.project.tables.map((t) =>
              t.id === tableId ? transformedTable : t
            ),
          }
        : null,
      isDirty: true,
    })),

  updateTableSource: (tableId, url, refreshInterval, isAutoRefresh) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            tables: state.project.tables.map((t) =>
              t.id === tableId
                ? {
                    ...t,
                    source: {
                      type: "url",
                      url,
                      refreshInterval: refreshInterval || 3600000,
                      isAutoRefresh: isAutoRefresh ?? false,
                      lastRefreshed: new Date().toISOString(),
                    },
                  }
                : t
            ),
          }
        : null,
      isDirty: true,
    })),

  getUrlBasedTables: () => {
    const { project } = get();
    if (!project) return [];
    return project.tables.filter((t) => t.source?.type === "url");
  },

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
    set((state) => {
      if (!state.project) return {};
      const sheets = state.project.sheets && state.project.sheets.length > 0
        ? state.project.sheets
        : [{ id: "default", name: "Page 1", widgets: state.project.widgets || [] }];
      const activeId = state.project.activeSheetId || "default";

      const updatedSheets = sheets.map(s => {
        if (s.id === activeId) {
          return { ...s, widgets: [...s.widgets, widget] };
        }
        return s;
      });

      const activeWidgets = updatedSheets.find(s => s.id === activeId)?.widgets || [];

      return {
        project: {
          ...state.project,
          sheets: updatedSheets,
          widgets: activeWidgets
        },
        isDirty: true,
        selectedWidgetId: widget.id,
      };
    }),

  updateWidget: (widgetId, updates) =>
    set((state) => {
      if (!state.project) return {};
      const sheets = state.project.sheets && state.project.sheets.length > 0
        ? state.project.sheets
        : [{ id: "default", name: "Page 1", widgets: state.project.widgets || [] }];
      const activeId = state.project.activeSheetId || "default";

      const updatedSheets = sheets.map(s => {
        if (s.id === activeId) {
          return {
            ...s,
            widgets: s.widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w))
          };
        }
        return s;
      });

      const activeWidgets = updatedSheets.find(s => s.id === activeId)?.widgets || [];

      return {
        project: {
          ...state.project,
          sheets: updatedSheets,
          widgets: activeWidgets
        },
        isDirty: true,
      };
    }),

  updateWidgetStyle: (widgetId, styleUpdates) =>
    set((state) => {
      if (!state.project) return {};
      const sheets = state.project.sheets && state.project.sheets.length > 0
        ? state.project.sheets
        : [{ id: "default", name: "Page 1", widgets: state.project.widgets || [] }];
      const activeId = state.project.activeSheetId || "default";

      const updatedSheets = sheets.map(s => {
        if (s.id === activeId) {
          return {
            ...s,
            widgets: s.widgets.map((w) => (w.id === widgetId ? { ...w, style: { ...w.style, ...styleUpdates } } : w))
          };
        }
        return s;
      });

      const activeWidgets = updatedSheets.find(s => s.id === activeId)?.widgets || [];

      return {
        project: {
          ...state.project,
          sheets: updatedSheets,
          widgets: activeWidgets
        },
        isDirty: true,
      };
    }),

  removeWidget: (widgetId) =>
    set((state) => {
      if (!state.project) return {};
      const sheets = state.project.sheets && state.project.sheets.length > 0
        ? state.project.sheets
        : [{ id: "default", name: "Page 1", widgets: state.project.widgets || [] }];
      const activeId = state.project.activeSheetId || "default";

      const updatedSheets = sheets.map(s => {
        if (s.id === activeId) {
          return {
            ...s,
            widgets: s.widgets.filter((w) => w.id !== widgetId)
          };
        }
        return s;
      });

      const activeWidgets = updatedSheets.find(s => s.id === activeId)?.widgets || [];

      return {
        project: {
          ...state.project,
          sheets: updatedSheets,
          widgets: activeWidgets
        },
        selectedWidgetId: state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
        isDirty: true,
      };
    }),

  setSelectedWidget: (widgetId) => set({ selectedWidgetId: widgetId }),

  updateLayouts: (layouts) =>
    set((state) => {
      if (!state.project) return {};
      const sheets = state.project.sheets && state.project.sheets.length > 0
        ? state.project.sheets
        : [{ id: "default", name: "Page 1", widgets: state.project.widgets || [] }];
      const activeId = state.project.activeSheetId || "default";

      const updatedSheets = sheets.map(s => {
        if (s.id === activeId) {
          return {
            ...s,
            widgets: s.widgets.map((w) => {
              const layout = layouts.find((l) => l.id === w.id);
              return layout
                ? {
                    ...w,
                    layout: { ...w.layout, x: layout.x, y: layout.y, w: layout.w, h: layout.h }
                  }
                : w;
            })
          };
        }
        return s;
      });

      const activeWidgets = updatedSheets.find(s => s.id === activeId)?.widgets || [];

      return {
        project: {
          ...state.project,
          sheets: updatedSheets,
          widgets: activeWidgets
        },
        isDirty: true,
      };
    }),

  /* --- Sheet / Page Actions --- */
  addSheet: (name) =>
    set((state) => {
      if (!state.project) return {};
      const sheets = state.project.sheets && state.project.sheets.length > 0
        ? state.project.sheets
        : [{ id: "default", name: "Page 1", widgets: state.project.widgets || [] }];
      
      const newSheetId = generateId();
      const newSheet: Sheet = {
        id: newSheetId,
        name: name || `Page ${sheets.length + 1}`,
        widgets: []
      };

      const updatedSheets = [...sheets, newSheet];

      return {
        project: {
          ...state.project,
          sheets: updatedSheets,
          activeSheetId: newSheetId,
          widgets: []
        },
        selectedWidgetId: null,
        isDirty: true,
      };
    }),

  renameSheet: (sheetId, newName) =>
    set((state) => {
      if (!state.project) return {};
      const sheets = state.project.sheets && state.project.sheets.length > 0
        ? state.project.sheets
        : [{ id: "default", name: "Page 1", widgets: state.project.widgets || [] }];
      
      const updatedSheets = sheets.map(s => s.id === sheetId ? { ...s, name: newName } : s);

      return {
        project: {
          ...state.project,
          sheets: updatedSheets
        },
        isDirty: true,
      };
    }),

  removeSheet: (sheetId) =>
    set((state) => {
      if (!state.project) return {};
      const sheets = state.project.sheets && state.project.sheets.length > 0
        ? state.project.sheets
        : [{ id: "default", name: "Page 1", widgets: state.project.widgets || [] }];
      
      // Prevent deleting the last sheet
      if (sheets.length <= 1) return {};

      const updatedSheets = sheets.filter(s => s.id !== sheetId);
      
      let nextActiveId = state.project.activeSheetId || "default";
      if (nextActiveId === sheetId) {
        nextActiveId = updatedSheets[0].id;
      }

      const activeWidgets = updatedSheets.find(s => s.id === nextActiveId)?.widgets || [];

      return {
        project: {
          ...state.project,
          sheets: updatedSheets,
          activeSheetId: nextActiveId,
          widgets: activeWidgets
        },
        selectedWidgetId: null,
        isDirty: true,
      };
    }),

  setActiveSheet: (sheetId) =>
    set((state) => {
      if (!state.project) return {};
      const sheets = state.project.sheets && state.project.sheets.length > 0
        ? state.project.sheets
        : [{ id: "default", name: "Page 1", widgets: state.project.widgets || [] }];

      const targetSheet = sheets.find(s => s.id === sheetId) || sheets[0];
      
      return {
        project: {
          ...state.project,
          activeSheetId: targetSheet.id,
          widgets: targetSheet.widgets
        },
        selectedWidgetId: null,
      };
    }),

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
      
      set({
        project: sanitizeProjectTables(saved),
        isDirty: false,
        isSaving: false
      });
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

      const loaded = await res.json();

      set({
        project: sanitizeProjectTables(loaded),
        activeFilters: [],
        selectedWidgetId: null,
        isDirty: false,
        isLoading: false
      });
    } catch (error) {
      console.error("Load error:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  setDirty: (dirty) => set({ isDirty: dirty }),
}));
