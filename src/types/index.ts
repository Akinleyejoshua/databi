/* ============================================================
   DATA BI — TypeScript Type Definitions
   ============================================================ */

/* ---------- Data Types ---------- */

export type DataType = "string" | "number" | "boolean" | "date";

export interface ColumnSchema {
  name: string;
  type: DataType;
  originalType: string;
}

export interface DataTable {
  id: string;
  name: string;
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface Relationship {
  id: string;
  sourceTableId: string;
  sourceColumn: string;
  targetTableId: string;
  targetColumn: string;
  cardinality: "one-to-one" | "one-to-many" | "many-to-many";
}

export interface Measure {
  id: string;
  name: string;
  tableId: string;
  formula: string;
  originalFormula?: string;
  resultType: DataType;
}

/* ---------- Canvas & Widgets ---------- */

export type WidgetType =
  | "chart"
  | "text"
  | "kpi"
  | "slicer"
  | "ai-summary";

export type ChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "column"
  | "time-series"
  | "map";

export interface WidgetField {
  tableId: string;
  columnName: string;
  aggregation?: "sum" | "average" | "count" | "min" | "max" | "none" | "measure";
}

export interface WidgetStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: string;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
  padding: number;
  opacity: number;
}

export interface ChartConfig {
  chartType: ChartType;
  fields: WidgetField[];
  values: WidgetField[];
  showLegend: boolean;
  showTooltip: boolean;
  title: string;
  colorScheme: string[];
}

export interface SlicerConfig {
  tableId: string;
  columnName: string;
  selectedValues: unknown[];
  multiSelect: boolean;
}

export interface KpiConfig {
  tableId: string;
  valueColumn: string;
  aggregation: "sum" | "average" | "count" | "min" | "max";
  label: string;
  prefix: string;
  suffix: string;
  comparisonColumn?: string;
  comparisonAggregation?: "sum" | "average" | "count" | "min" | "max";
}

export interface TextConfig {
  content: string;
  align: "left" | "center" | "right";
}

export interface AiSummaryConfig {
  prompt: string;
  generatedText: string;
  isLoading: boolean;
  tableIds: string[];
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  };
  style: WidgetStyle;
  chartConfig?: ChartConfig;
  slicerConfig?: SlicerConfig;
  kpiConfig?: KpiConfig;
  textConfig?: TextConfig;
  aiSummaryConfig?: AiSummaryConfig;
}

export interface CanvasSettings {
  backgroundColor: string;
  width: number;
  cols: number;
  rowHeight: number;
}

/* ---------- Project ---------- */

export interface Project {
  _id?: string;
  userId?: string;
  name: string;
  description: string;
  tables: DataTable[];
  relationships: Relationship[];
  measures: Measure[];
  widgets: Widget[];
  canvasSettings: CanvasSettings;
  filters: Record<string, unknown>;
  shareToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ---------- UI State ---------- */

export type EditorTab = "data" | "canvas" | "preview";
export type DataPanel = "tables" | "transform" | "relationships" | "measures";
export type SidebarPanel = "widgets" | "fields" | "settings" | "none";

export interface ActiveFilter {
  tableId: string;
  columnName: string;
  values: unknown[];
}

/* ---------- Transform ---------- */

export type TransformAction =
  | "remove-nulls"
  | "remove-duplicates"
  | "aggregate"
  | "cast-type";

export interface TransformRequest {
  tableId: string;
  action: TransformAction;
  column?: string;
  targetType?: DataType;
  aggregation?: "sum" | "average" | "count";
  groupByColumns?: string[];
}
