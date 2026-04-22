/* ============================================================
   Canvas Area — Drag & Drop grid using react-grid-layout
   ============================================================ */
"use client";

import { useMemo, useCallback } from "react";
import { ResponsiveGridLayout as RGL } from "react-grid-layout";
const ResponsiveGridLayout: any = RGL;
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import ChartWidget from "@/components/widgets/chart-widget";
import TextWidget from "@/components/widgets/text-widget";
import KpiWidget from "@/components/widgets/kpi-widget";
import SlicerWidget from "@/components/widgets/slicer-widget";
import AiSummaryWidget from "@/components/widgets/ai-summary-widget";
import styles from "./canvas-area.module.css";

export default function CanvasArea() {
  const { project, selectedWidgetId, setSelectedWidget, updateLayouts } = useProjectStore();
  const { isPreviewMode } = useUiStore();

  const layouts = useMemo(() => {
    if (!project) return { lg: [] };
    return {
      lg: project.widgets.map((w) => ({
        i: w.id,
        x: w.layout.x,
        y: w.layout.y,
        w: w.layout.w,
        h: w.layout.h,
        minW: w.layout.minW || 2,
        minH: w.layout.minH || 2,
        static: isPreviewMode,
      })),
    };
  }, [project, isPreviewMode]);

  const handleLayoutChange = useCallback(
    (layout: readonly { i: string; x: number; y: number; w: number; h: number }[]) => {
      const mapped = layout.map((l) => ({ id: l.i, x: l.x, y: l.y, w: l.w, h: l.h }));
      updateLayouts(mapped);
    },
    [updateLayouts]
  );

  if (!project) return null;

  const renderWidget = (widget: typeof project.widgets[0]) => {
    switch (widget.type) {
      case "chart": return <ChartWidget widget={widget} />;
      case "text": return <TextWidget widget={widget} />;
      case "kpi": return <KpiWidget widget={widget} />;
      case "slicer": return <SlicerWidget widget={widget} />;
      case "ai-summary": return <AiSummaryWidget widget={widget} />;
      default: return null;
    }
  };

  return (
    <div
      className={styles.canvas}
      style={{ backgroundColor: project.canvasSettings.backgroundColor }}
      onClick={() => setSelectedWidget(null)}
    >
      {project.widgets.length === 0 ? (
        <div className={styles["canvas-empty"]}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <h3>Empty Canvas</h3>
          <p>Add widgets from the sidebar to start building your dashboard</p>
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: project.canvasSettings.cols, md: 18, sm: 12, xs: 8, xxs: 4 }}
          rowHeight={project.canvasSettings.rowHeight}
          onLayoutChange={handleLayoutChange}
          isDraggable={!isPreviewMode}
          isResizable={!isPreviewMode}
          compactType="vertical"
          preventCollision={false}
          margin={[8, 8] as [number, number]}
          containerPadding={[16, 16] as [number, number]}
          useCSSTransforms
        >
          {project.widgets.map((widget) => (
            <div
              key={widget.id}
              className={`${styles["widget-wrapper"]} ${
                selectedWidgetId === widget.id ? styles["widget-wrapper--selected"] : ""
              } ${isPreviewMode ? styles["widget-wrapper--preview"] : ""}`}
              onClick={(e) => { e.stopPropagation(); setSelectedWidget(widget.id); }}
              style={{
                backgroundColor: widget.style.backgroundColor,
                color: widget.style.textColor,
                borderRadius: `${widget.style.borderRadius}px`,
                border: `${widget.style.borderWidth}px solid ${widget.style.borderColor}`,
                padding: `${widget.style.padding}px`,
                opacity: widget.style.opacity,
                overflow: "hidden",
              }}
            >
              {!isPreviewMode && (
                <div className={styles["widget-label"]}>
                  {widget.type === "chart" ? "📊" : widget.type === "kpi" ? "🎯" : widget.type === "slicer" ? "🔽" : widget.type === "ai-summary" ? "🤖" : "📝"}
                </div>
              )}
              <div className={styles["widget-content"]}>
                {renderWidget(widget)}
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
