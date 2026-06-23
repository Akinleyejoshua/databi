/* ============================================================
   Canvas Area — Drag & Drop using react-rnd (Alternative to RGL)
   ============================================================ */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Rnd } from "react-rnd";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import { useHistoryShortcuts } from "@/store/use-project-history";
import ChartWidget from "@/components/widgets/chart-widget";
import TextWidget from "@/components/widgets/text-widget";
import KpiWidget from "@/components/widgets/kpi-widget";
import SlicerWidget from "@/components/widgets/slicer-widget";
import AiSummaryWidget from "@/components/widgets/ai-summary-widget";
import { Settings, GripHorizontal, BarChart3, Target, Filter, Bot, Type, MousePointer2, Hand, RotateCcw, RotateCw, Plus, X } from "lucide-react";
import styles from "./canvas-area.module.css";

interface Props {
  isSharePage?: boolean;
}

function isColorDark(color: string): boolean {
  if (!color) return false;
  try {
    const hex = color.replace("#", "").padEnd(6, "0");
    const num = parseInt(hex, 16);
    return num < 8947848;
  } catch (e) {
    return false;
  }
}

export default function CanvasArea({ isSharePage }: Props) {
  const { 
    project, 
    selectedWidgetId, 
    setSelectedWidget, 
    updateLayouts,
    addSheet,
    renameSheet,
    removeSheet,
    setActiveSheet
  } = useProjectStore();
  const { isPreviewMode, setSettingsModalOpen, cursorMode, setCursorMode } = useUiStore();
  const { undo, redo, canUndo, canRedo } = useHistoryShortcuts();
  const [hasMounted, setHasMounted] = useState(false);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState<number | string>("calc(100vh - 100px)");
  const [canvasWidth, setCanvasWidth] = useState<number | string>("100%");

  const sheets = useMemo(() => {
    if (!project) return [];
    return project.sheets && project.sheets.length > 0
      ? project.sheets
      : [{ id: "default", name: "Page 1", widgets: project.widgets || [] }];
  }, [project?.sheets, project?.widgets]);

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

  const activeSheetId = project.activeSheetId || "default";

  const handleAddPage = () => {
    addSheet(`Page ${sheets.length + 1}`);
  };

  const handleRenameSubmit = (sheetId: string) => {
    if (editingName.trim()) {
      renameSheet(sheetId, editingName.trim());
    }
    setEditingSheetId(null);
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
          bottom: "40px", // leave space for sheets bar
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

              const settings = project.canvasSettings;
              const preset = settings.containerPreset || "default";

              let presetStyle: React.CSSProperties = {};
              
              const isDarkCanvas = isColorDark(settings.backgroundColor);

              if (preset === "figma-flat") {
                presetStyle = {
                  backgroundColor: settings.containerBgColor || (isDarkCanvas ? "#1e1e24" : "#ffffff"),
                  borderColor: settings.containerBorderColor || (isDarkCanvas ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
                  borderWidth: `${settings.containerBorderWidth ?? 1}px`,
                  borderStyle: "solid",
                  borderRadius: `${settings.containerBorderRadius ?? 12}px`,
                  boxShadow: settings.containerShadow === "none" ? "none" : "0 1px 3px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.05)",
                };
              } else if (preset === "figma-glass") {
                presetStyle = {
                  backgroundColor: settings.containerBgColor || (isDarkCanvas ? "rgba(15, 15, 20, 0.65)" : "rgba(255, 255, 255, 0.65)"),
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderColor: settings.containerBorderColor || (isDarkCanvas ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.4)"),
                  borderWidth: `${settings.containerBorderWidth ?? 1}px`,
                  borderStyle: "solid",
                  borderRadius: `${settings.containerBorderRadius ?? 16}px`,
                  boxShadow: settings.containerShadow === "none" ? "none" : "0 8px 32px 0 rgba(31, 38, 135, 0.04)",
                };
              } else if (preset === "figma-dark-glass") {
                presetStyle = {
                  backgroundColor: settings.containerBgColor || "rgba(15, 15, 20, 0.75)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderColor: settings.containerBorderColor || "rgba(255,255,255,0.08)",
                  borderWidth: `${settings.containerBorderWidth ?? 1}px`,
                  borderStyle: "solid",
                  borderRadius: `${settings.containerBorderRadius ?? 16}px`,
                  boxShadow: settings.containerShadow === "none" ? "none" : "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                };
              } else if (preset === "figma-neon") {
                presetStyle = {
                  backgroundColor: settings.containerBgColor || "#09090b",
                  borderColor: settings.containerBorderColor || "var(--color-primary)",
                  borderWidth: `${settings.containerBorderWidth ?? 1}px`,
                  borderStyle: "solid",
                  borderRadius: `${settings.containerBorderRadius ?? 14}px`,
                  boxShadow: settings.containerShadow === "none" ? "none" : "0 0 15px rgba(59, 130, 246, 0.15)",
                };
              } else if (preset === "figma-bordered") {
                presetStyle = {
                  backgroundColor: settings.containerBgColor || "transparent",
                  borderColor: settings.containerBorderColor || "var(--color-border)",
                  borderWidth: `${settings.containerBorderWidth ?? 2}px`,
                  borderStyle: "solid",
                  borderRadius: `${settings.containerBorderRadius ?? 8}px`,
                  boxShadow: "none",
                };
              }

              if (settings.containerShadow && settings.containerShadow !== "none" && preset !== "figma-bordered") {
                if (settings.containerShadow === "sm") presetStyle.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                else if (settings.containerShadow === "md") presetStyle.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                else if (settings.containerShadow === "lg") presetStyle.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
                else if (settings.containerShadow === "figma-premium") presetStyle.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02)";
                else if (settings.containerShadow === "glow") presetStyle.boxShadow = `0 0 20px ${settings.containerBorderColor || "rgba(99, 102, 241, 0.25)"}`;
              }

              const containerStyle: React.CSSProperties = preset === "default" ? {
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
              } : {
                color: widget.style.textColor || "var(--color-text)",
                padding: `${widget.style.padding ?? 16}px`,
                opacity: widget.style.opacity ?? 1,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                ...presetStyle,
              };

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
                    style={containerStyle}
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
        <div className={styles["canvas-toolbar"]} onMouseDown={(e) => e.stopPropagation()} style={{ bottom: "56px" }}>
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

          <div className="tooltip-wrapper">
            <button 
              className={`${styles["tool-btn"]} ${!canUndo ? styles["tool-btn--disabled"] : ""}`}
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw size={18} />
            </button>
            <div className="tooltip">Undo (Ctrl+Z)</div>
          </div>

          <div className="tooltip-wrapper">
            <button 
              className={`${styles["tool-btn"]} ${!canRedo ? styles["tool-btn--disabled"] : ""}`}
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <RotateCw size={18} />
            </button>
            <div className="tooltip">Redo (Ctrl+Shift+Z)</div>
          </div>

          <div className={styles["tool-divider"]} />
          <span style={{ fontSize: "11px", fontWeight: 600, opacity: 0.5, padding: "0 8px", cursor: "default" }}>
            {cursorMode === "pan" ? "PAN MODE" : "SELECT"}
          </span>
        </div>
      )}

      {/* Sheets / Pages Bar (PowerBI-style) */}
      <div 
        className={styles["sheets-bar"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40px",
          backgroundColor: "var(--color-bg-secondary)",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "12px",
          zIndex: 10,
          userSelect: "none"
        }}
      >
        <div style={{ display: "flex", overflowX: "auto", gap: "4px", height: "100%", alignItems: "flex-end", flex: 1 }}>
          {sheets.map((sheet) => {
            const isActive = sheet.id === activeSheetId;
            const isEditing = sheet.id === editingSheetId;

            return (
              <div
                key={sheet.id}
                onClick={() => {
                  if (!isActive) setActiveSheet(sheet.id);
                }}
                onDoubleClick={() => {
                  if (!isPreviewMode && !isSharePage) {
                    setEditingSheetId(sheet.id);
                    setEditingName(sheet.name);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "32px",
                  padding: "0 12px",
                  borderRadius: "6px 6px 0 0",
                  backgroundColor: isActive ? "var(--color-surface)" : "transparent",
                  border: isActive ? "1px solid var(--color-border)" : "1px solid transparent",
                  borderBottom: isActive ? "1px solid var(--color-surface)" : "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--color-text)" : "var(--color-text-secondary)",
                  transition: "all var(--transition-fast)",
                  position: "relative",
                  bottom: "-1px"
                }}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameSubmit(sheet.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(sheet.id);
                      if (e.key === "Escape") setEditingSheetId(null);
                    }}
                    autoFocus
                    style={{
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      width: "80px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-text)",
                      padding: 0
                    }}
                  />
                ) : (
                  <span>{sheet.name}</span>
                )}

                {isActive && sheets.length > 1 && !isPreviewMode && !isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSheet(sheet.id);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      cursor: "pointer",
                      opacity: 0.5,
                      borderRadius: "50%",
                      width: "14px",
                      height: "14px"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}

          {!isPreviewMode && (
            <button
              onClick={handleAddPage}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "32px",
                width: "32px",
                borderRadius: "6px 6px 0 0",
                cursor: "pointer",
                color: "var(--color-text-secondary)",
                transition: "all var(--transition-fast)",
                border: "none",
                background: "transparent"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        {!isPreviewMode && !isSharePage && (
          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
            Double-click tab to rename
          </div>
        )}
      </div>
    </div>
  );
}
