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
import { Settings, GripHorizontal, BarChart3, Target, Filter, Bot, Type, MousePointer2, Hand } from "lucide-react";
import styles from "./canvas-area.module.css";

interface Props {
  isSharePage?: boolean;
}

export default function CanvasArea({ isSharePage }: Props) {
  const { project, selectedWidgetId, setSelectedWidget, updateLayouts } = useProjectStore();
  const { isPreviewMode, setSettingsModalOpen, cursorMode, setCursorMode } = useUiStore();
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState<number | string>("calc(100vh - 100px)");
  const [canvasWidth, setCanvasWidth] = useState<number | string>("100%");

  // Pan state
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !containerRef.current) return;

    const width = containerRef.current.offsetWidth;
    if (width > 0) setContainerWidth(width);

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [hasMounted]);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.code === "Space") {
        setCursorMode("pan");
      }
      if (e.key.toLowerCase() === "v") {
        setCursorMode("select");
      }
      if (e.key.toLowerCase() === "h") {
        setCursorMode("pan");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        // Option: return to select on space up, or stay in pan
        // setCursorMode("select"); 
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setCursorMode]);

  // Calculate infinite canvas size
  useEffect(() => {
    if (!project?.widgets.length) {
      setCanvasHeight("calc(100vh - 100px)");
      setCanvasWidth("100%");
      return;
    }
    
    const maxBottom = Math.max(...project.widgets.map(w => w.layout.y + w.layout.h));
    const maxRight = Math.max(...project.widgets.map(w => w.layout.x + w.layout.w));
    
    const viewportHeight = window.innerHeight;
    const rowHeight = project.canvasSettings.rowHeight || 30;
    const cols = project.canvasSettings.cols || 24;
    
    // Use a minimum width for calculation to prevent compression on mobile
    const baseWidthForCalc = Math.max(containerWidth, project.canvasSettings.width || 1200);
    const colWidth = baseWidthForCalc / cols;

    const calculatedHeight = Math.max(viewportHeight - 100, (maxBottom + 25) * rowHeight);
    const calculatedWidth = Math.max(baseWidthForCalc, (maxRight + 10) * colWidth);
    
    if (isFinite(calculatedHeight)) setCanvasHeight(calculatedHeight);
    if (isFinite(calculatedWidth)) setCanvasWidth(calculatedWidth);
  }, [project?.widgets, project?.canvasSettings, containerWidth]);

  if (!project || !hasMounted) return null;

  const cols = project.canvasSettings.cols || 24;
  const rowHeight = project.canvasSettings.rowHeight || 30;
  const baseWidth = Math.max(containerWidth, project.canvasSettings.width || 1200);
  const colWidth = baseWidth / cols;

  const handleDrag = (e: any) => {
    if (isPreviewMode) return;
    
    // Auto-scroll logic
    if (!containerRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, right, bottom } = containerRef.current.getBoundingClientRect();
    
    const threshold = 50;
    const scrollSpeed = 15;

    if (clientX > right - threshold) containerRef.current.scrollLeft += scrollSpeed;
    if (clientX < left + threshold) containerRef.current.scrollLeft -= scrollSpeed;
    if (clientY > bottom - threshold) containerRef.current.scrollTop += scrollSpeed;
    if (clientY < top + threshold) containerRef.current.scrollTop -= scrollSpeed;
  };

  const handleDragStop = (id: string, d: { x: number; y: number }) => {
    const x = Math.round(d.x / colWidth);
    const y = Math.round(d.y / rowHeight);
    const widget = project.widgets.find(w => w.id === id);
    if (!widget) return;
    updateLayouts([{ id, x, y, w: widget.layout.w, h: widget.layout.h }]);
  };

  const handleResizeStop = (id: string, ref: HTMLElement, position: { x: number; y: number }) => {
    const w = Math.round(ref.offsetWidth / colWidth);
    const h = Math.round(ref.offsetHeight / rowHeight);
    const x = Math.round(position.x / colWidth);
    const y = Math.round(position.y / rowHeight);
    updateLayouts([{ id, x, y, w, h }]);
  };

  // Pan Handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (cursorMode !== "pan") return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
      containerRef.current.style.userSelect = "none";
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current || !containerRef.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    containerRef.current.scrollLeft -= dx;
    containerRef.current.scrollTop -= dy;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    isPanning.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = cursorMode === "pan" ? "grab" : "default";
      containerRef.current.style.userSelect = "auto";
    }
  };

  return (
    <div 
      className={styles["canvas-viewport"]} 
      style={{ 
        position: "relative", 
        flex: 1, 
        overflow: "hidden", // Viewport handles layout
        display: "flex", 
        flexDirection: "column"
      }}
    >
      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className={styles["canvas-scroll-container"]}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "auto",
          cursor: cursorMode === "pan" ? "grab" : "default"
        }}
      >
        <div
          className={`${styles.canvas} ${cursorMode === "pan" ? styles["canvas--panning"] : ""}`}
          style={{ 
            backgroundColor: project.canvasSettings.backgroundColor,
            minHeight: canvasHeight,
            width: canvasWidth,
            position: "relative",
            /* @ts-ignore */
            "--col-width": `${colWidth}px`,
            "--row-height": `${rowHeight}px`
          }}
          onClick={() => {
            if (cursorMode === "select") setSelectedWidget(null);
          }}
        >
          {project.widgets.length === 0 ? (
            <div className={styles["canvas-empty"]}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <h3>Empty Canvas</h3>
              <p>Add widgets to start building</p>
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
                  onDragStart={() => {
                    if (cursorMode === "select") setSelectedWidget(widget.id);
                  }}
                  onResizeStart={() => setSelectedWidget(widget.id)}
                  onDrag={(e) => handleDrag(e)}
                  onDragStop={(e, d) => handleDragStop(widget.id, d)}
                  onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(widget.id, ref, position)}
                  dragGrid={[colWidth, rowHeight]}
                  resizeGrid={[colWidth, rowHeight]}
                  disableDragging={(isPreviewMode && !isSharePage) || cursorMode === "pan"}
                  enableResizing={(!isPreviewMode || isSharePage) && cursorMode === "select"}
                  dragHandleClassName={styles["drag-handle"]}
                  minWidth={colWidth * (widget.layout.minW || 1)}
                  minHeight={rowHeight * (widget.layout.minH || 1)}
                  style={{ zIndex: selectedWidgetId === widget.id ? 50 : 1, pointerEvents: cursorMode === "pan" ? "none" : "auto" }}
                >
                  <div
                    className={`${styles["widget-wrapper"]} ${
                      selectedWidgetId === widget.id && !isPreviewMode ? styles["widget-wrapper--selected"] : ""
                    } ${isPreviewMode ? styles["widget-wrapper--preview"] : ""}`}
                    onClick={(e) => {
                      if (!isPreviewMode && cursorMode === "select") {
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
                    {(!isPreviewMode || isSharePage) && cursorMode === "select" && (
                      <div className={styles["drag-handle"]}>
                        <div className={styles["widget-label"]}>
                          <GripHorizontal size={14} opacity={0.5} />
                          <span style={{ fontSize: "10px", fontWeight: 600, opacity: 0.7 }}>{widget.title}</span>
                        </div>
                        {!isSharePage && (
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
                        )}
                      </div>
                    )}
                    <div className={styles["widget-content"]} style={{ paddingTop: cursorMode === "select" ? "32px" : "6px" }}>
                      {(() => {
                        switch (widget.type) {
                          case "chart": return <ChartWidget widget={widget} />;
                          case "text": return <TextWidget widget={widget} />;
                          case "kpi": return <KpiWidget widget={widget} />;
                          case "slicer": return <SlicerWidget widget={widget} />;
                          case "ai-summary": return <AiSummaryWidget widget={widget} />;
                          default: return null;
                        }
                      })()}
                    </div>
                  </div>
                </Rnd>
              );
            })
          )}
        </div>
      </div>

      {/* Figma-style Floating Toolbar */}
      {(!isPreviewMode || isSharePage) && (
        <div className={styles["canvas-toolbar"]} onMouseDown={(e) => e.stopPropagation()}>
          <div className="tooltip-wrapper">
            <button 
              className={`${styles["tool-btn"]} ${cursorMode === "select" ? styles["tool-btn--active"] : ""}`}
              onClick={() => setCursorMode("select")}
            >
              <MousePointer2 size={18} />
            </button>
            <div className="tooltip">Select (V)</div>
          </div>
          
          <div className="tooltip-wrapper">
            <button 
              className={`${styles["tool-btn"]} ${cursorMode === "pan" ? styles["tool-btn--active"] : ""}`}
              onClick={() => setCursorMode("pan")}
            >
              <Hand size={18} />
            </button>
            <div className="tooltip">Pan (H / Space)</div>
          </div>

          <div className={styles["tool-divider"]} />
          <span style={{ fontSize: "11px", fontWeight: 600, opacity: 0.5, padding: "0 8px", cursor: "default" }}>
            {cursorMode === "pan" ? "PAN MODE" : "SELECT"}
          </span>
        </div>
      )}
    </div>
  );
}
