"use client";

import { useMemo } from "react";
import AdvancedChartsRenderer from "@/components/charts/advanced-charts-renderer";
import type { ChartConfig, DataTable, Relationship } from "@/types";

// Sample data tables
const sampleTables: DataTable[] = [
  {
    id: "sales",
    name: "Sales Data",
    columns: [
      { name: "Product", type: "string", originalType: "string" },
      { name: "Month", type: "string", originalType: "string" },
      { name: "Revenue", type: "number", originalType: "number" },
      { name: "Units", type: "number", originalType: "number" },
      { name: "Region", type: "string", originalType: "string" },
    ],
    rows: [
      { Product: "Laptop", Month: "Jan", Revenue: 45000, Units: 30, Region: "North" },
      { Product: "Laptop", Month: "Feb", Revenue: 52000, Units: 35, Region: "North" },
      { Product: "Laptop", Month: "Mar", Revenue: 48000, Units: 32, Region: "North" },
      { Product: "Tablet", Month: "Jan", Revenue: 28000, Units: 50, Region: "South" },
      { Product: "Tablet", Month: "Feb", Revenue: 32000, Units: 58, Region: "South" },
      { Product: "Tablet", Month: "Mar", Revenue: 30000, Units: 55, Region: "South" },
      { Product: "Phone", Month: "Jan", Revenue: 85000, Units: 120, Region: "East" },
      { Product: "Phone", Month: "Feb", Revenue: 92000, Units: 135, Region: "East" },
      { Product: "Phone", Month: "Mar", Revenue: 88000, Units: 130, Region: "East" },
      { Product: "Monitor", Month: "Jan", Revenue: 18000, Units: 20, Region: "West" },
      { Product: "Monitor", Month: "Feb", Revenue: 21000, Units: 25, Region: "West" },
      { Product: "Monitor", Month: "Mar", Revenue: 19000, Units: 22, Region: "West" },
    ],
    rowCount: 12,
  },
  {
    id: "performance",
    name: "Performance Metrics",
    columns: [
      { name: "Category", type: "string", originalType: "string" },
      { name: "Q1", type: "number", originalType: "number" },
      { name: "Q2", type: "number", originalType: "number" },
      { name: "Q3", type: "number", originalType: "number" },
      { name: "Q4", type: "number", originalType: "number" },
      { name: "Conversion", type: "number", originalType: "number" },
    ],
    rows: [
      { Category: "Awareness", Q1: 85, Q2: 88, Q3: 90, Q4: 92, Conversion: 45 },
      { Category: "Consideration", Q1: 72, Q2: 75, Q3: 78, Q4: 81, Conversion: 35 },
      { Category: "Purchase", Q1: 62, Q2: 66, Q3: 70, Q4: 74, Conversion: 25 },
      { Category: "Loyalty", Q1: 58, Q2: 61, Q3: 64, Q4: 67, Conversion: 15 },
    ],
    rowCount: 4,
  },
  {
    id: "inventory",
    name: "Inventory Status",
    columns: [
      { name: "Item", type: "string", originalType: "string" },
      { name: "Stock", type: "number", originalType: "number" },
      { name: "Status", type: "number", originalType: "number" },
    ],
    rows: [
      { Item: "Laptop", Stock: 150, Status: 85 },
      { Item: "Tablet", Stock: 280, Status: 72 },
      { Item: "Phone", Stock: 420, Status: 95 },
      { Item: "Monitor", Stock: 95, Status: 45 },
      { Item: "Keyboard", Stock: 380, Status: 88 },
      { Item: "Mouse", Stock: 520, Status: 92 },
    ],
    rowCount: 6,
  },
];

