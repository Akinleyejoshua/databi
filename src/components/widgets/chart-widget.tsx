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

  const { backgroundColor, textColor, fontSize, fontWeight, borderRadius, padding, opacity } = widget.style;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor,
        color: textColor,
        fontSize: `${fontSize}px`,
        fontWeight,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        opacity,
        overflow: "hidden",
      }}
    >
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
