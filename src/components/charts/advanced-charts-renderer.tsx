"use client";

import { useMemo } from "react";
import type { ChartConfig, DataTable, ActiveFilter, Measure, Relationship } from "@/types";

// Import all specialized chart components
import StackedChart from "./stacked-chart";
import SankeyChart from "./sankey-chart";
import GanttChart from "./gantt-chart";
import BoxPlotChart from "./box-plot-chart";
import WaterfallChart from "./waterfall-chart";
import GaugeChart from "./gauge-chart";
import RAGStatusChart from "./rag-status-chart";
import BubbleChart from "./bubble-chart";
import HeatmapChart from "./heatmap-chart";
import SparklineChart from "./sparkline-chart";
import TreemapChart from "./treemap-chart";
import ParetoChart from "./pareto-chart";
import RadarChart from "./radar-chart";
import FunnelChart from "./funnel-chart";
import CandlestickChart from "./candlestick-chart";
import DotPlotChart from "./dot-plot-chart";
import HistogramChart from "./histogram-chart";
import StepChart from "./step-chart";
import PictographChart from "./pictograph-chart";
import GeoScatterChart from "./geo-scatter-chart";
import GeoBubbleChart from "./geo-bubble-chart";
import EChartsRenderer from "./echarts-renderer";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  relationships?: Relationship[];
  measures?: Measure[];
  width?: number;
  height?: number;
}

export default function AdvancedChartsRenderer({
  config,
  tables,
  filters,
  relationships = [],
  measures = [],
  height = 300
}: Props) {
  const chartType = config.chartType;

  // Route to specialized components for advanced chart types
  switch (chartType) {
    case "stacked-bar":
    case "stacked-column":
      return (
        <StackedChart
          config={config}
          tables={tables}
          filters={filters}
          relationships={relationships}
          measures={measures}
          height={height}
        />
      );

    case "sankey":
      return <SankeyChart config={config} tables={tables} filters={filters} height={height} />;

    case "gantt":
      return <GanttChart config={config} tables={tables} filters={filters} height={height} />;

    case "box-plot":
      return <BoxPlotChart config={config} tables={tables} filters={filters} height={height} />;

    case "waterfall":
      return <WaterfallChart config={config} tables={tables} filters={filters} height={height} />;

    case "gauge":
      return <GaugeChart config={config} tables={tables} filters={filters} height={height} />;

    case "rag-status":
      return <RAGStatusChart config={config} tables={tables} filters={filters} height={height} />;

    case "bubble":
      return <BubbleChart config={config} tables={tables} filters={filters} height={height} />;

    case "heatmap":
      return <HeatmapChart config={config} tables={tables} filters={filters} height={height} />;

    case "sparkline":
      return <SparklineChart config={config} tables={tables} filters={filters} height={height} />;

    case "treemap":
      return <TreemapChart config={config} tables={tables} filters={filters} height={height} />;

    case "pareto":
      return <ParetoChart config={config} tables={tables} filters={filters} height={height} />;

    case "radar":
      return <RadarChart config={config} tables={tables} filters={filters} height={height} />;

    case "funnel":
      return <FunnelChart config={config} tables={tables} filters={filters} height={height} />;

    case "candlestick":
      return <CandlestickChart config={config} tables={tables} filters={filters} height={height} />;

    case "dot-plot":
      return <DotPlotChart config={config} tables={tables} filters={filters} height={height} />;

    case "histogram":
      return <HistogramChart config={config} tables={tables} filters={filters} height={height} />;

    case "step":
      return <StepChart config={config} tables={tables} filters={filters} height={height} />;

    case "pictograph":
      return <PictographChart config={config} tables={tables} filters={filters} height={height} />;

    case "geo-scatter":
      return <GeoScatterChart config={config} tables={tables} filters={filters} height={height} />;

    case "geo-bubble":
      return <GeoBubbleChart config={config} tables={tables} filters={filters} height={height} />;

    // Route basic charts to EChartsRenderer
    case "bar":
    case "column":
    case "line":
    case "pie":
    case "donut":
    case "kpi":
    case "scatter":
    case "area":
    case "time-series":
    case "map":
    default:
      return (
        <EChartsRenderer
          config={config}
          tables={tables}
          filters={filters}
          relationships={relationships}
          measures={measures}
          height={height}
        />
      );
  }
}
