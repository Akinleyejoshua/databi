/* ============================================================
   Settings Sidebar — Widget styling & config panel
   ============================================================ */
"use client";

import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { Widget, ChartType } from "@/types";
import styles from "./settings-sidebar.module.css";

export default function SettingsSidebar() {
  const { project, selectedWidgetId, updateWidget, updateWidgetStyle, removeWidget, updateCanvasSettings } = useProjectStore();
  const { setSidebarPanel } = useUiStore();

  const widget = project?.widgets.find((w) => w.id === selectedWidgetId);

  if (!selectedWidgetId || !widget) {
    // Show canvas settings when no widget selected
    return (
      <aside className={styles.settings}>
        <div className={styles["settings-header"]}>
          <h3>Canvas Settings</h3>
        </div>
        <div className={styles["settings-body"]}>
          <div className={styles.field}>
            <label className="label">Background Color</label>
            <div className={styles["color-input"]}>
              <input type="color" value={project?.canvasSettings.backgroundColor || "#ffffff"} onChange={(e) => updateCanvasSettings({ backgroundColor: e.target.value })} />
              <input className="input" value={project?.canvasSettings.backgroundColor || "#ffffff"} onChange={(e) => updateCanvasSettings({ backgroundColor: e.target.value })} />
            </div>
          </div>
          <div className={styles.field}>
            <label className="label">Columns</label>
            <input className="input" type="number" value={project?.canvasSettings.cols || 24} onChange={(e) => updateCanvasSettings({ cols: Number(e.target.value) })} min={6} max={48} />
          </div>
          <div className={styles.field}>
            <label className="label">Row Height</label>
            <input className="input" type="number" value={project?.canvasSettings.rowHeight || 30} onChange={(e) => updateCanvasSettings({ rowHeight: Number(e.target.value) })} min={10} max={100} />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.settings}>
      <div className={styles["settings-header"]}>
        <h3>{widget.type.charAt(0).toUpperCase() + widget.type.slice(1)} Settings</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => { removeWidget(widget.id); }}>🗑</button>
      </div>
      <div className={styles["settings-body"]}>
        {/* Title */}
        <div className={styles.field}>
          <label className="label">Title</label>
          <input className="input" value={widget.title} onChange={(e) => updateWidget(widget.id, { title: e.target.value })} />
        </div>

        {/* Chart-specific config */}
        {widget.type === "chart" && widget.chartConfig && (
          <>
            <div className={styles.field}>
              <label className="label">Chart Type</label>
              <select className="select" value={widget.chartConfig.chartType} onChange={(e) =>
                updateWidget(widget.id, { chartConfig: { ...widget.chartConfig!, chartType: e.target.value as ChartType } })
              }>
                {["bar","column","line","area","pie","donut","scatter","time-series"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className="label">Chart Title</label>
              <input className="input" value={widget.chartConfig.title} onChange={(e) =>
                updateWidget(widget.id, { chartConfig: { ...widget.chartConfig!, title: e.target.value } })
              } />
            </div>

            {/* Fields (categories) */}
            <div className={styles.field}>
              <label className="label">Field (Category Axis)</label>
              <select className="select" value={widget.chartConfig.fields[0] ? `${widget.chartConfig.fields[0].tableId}:::${widget.chartConfig.fields[0].columnName}` : ""} onChange={(e) => {
                const [tableId, columnName] = e.target.value.split(":::");
                updateWidget(widget.id, { chartConfig: { ...widget.chartConfig!, fields: [{ tableId, columnName }] } });
              }}>
                <option value="">Select field...</option>
                {project?.tables.map((t) =>
                  t.columns.map((c) => (
                    <option key={`${t.id}:::${c.name}`} value={`${t.id}:::${c.name}`}>{t.name} → {c.name}</option>
                  ))
                )}
              </select>
            </div>

            {/* Values */}
            <div className={styles.field}>
              <label className="label">Value</label>
              <select className="select" value={
                widget.chartConfig.values[0] 
                  ? `${widget.chartConfig.values[0].tableId}:::${widget.chartConfig.values[0].columnName}:::${widget.chartConfig.values[0].aggregation === "measure" ? "measure" : "col"}` 
                  : ""
              } onChange={(e) => {
                if (!e.target.value) return;
                const [tableId, columnName, type] = e.target.value.split(":::");
                updateWidget(widget.id, {
                  chartConfig: { 
                    ...widget.chartConfig!, 
                    values: [{ 
                      tableId, 
                      columnName, 
                      aggregation: type === "measure" ? "measure" : (widget.chartConfig!.values[0]?.aggregation !== "measure" && widget.chartConfig!.values[0]?.aggregation ? widget.chartConfig!.values[0].aggregation : "sum") 
                    }] 
                  },
                });
              }}>
                <option value="">Select value...</option>
                <optgroup label="Columns">
                  {project?.tables.map((t) =>
                    t.columns.filter((c) => c.type === "number").map((c) => (
                      <option key={`${t.id}:::${c.name}:::col`} value={`${t.id}:::${c.name}:::col`}>{t.name} → {c.name}</option>
                    ))
                  )}
                </optgroup>
                {project?.measures && project.measures.length > 0 && (
                  <optgroup label="Custom Measures">
                    {project.measures.map((m) => (
                      <option key={`${m.tableId}:::${m.id}:::measure`} value={`${m.tableId}:::${m.id}:::measure`}>∑ {m.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {widget.chartConfig.values.length > 0 && widget.chartConfig.values[0].aggregation !== "measure" && (
              <div className={styles.field}>
                <label className="label">Aggregation</label>
                <select className="select" value={widget.chartConfig.values[0]?.aggregation || "sum"} onChange={(e) => {
                  const vals = [...widget.chartConfig!.values];
                  vals[0] = { ...vals[0], aggregation: e.target.value as "sum" | "average" | "count" | "min" | "max" };
                  updateWidget(widget.id, { chartConfig: { ...widget.chartConfig!, values: vals } });
                }}>
                  {["sum","average","count","min","max"].map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}

            <div className={styles.field}>
              <label className="label" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="checkbox" checked={widget.chartConfig.showLegend} onChange={(e) =>
                  updateWidget(widget.id, { chartConfig: { ...widget.chartConfig!, showLegend: e.target.checked } })
                } style={{ accentColor: "var(--color-primary)" }} />
                Show Legend
              </label>
            </div>
          </>
        )}

        {/* KPI config */}
        {widget.type === "kpi" && widget.kpiConfig && (
          <>
            <div className={styles.field}>
              <label className="label">Table</label>
              <select className="select" value={widget.kpiConfig.tableId} onChange={(e) =>
                updateWidget(widget.id, { kpiConfig: { ...widget.kpiConfig!, tableId: e.target.value } })
              }>
                <option value="">Select table...</option>
                {project?.tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className="label">Value Column</label>
              <select className="select" value={widget.kpiConfig.valueColumn} onChange={(e) =>
                updateWidget(widget.id, { kpiConfig: { ...widget.kpiConfig!, valueColumn: e.target.value } })
              }>
                <option value="">Select column...</option>
                {project?.tables.find((t) => t.id === widget.kpiConfig?.tableId)?.columns.filter((c) => c.type === "number").map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className="label">Aggregation</label>
              <select className="select" value={widget.kpiConfig.aggregation} onChange={(e) =>
                updateWidget(widget.id, { kpiConfig: { ...widget.kpiConfig!, aggregation: e.target.value as "sum" | "average" | "count" | "min" | "max" } })
              }>
                {["sum","average","count","min","max"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className="label">Label</label>
              <input className="input" value={widget.kpiConfig.label} onChange={(e) => updateWidget(widget.id, { kpiConfig: { ...widget.kpiConfig!, label: e.target.value } })} />
            </div>
            <div className={styles.field}>
              <label className="label">Prefix</label>
              <input className="input" value={widget.kpiConfig.prefix} onChange={(e) => updateWidget(widget.id, { kpiConfig: { ...widget.kpiConfig!, prefix: e.target.value } })} placeholder="e.g. $" />
            </div>
            <div className={styles.field}>
              <label className="label">Suffix</label>
              <input className="input" value={widget.kpiConfig.suffix} onChange={(e) => updateWidget(widget.id, { kpiConfig: { ...widget.kpiConfig!, suffix: e.target.value } })} placeholder="e.g. %" />
            </div>
          </>
        )}

        {/* Slicer config */}
        {widget.type === "slicer" && widget.slicerConfig && (
          <>
            <div className={styles.field}>
              <label className="label">Table</label>
              <select className="select" value={widget.slicerConfig.tableId} onChange={(e) =>
                updateWidget(widget.id, { slicerConfig: { ...widget.slicerConfig!, tableId: e.target.value, columnName: "" } })
              }>
                <option value="">Select table...</option>
                {project?.tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className="label">Column</label>
              <select className="select" value={widget.slicerConfig.columnName} onChange={(e) =>
                updateWidget(widget.id, { slicerConfig: { ...widget.slicerConfig!, columnName: e.target.value, selectedValues: [] } })
              }>
                <option value="">Select column...</option>
                {project?.tables.find((t) => t.id === widget.slicerConfig?.tableId)?.columns.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Text config */}
        {widget.type === "text" && widget.textConfig && (
          <div className={styles.field}>
            <label className="label">Alignment</label>
            <select className="select" value={widget.textConfig.align} onChange={(e) =>
              updateWidget(widget.id, { textConfig: { ...widget.textConfig!, align: e.target.value as "left" | "center" | "right" } })
            }>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        )}

        {/* Divider */}
        <div className="divider" />

        {/* Style section */}
        <span className={styles["section-label"]}>Style</span>

        <div className={styles.field}>
          <label className="label">Background</label>
          <div className={styles["color-input"]}>
            <input type="color" value={widget.style.backgroundColor.startsWith("var") ? "#ffffff" : widget.style.backgroundColor} onChange={(e) => updateWidgetStyle(widget.id, { backgroundColor: e.target.value })} />
            <input className="input" value={widget.style.backgroundColor} onChange={(e) => updateWidgetStyle(widget.id, { backgroundColor: e.target.value })} />
          </div>
        </div>

        <div className={styles.field}>
          <label className="label">Text Color</label>
          <div className={styles["color-input"]}>
            <input type="color" value={widget.style.textColor.startsWith("var") ? "#000000" : widget.style.textColor} onChange={(e) => updateWidgetStyle(widget.id, { textColor: e.target.value })} />
            <input className="input" value={widget.style.textColor} onChange={(e) => updateWidgetStyle(widget.id, { textColor: e.target.value })} />
          </div>
        </div>

        <div className={styles.field}>
          <label className="label">Font Size</label>
          <input className="input" type="number" value={widget.style.fontSize} onChange={(e) => updateWidgetStyle(widget.id, { fontSize: Number(e.target.value) })} min={8} max={72} />
        </div>

        <div className={styles.field}>
          <label className="label">Font Weight</label>
          <select className="select" value={widget.style.fontWeight} onChange={(e) => updateWidgetStyle(widget.id, { fontWeight: e.target.value })}>
            <option value="400">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semi-Bold</option>
            <option value="700">Bold</option>
            <option value="800">Extra Bold</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className="label">Border Radius</label>
          <input className="input" type="number" value={widget.style.borderRadius} onChange={(e) => updateWidgetStyle(widget.id, { borderRadius: Number(e.target.value) })} min={0} max={50} />
        </div>

        <div className={styles.field}>
          <label className="label">Border Width</label>
          <input className="input" type="number" value={widget.style.borderWidth} onChange={(e) => updateWidgetStyle(widget.id, { borderWidth: Number(e.target.value) })} min={0} max={10} />
        </div>

        <div className={styles.field}>
          <label className="label">Padding</label>
          <input className="input" type="number" value={widget.style.padding} onChange={(e) => updateWidgetStyle(widget.id, { padding: Number(e.target.value) })} min={0} max={64} />
        </div>
      </div>
    </aside>
  );
}
