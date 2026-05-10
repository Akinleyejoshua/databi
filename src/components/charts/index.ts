/**
 * ============================================================
 * COMPLETE CHART LIBRARY INDEX
 * ============================================================
 * 
 * Import individual chart types or use AdvancedChartsRenderer
 * for automatic routing based on chart configuration.
 */

// Main Router
export { default as AdvancedChartsRenderer } from "./advanced-charts-renderer";
export { default as EChartsRenderer } from "./echarts-renderer";

// Foundational Charts (in echarts-renderer)
// - bar, column, line, histogram, pie, donut, kpi

// Comparative & Value Charts
export { default as StackedChart } from "./stacked-chart";
export { default as TreemapChart } from "./treemap-chart";
export { default as ParetoChart } from "./pareto-chart";
export { default as RadarChart } from "./radar-chart";
export { default as FunnelChart } from "./funnel-chart";
export { default as WaterfallChart } from "./waterfall-chart";

// Relationship & Correlation Charts
export { default as BubbleChart } from "./bubble-chart";
export { default as SankeyChart } from "./sankey-chart";
export { default as StepChart } from "./step-chart";

// Time-Series & Trend Charts
export { default as CandlestickChart } from "./candlestick-chart";
export { default as SparklineChart } from "./sparkline-chart";
export { default as GanttChart } from "./gantt-chart";
export { default as DotPlotChart } from "./dot-plot-chart";

// Geographic & Heat-Based Charts
export { default as GeoScatterChart } from "./geo-scatter-chart";
export { default as GeoBubbleChart } from "./geo-bubble-chart";
export { default as HeatmapChart } from "./heatmap-chart";

// Other Dashboard Visuals
export { default as BoxPlotChart } from "./box-plot-chart";
export { default as PictographChart } from "./pictograph-chart";
export { default as GaugeChart } from "./gauge-chart";
export { default as RAGStatusChart } from "./rag-status-chart";

/**
 * ============================================================
 * USAGE
 * ============================================================
 * 
 * RECOMMENDED: Use AdvancedChartsRenderer for automatic routing
 * 
 * import AdvancedChartsRenderer from "@/components/charts";
 * 
 * <AdvancedChartsRenderer
 *   config={chartConfig}
 *   tables={dataTables}
 *   filters={activeFilters}
 *   height={300}
 * />
 * 
 * OR: Import individual chart for direct use
 * 
 * import { BaretChart, FunnelChart } from "@/components/charts";
 * 
 * Supported Chart Types:
 * ✓ bar, column, line, histogram, pie, donut, kpi
 * ✓ stacked-bar, stacked-column, treemap, pareto, radar, funnel, waterfall
 * ✓ scatter, bubble, sankey, area, step
 * ✓ candlestick, sparkline, gantt, dot-plot
 * ✓ geo-scatter, geo-bubble, heatmap
 * ✓ box-plot, pictograph, gauge, rag-status
 * 
 * ============================================================
 */
