/* ============================================================
   Canvas Area — Drag & Drop using react-rnd (Alternative to RGL)
   ============================================================ */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Rnd } from "react-rnd";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import ChartWidget from "@/components/widgets/chart-widget";
import TextWidget from "@/components/widgets/text-widget";
import KpiWidget from "@/components/widgets/kpi-widget";
import SlicerWidget from "@/components/widgets/slicer-widget";
import AiSummaryWidget from "@/components/widgets/ai-summary-widget";
import { Settings, GripHorizontal, BarChart3, Target, Filter, Bot, Type } from "lucide-react";
import styles from "./canvas-area.module.css";

export default function CanvasArea() {
  const { project, selectedWidgetId, setSelectedWidget, updateLayouts } = useProjectStore();
  const { isPreviewMode, setSettingsModalOpen } = useUiStore();
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    setHasMounted(true);
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!project || !hasMounted) return null;

  const cols = project.canvasSettings.cols || 24;
  const rowHeight = project.canvasSettings.rowHeight || 30;
  const colWidth = containerWidth / cols;

  // Calculate "infinite" canvas height based on widget positions
  const canvasHeight = useMemo(() => {
    if (!project.widgets.length) return "calc(100vh - 100px)";
    const maxBottom = Math.max(...project.widgets.map(w => w.layout.y + w.layout.h));
    return Math.max(window.innerHeight - 100, (maxBottom + 10) * rowHeight);
  }, [project.widgets, rowHeight]);

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

  const handleDragStop = (id: string, d: { x: number; y: number }) => {
    const x = Math.round(d.x / colWidth);
    const y = Math.round(d.y / rowHeight);
    
    const widget = project.widgets.find(w => w.id === id);
    if (!widget) return;

    updateLayouts([{
      id,
      x,
      y,
      w: widget.layout.w,
      h: widget.layout.h
    }]);
  };

  const handleResizeStop = (id: string, ref: HTMLElement, position: { x: number; y: number }) => {
    const w = Math.round(ref.offsetWidth / colWidth);
    const h = Math.round(ref.offsetHeight / rowHeight);
    const x = Math.round(position.x / colWidth);
    const y = Math.round(position.y / rowHeight);

    updateLayouts([{
      id,
      x,
      y,
      w,
      h
    }]);
  };

  return (
    <div
      ref={containerRef}
      className={styles.canvas}
      style={{ 
        backgroundColor: project.canvasSettings.backgroundColor,
        minHeight: canvasHeight,
        position: "relative",
        /* @ts-ignore */
        "--col-width": `${colWidth}px`,
        "--row-height": `${rowHeight}px`
      }}
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
        project.widgets.map((widget) => {
          const x = widget.layout.x * colWidth;
          const y = widget.layout.y * rowHeight;
          const w = widget.layout.w * colWidth;
          const h = widget.layout.h * rowHeight;

          return (
            <Rnd
              key={widget.id}
              size={{ width: w, height: h }}
              position={{ x, y }}
              onDragStart={() => setSelectedWidget(widget.id)}
              onResizeStart={() => setSelectedWidget(widget.id)}
              onDragStop={(e, d) => handleDragStop(widget.id, d)}
              onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(widget.id, ref, position)}
              dragGrid={[colWidth, rowHeight]}
              resizeGrid={[colWidth, rowHeight]}
              disableDragging={isPreviewMode}
              enableResizing={!isPreviewMode}
              dragHandleClassName={styles["drag-handle"]}
              minWidth={colWidth * (widget.layout.minW || 1)}
              minHeight={rowHeight * (widget.layout.minH || 1)}
              bounds="parent"
              style={{ zIndex: selectedWidgetId === widget.id ? 50 : 1 }}
            >
              <div
                className={`${styles["widget-wrapper"]} ${
                  selectedWidgetId === widget.id && !isPreviewMode ? styles["widget-wrapper--selected"] : ""
                } ${isPreviewMode ? styles["widget-wrapper--preview"] : ""}`}
                onClick={(e) => {
                  if (!isPreviewMode) {
                    e.stopPropagation();
                    setSelectedWidget(widget.id);
                  }
                }}
                style={{
                  backgroundColor: widget.style.backgroundColor,
                  color: widget.style.textColor,
                  borderRadius: `${widget.style.borderRadius}px`,
                  border: `${widget.style.borderWidth}px solid ${widget.style.borderColor}`,
                  padding: `${widget.style.padding}px`,
                  opacity: widget.style.opacity,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {!isPreviewMode && (
                  <div className={styles["drag-handle"]}>
                    <div className={styles["widget-label"]}>
                      <GripHorizontal size={14} opacity={0.5} />
                      {widget.type === "chart" ? <BarChart3 size={12} /> : widget.type === "kpi" ? <Target size={12} /> : widget.type === "slicer" ? <Filter size={12} /> : widget.type === "ai-summary" ? <Bot size={12} /> : <Type size={12} />}
                      <span style={{ fontSize: "10px", fontWeight: 600, opacity: 0.7 }}>{widget.title}</span>
                    </div>
                    <button 
                      className={styles["settings-btn"]} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWidget(widget.id);
                        setSettingsModalOpen(true);
                      }}
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                )}
                <div className={styles["widget-content"]}>
                  {renderWidget(widget)}
                </div>
              </div>
            </Rnd>
          );
        })
      )}
    </div>
  );
}
