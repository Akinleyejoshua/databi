/* ============================================================
   Chart Widget
   ============================================================ */
"use client";

import { useProjectStore } from "@/store/use-project-store";
import EChartsRenderer from "@/components/charts/echarts-renderer";
import type { Widget } from "@/types";

interface Props {
  widget: Widget;
}

export default function ChartWidget({ widget }: Props) {
  const { project, activeFilters } = useProjectStore();

  if (!project || !widget.chartConfig) return null;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <EChartsRenderer
        config={widget.chartConfig}
        tables={project.tables}
        filters={activeFilters}
        measures={project.measures}
      />
    </div>
  );
}