const chartConfigs: { title: string; config: ChartConfig }[] = [
  // Foundational Charts
  {
    title: "Bar Chart",
    config: {
      chartType: "bar",
      title: "Revenue by Product",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Revenue ($)",
      colorScheme: ["#3b82f6"],
    },
  },
  {
    title: "Column Chart",
    config: {
      chartType: "column",
      title: "Monthly Revenue Trend",
      fields: [{ tableId: "sales", columnName: "Month" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Month",
      yAxisLabel: "Revenue ($)",
      colorScheme: ["#10b981"],
    },
  },
  {
    title: "Line Chart",
    config: {
      chartType: "line",
      title: "Revenue Trend Over Time",
      fields: [{ tableId: "sales", columnName: "Month" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Month",
      yAxisLabel: "Revenue ($)",
      colorScheme: ["#f59e0b"],
    },
  },
  {
    title: "Pie Chart",
    config: {
      chartType: "pie",
      title: "Revenue Distribution by Product",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Revenue",
      colorScheme: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
    },
  },
  {
    title: "Donut Chart",
    config: {
      chartType: "donut",
      title: "Units Distribution",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [{ tableId: "sales", columnName: "Units" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Units",
      colorScheme: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
    },
  },
  {
    title: "Histogram",
    config: {
      chartType: "histogram",
      title: "Revenue Distribution",
      fields: [],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Revenue Range",
      yAxisLabel: "Frequency",
      colorScheme: ["#3b82f6"],
    },
  },

  // Comparative & Value Charts
  {
    title: "Stacked Bar Chart",
    config: {
      chartType: "stacked-bar",
      title: "Revenue by Product and Region",
      fields: [{ tableId: "sales", columnName: "Region" }],
      values: [
        { tableId: "sales", columnName: "Revenue", aggregation: "sum" },
      ],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Region",
      yAxisLabel: "Revenue ($)",
      colorScheme: ["#3b82f6", "#10b981", "#f59e0b"],
    },
  },
  {
    title: "Stacked Column Chart",
    config: {
      chartType: "stacked-column",
      title: "Units by Product and Region",
      fields: [{ tableId: "sales", columnName: "Month" }],
      values: [
        { tableId: "sales", columnName: "Units", aggregation: "sum" },
      ],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Month",
      yAxisLabel: "Units",
      colorScheme: ["#3b82f6", "#10b981", "#f59e0b"],
    },
  },
  {
    title: "Treemap",
    config: {
      chartType: "treemap",
      title: "Product Revenue Hierarchy",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Revenue",
      colorScheme: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
    },
  },
  {
    title: "Pareto Chart",
    config: {
      chartType: "pareto",
      title: "Pareto Analysis - Revenue",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Revenue",
      colorScheme: ["#3b82f6"],
    },
  },
  {
    title: "Radar Chart",
    config: {
      chartType: "radar",
      title: "Performance Metrics by Quarter",
      fields: [{ tableId: "performance", columnName: "Category" }],
      values: [{ tableId: "performance", columnName: "Q1" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Category",
      yAxisLabel: "Score",
      colorScheme: ["#3b82f6"],
    },
  },
  {
    title: "Funnel Chart",
    config: {
      chartType: "funnel",
      title: "Sales Funnel",
      fields: [{ tableId: "performance", columnName: "Category" }],
      values: [{ tableId: "performance", columnName: "Conversion" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Stage",
      yAxisLabel: "Count",
      colorScheme: ["#3b82f6"],
    },
  },
  {
    title: "Waterfall Chart",
    config: {
      chartType: "waterfall",
      title: "Revenue Waterfall",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Revenue",
      colorScheme: ["#3b82f6"],
    },
  },

  // Relationship & Correlation Charts
  {
    title: "Scatter Plot",
    config: {
      chartType: "scatter",
      title: "Revenue vs Units Sold",
      fields: [{ tableId: "sales", columnName: "Revenue" }],
      values: [{ tableId: "sales", columnName: "Units" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Revenue",
      yAxisLabel: "Units",
      colorScheme: ["#3b82f6"],
    },
  },
  {
    title: "Bubble Chart",
    config: {
      chartType: "bubble",
      title: "Product Performance Bubble",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [
        { tableId: "sales", columnName: "Revenue" },
        { tableId: "sales", columnName: "Units" },
      ],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Revenue",
      colorScheme: ["#3b82f6"],
    },
  },
  {
    title: "Area Chart",
    config: {
      chartType: "area",
      title: "Revenue Area Chart",
      fields: [{ tableId: "sales", columnName: "Month" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Month",
      yAxisLabel: "Revenue",
      colorScheme: ["#3b82f6"],
    },
  },
  {
    title: "Step Chart",
    config: {
      chartType: "step",
      title: "Step Chart - Revenue",
      fields: [{ tableId: "sales", columnName: "Month" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: true,
      showTooltip: true,
      xAxisLabel: "Month",
      yAxisLabel: "Revenue",
      colorScheme: ["#3b82f6"],
    },
  },
  {
    title: "Sankey Diagram",
    config: {
      chartType: "sankey",
      title: "Product to Region Flow",
      fields: [
        { tableId: "sales", columnName: "Product" },
        { tableId: "sales", columnName: "Region" },
      ],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Region",
      colorScheme: [],
    },
  },

  // Time-Series & Trend Charts
  {
    title: "Candlestick Chart",
    config: {
      chartType: "candlestick",
      title: "Stock Price Movement",
      fields: [{ tableId: "sales", columnName: "Month" }],
      values: [
        { tableId: "sales", columnName: "Revenue" },
        { tableId: "sales", columnName: "Units" },
        { tableId: "sales", columnName: "Revenue" },
        { tableId: "sales", columnName: "Units" },
      ],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Date",
      yAxisLabel: "Price",
      colorScheme: [],
    },
  },
  {
    title: "Sparkline",
    config: {
      chartType: "sparkline",
      title: "Quick Trend View",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Revenue",
      colorScheme: [],
    },
  },
  {
    title: "Gantt Chart",
    config: {
      chartType: "gantt",
      title: "Project Timeline",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [
        { tableId: "sales", columnName: "Revenue" },
        { tableId: "sales", columnName: "Units" },
      ],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Timeline",
      yAxisLabel: "Task",
      colorScheme: [],
    },
  },
  {
    title: "Dot Plot",
    config: {
      chartType: "dot-plot",
      title: "Revenue Dots",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Revenue",
      colorScheme: ["#3b82f6"],
    },
  },

  // Other Dashboard Visuals
  {
    title: "Box Plot",
    config: {
      chartType: "box-plot",
      title: "Revenue Distribution by Region",
      fields: [{ tableId: "sales", columnName: "Region" }],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Region",
      yAxisLabel: "Revenue",
      colorScheme: [],
    },
  },
  {
    title: "Pictograph",
    config: {
      chartType: "pictograph",
      title: "Units Pictograph",
      fields: [{ tableId: "sales", columnName: "Product" }],
      values: [{ tableId: "sales", columnName: "Units" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Units",
      colorScheme: [],
    },
  },
  {
    title: "Gauge Chart",
    config: {
      chartType: "gauge",
      title: "Performance Gauge",
      fields: [],
      values: [{ tableId: "inventory", columnName: "Stock" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "",
      yAxisLabel: "Stock Level",
      colorScheme: [],
    },
  },
  {
    title: "RAG Status",
    config: {
      chartType: "rag-status",
      title: "Inventory Status",
      fields: [{ tableId: "inventory", columnName: "Item" }],
      values: [{ tableId: "inventory", columnName: "Status" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Item",
      yAxisLabel: "Status",
      colorScheme: [],
    },
  },
  {
    title: "Heatmap",
    config: {
      chartType: "heatmap",
      title: "Product-Region Heatmap",
      fields: [
        { tableId: "sales", columnName: "Product" },
        { tableId: "sales", columnName: "Region" },
      ],
      values: [{ tableId: "sales", columnName: "Revenue" }],
      showLegend: false,
      showTooltip: true,
      xAxisLabel: "Product",
      yAxisLabel: "Region",
      colorScheme: [],
    },
  },
];

export default function ChartsDemo() {
  return (
    <div style={{ padding: "32px", backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "var(--color-text)", marginBottom: "8px" }}>
          📊 Complete Chart Gallery
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
          Comprehensive showcase of all available dashboard chart types with sample data
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))", gap: "24px" }}>
        {chartConfigs.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.07)";
            }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--color-text)", margin: 0 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
                Type: {item.config.chartType}
              </p>
            </div>
            <div style={{ height: "320px", padding: "8px" }}>
              <AdvancedChartsRenderer
                config={item.config}
                tables={sampleTables}
                filters={[]}
                height={304}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
