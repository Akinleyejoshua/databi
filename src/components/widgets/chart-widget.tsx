/* ============================================================
   Chart Widget
   ============================================================ */
"use client";

import { useProjectStore } from "@/store/use-project-store";
import AdvancedChartsRenderer from "@/components/charts/advanced-charts-renderer";
import type { Widget } from "@/types";

interface Props {
  widget: Widget;
}

export default function ChartWidget({ widget }: Props) {
  const { project, activeFilters } = useProjectStore();

  if (!project || !widget.chartConfig) return null;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <AdvancedChartsRenderer
        config={widget.chartConfig}
        tables={project.tables}
        filters={activeFilters}
        measures={project.measures}
        relationships={project.relationships}
      />
    </div>
  );
}
