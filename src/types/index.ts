// Data types
export interface DataTable {
  id: string;
  name: string;
  data: Record<string, any>[];
  columns: string[];
  createdAt: string;
}

export interface TableRelationship {
  id: string;
  fromTable: string;
  toTable: string;
  fromColumn: string;
  toColumn: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface DataTransformation {
  id: string;
  tableId: string;
  type: 'remove-nulls' | 'remove-duplicates' | 'aggregate' | 'type-cast';
  config: Record<string, any>;
}

// Canvas types
export interface CanvasWidget {
  id: string;
  type: 'text-bar' | 'slicer' | 'kpi-card' | 'chart' | 'ai-summary';
  x: number;
  y: number;
  width: number;
  height: number;
  config: {
    title?: string;
    content?: string;
    style?: WidgetStyle;
    chartType?: ChartType;
    dataSource?: string;
    fields?: string[];
    values?: string[];
    filters?: Filter[];
  };
}

export interface WidgetStyle {
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'column' | 'time-series' | 'map';

export interface Filter {
  id: string;
  column: string;
  operator: 'equals' | 'contains' | 'greater-than' | 'less-than';
  value: any;
}

// Project types
export interface Project {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  tables: DataTable[];
  relationships: TableRelationship[];
  canvas: {
    widgets: CanvasWidget[];
    backgroundColor?: string;
    width?: number;
    height?: number;
  };
  shareLink?: string;
  theme: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
  owner?: string;
}

export interface MeasureFormula {
  id: string;
  name: string;
  formula: string; // JavaScript expression
  tableId: string;
}

// AI types
export interface AISummary {
  id: string;
  widgetId: string;
  projectId: string;
  summary: string;
  insights: string[];
  trends: string[];
  outliers: string[];
  generatedAt: string;
}

// Slicer/Filter types
export interface SlicerWidget extends CanvasWidget {
  type: 'slicer';
  config: {
    title: string;
    column: string;
    tableId: string;
    style?: WidgetStyle;
    selectedValues: any[];
  };
}
