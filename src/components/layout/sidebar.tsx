/* ============================================================
   Editor Sidebar — Data panels, widget palette, field picker
   ============================================================ */
"use client";

import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { WidgetType, ChartType } from "@/types";
import { generateId, getDefaultWidgetStyle } from "@/lib/utils";
import { 
  BarChart3, 
  Columns, 
  LineChart, 
  AreaChart, 
  PieChart, 
  CircleDot, 
  ScatterChart, 
  History, 
  Type, 
  Target, 
  Filter, 
  Bot,
  Settings
} from "lucide-react";
import styles from "./sidebar.module.css";

export default function Sidebar() {
  const { activeTab, sidebarPanel, setSidebarPanel, dataPanel, setDataPanel, setUploadModalOpen, setRelationshipModalOpen, setMeasureModalOpen, selectedTableId, setSelectedTableId } = useUiStore();
  const { project, addWidget, selectedWidgetId } = useProjectStore();

  if (!project) return null;

  if (activeTab === "data") {
    return (
      <aside className={styles.sidebar}>
        <div className={styles["sidebar-header"]}>
          <h3 className={styles["sidebar-title"]}>Data Manager</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setUploadModalOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload
          </button>
        </div>

        <div className={styles["panel-tabs"]}>
          {(["tables", "transform", "relationships", "measures"] as const).map((p) => (
            <button
              key={p}
              className={`${styles["panel-tab"]} ${dataPanel === p ? styles["panel-tab--active"] : ""}`}
              onClick={() => setDataPanel(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles["sidebar-content"]}>
          {dataPanel === "tables" && (
            <div className={styles["table-list"]}>
              {project.tables.length === 0 ? (
                <div className="empty-state" style={{ padding: "32px 16px" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                  <h3>No tables yet</h3>
                  <p>Upload Excel or CSV files to get started</p>
                </div>
              ) : (
                project.tables.map((table) => (
                  <div
                    key={table.id}
                    className={`${styles["table-item"]} ${selectedTableId === table.id ? styles["table-item--active"] : ""}`}
                    onClick={() => setSelectedTableId(table.id)}
                  >
                    <div className={styles["table-item-info"]}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                      <div>
                        <span className={styles["table-name"]}>{table.name}</span>
                        <span className={styles["table-meta"]}>{table.rowCount} rows · {table.columns.length} cols</span>
                      </div>
                    </div>
                    <div className={styles["table-columns"]}>
                      {table.columns.map((col) => (
                        <div key={col.name} className={styles["column-item"]}>
                          <span className={`${styles["type-badge"]} ${styles[`type-${col.type}`]}`}>
                            {col.type.charAt(0).toUpperCase()}
                          </span>
                          <span>{col.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {dataPanel === "relationships" && (
            <div className={styles["relationship-panel"]}>
              <button className="btn btn-secondary btn-sm" style={{ width: "100%", marginBottom: "12px" }} onClick={() => setRelationshipModalOpen(true)}>
                + Add Relationship
              </button>
              {project.relationships.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 16px" }}>
                  <h3>No relationships</h3>
                  <p>Connect tables via column relationships</p>
                </div>
              ) : (
                project.relationships.map((rel) => {
                  const source = project.tables.find((t) => t.id === rel.sourceTableId);
                  const target = project.tables.find((t) => t.id === rel.targetTableId);
                  return (
                    <div key={rel.id} className={styles["rel-item"]}>
                      <div className={styles["rel-tables"]}>
                        <span className="badge">{source?.name}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        <span className="badge">{target?.name}</span>
                      </div>
                      <span className={styles["rel-info"]}>{rel.sourceColumn} → {rel.targetColumn} ({rel.cardinality})</span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {dataPanel === "measures" && (
            <div className={styles["measures-panel"]}>
              <button className="btn btn-secondary btn-sm" style={{ width: "100%", marginBottom: "12px" }} onClick={() => setMeasureModalOpen(true)}>
                + New Measure
              </button>
              {project.measures.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 16px" }}>
                  <h3>No measures</h3>
                  <p>Create calculated columns using formulas</p>
                </div>
              ) : (
                project.measures.map((m) => {
                  const table = project.tables.find((t) => t.id === m.tableId);
                  return (
                    <div key={m.id} className={styles["measure-item"]}>
                      <span className={styles["measure-name"]}>{m.name}</span>
                      <span className={styles["measure-meta"]}>{table?.name} · {m.resultType}</span>
                      <code className={styles["measure-formula"]}>{m.originalFormula || m.formula}</code>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {dataPanel === "transform" && (
            <div className={styles["transform-panel"]}>
              {project.tables.length === 0 ? (
                <div className="empty-state" style={{ padding: "32px 16px" }}>
                  <h3>No data</h3>
                  <p>Upload data to use transformations</p>
                </div>
              ) : !selectedTableId ? (
                <div className="empty-state" style={{ padding: "32px 16px" }}>
                  <h3>Select a Table</h3>
                  <p>Choose a table from the Tables panel first</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
                  <div className={styles.field}>
                    <label className="label">Target Column</label>
                    <select className="select" id="transform-column-select" defaultValue="">
                      <option value="">All columns</option>
                      {project.tables.find(t => t.id === selectedTableId)?.columns.map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="divider" />

                  <span className={styles["section-label"]}>Data Cleaning</span>
                  <button className="btn btn-secondary btn-sm" onClick={async () => {
                    const col = (document.getElementById('transform-column-select') as HTMLSelectElement)?.value;
                    const table = project.tables.find(t => t.id === selectedTableId);
                    if (!table) return;
                    useUiStore.getState().addToast("Transforming...", "info");
                    const res = await fetch("/api/data/transform", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ table, transform: { tableId: table.id, action: "remove-nulls", column: col || undefined } })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      useProjectStore.getState().updateTable(table.id, { rows: data.table.rows, rowCount: data.table.rowCount, columns: data.table.columns });
                      useUiStore.getState().addToast("Nulls removed successfully", "success");
                    }
                  }}>
                    Remove Nulls
                  </button>

                  <button className="btn btn-secondary btn-sm" onClick={async () => {
                    const col = (document.getElementById('transform-column-select') as HTMLSelectElement)?.value;
                    const table = project.tables.find(t => t.id === selectedTableId);
                    if (!table) return;
                    useUiStore.getState().addToast("Transforming...", "info");
                    const res = await fetch("/api/data/transform", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ table, transform: { tableId: table.id, action: "remove-duplicates", column: col || undefined } })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      useProjectStore.getState().updateTable(table.id, { rows: data.table.rows, rowCount: data.table.rowCount, columns: data.table.columns });
                      useUiStore.getState().addToast("Duplicates removed successfully", "success");
                    }
                  }}>
                    Remove Duplicates
                  </button>

                  <div className="divider" />

                  <span className={styles["section-label"]}>Data Types</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {(["string", "number", "boolean", "date"] as const).map(type => (
                      <button key={type} className="btn btn-secondary btn-sm" onClick={async () => {
                        const col = (document.getElementById('transform-column-select') as HTMLSelectElement)?.value;
                        if (!col) return useUiStore.getState().addToast("Select a column to cast type", "error");
                        const table = project.tables.find(t => t.id === selectedTableId);
                        if (!table) return;
                        useUiStore.getState().addToast("Casting type...", "info");
                        const res = await fetch("/api/data/transform", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ table, transform: { tableId: table.id, action: "cast-type", column: col, targetType: type } })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          useProjectStore.getState().updateTable(table.id, { rows: data.table.rows, rowCount: data.table.rowCount, columns: data.table.columns });
                          useUiStore.getState().addToast(`Cast to ${type} successful`, "success");
                        }
                      }}>
                        To {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    );
  }

  if (activeTab === "canvas") {
    return (
      <aside className={styles.sidebar}>
        <div className={styles["sidebar-header"]}>
          <h3 className={styles["sidebar-title"]}>Components</h3>
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={() => {
              useProjectStore.getState().setSelectedWidget(null);
              useUiStore.getState().setSettingsModalOpen(true);
            }}
            title="Canvas Settings"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className={styles["panel-tabs"]}>
          <button
            className={`${styles["panel-tab"]} ${sidebarPanel === "widgets" ? styles["panel-tab--active"] : ""}`}
            onClick={() => setSidebarPanel("widgets")}
          >
            Widgets
          </button>
          <button
            className={`${styles["panel-tab"]} ${sidebarPanel === "fields" ? styles["panel-tab--active"] : ""}`}
            onClick={() => setSidebarPanel("fields")}
          >
            Fields
          </button>
        </div>

        <div className={styles["sidebar-content"]}>
          {sidebarPanel === "widgets" && (
            <div className={styles["widget-palette"]}>
              <div className={styles["widget-group"]}>
                <span className={styles["widget-group-label"]}>Charts</span>
                <div className={styles["widget-grid"]}>
                  {([
                    { type: "chart" as WidgetType, chart: "bar" as ChartType, label: "Bar Chart", icon: <BarChart3 size={18} /> },
                    { type: "chart" as WidgetType, chart: "column" as ChartType, label: "Column Chart", icon: <Columns size={18} /> },
                    { type: "chart" as WidgetType, chart: "line" as ChartType, label: "Line Chart", icon: <LineChart size={18} /> },
                    { type: "chart" as WidgetType, chart: "area" as ChartType, label: "Area Chart", icon: <AreaChart size={18} /> },
                    { type: "chart" as WidgetType, chart: "pie" as ChartType, label: "Pie Chart", icon: <PieChart size={18} /> },
                    { type: "chart" as WidgetType, chart: "donut" as ChartType, label: "Donut Chart", icon: <CircleDot size={18} /> },
                    { type: "chart" as WidgetType, chart: "scatter" as ChartType, label: "Scatter Chart", icon: <ScatterChart size={18} /> },
                    { type: "chart" as WidgetType, chart: "time-series" as ChartType, label: "Time Series", icon: <History size={18} /> },
                  ]).map((w) => (
                    <div key={w.chart} className="tooltip-wrapper">
                      <button
                        className={styles["widget-btn"]}
                        onClick={() => {
                          addWidget({
                            id: generateId(),
                            type: w.type,
                            title: w.label,
                            layout: { x: 0, y: Infinity, w: 12, h: 10, minW: 4, minH: 4 },
                            style: getDefaultWidgetStyle(),
                            chartConfig: {
                              chartType: w.chart,
                              fields: [],
                              values: [],
                              showLegend: true,
                              showTooltip: true,
                              title: w.label,
                              colorScheme: ["#4169E1", "#6C8EF2", "#2F52C7", "#8BA4F5", "#1A3A9E"],
                            },
                          });
                        }}
                      >
                        <span className={styles["widget-icon"]}>{w.icon}</span>
                        <span>{w.label}</span>
                      </button>
                      <div className="tooltip">{w.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles["widget-group"]}>
                <span className={styles["widget-group-label"]}>Elements</span>
                <div className={styles["widget-grid"]}>
                  <div className="tooltip-wrapper">
                    <button className={styles["widget-btn"]} onClick={() => {
                      addWidget({
                        id: generateId(),
                        type: "text",
                        title: "Text",
                        layout: { x: 0, y: Infinity, w: 8, h: 2, minW: 3, minH: 1 },
                        style: { ...getDefaultWidgetStyle(), backgroundColor: "transparent", borderWidth: 0 },
                        textConfig: { content: "Click to edit title", align: "left" },
                      });
                    }}>
                      <span className={styles["widget-icon"]}><Type size={18} /></span>
                      <span>Text</span>
                    </button>
                    <div className="tooltip">Text Box</div>
                  </div>

                  <div className="tooltip-wrapper">
                    <button className={styles["widget-btn"]} onClick={() => {
                      addWidget({
                        id: generateId(),
                        type: "kpi",
                        title: "KPI Card",
                        layout: { x: 0, y: Infinity, w: 6, h: 4, minW: 3, minH: 3 },
                        style: getDefaultWidgetStyle(),
                        kpiConfig: { tableId: "", valueColumn: "", aggregation: "sum", label: "Metric", prefix: "", suffix: "" },
                      });
                    }}>
                      <span className={styles["widget-icon"]}><Target size={18} /></span>
                      <span>KPI Card</span>
                    </button>
                    <div className="tooltip">KPI Card</div>
                  </div>

                  <div className="tooltip-wrapper">
                    <button className={styles["widget-btn"]} onClick={() => {
                      addWidget({
                        id: generateId(),
                        type: "slicer",
                        title: "Slicer",
                        layout: { x: 0, y: Infinity, w: 6, h: 6, minW: 3, minH: 3 },
                        style: getDefaultWidgetStyle(),
                        slicerConfig: { tableId: "", columnName: "", selectedValues: [], multiSelect: true },
                      });
                    }}>
                      <span className={styles["widget-icon"]}><Filter size={18} /></span>
                      <span>Slicer</span>
                    </button>
                    <div className="tooltip">Slicer / Filter</div>
                  </div>

                  <div className="tooltip-wrapper">
                    <button className={styles["widget-btn"]} onClick={() => {
                      addWidget({
                        id: generateId(),
                        type: "ai-summary",
                        title: "AI Insights",
                        layout: { x: 0, y: Infinity, w: 12, h: 8, minW: 6, minH: 4 },
                        style: getDefaultWidgetStyle(),
                        aiSummaryConfig: { prompt: "", generatedText: "", isLoading: false, tableIds: [], analysisMode: "data" },
                      });
                    }}>
                      <span className={styles["widget-icon"]}><Bot size={18} /></span>
                      <span>AI Summary</span>
                    </button>
                    <div className="tooltip">AI Insights</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sidebarPanel === "fields" && (
            <div className={styles["fields-panel"]}>
              {project.tables.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 16px" }}>
                  <h3>No data loaded</h3>
                  <p>Import data first to see available fields</p>
                </div>
              ) : (
                project.tables.map((table) => (
                  <div key={table.id} className={styles["field-table-group"]}>
                    <div className={styles["field-table-header"]}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                      <span>{table.name}</span>
                    </div>
                    {table.columns.map((col) => (
                      <div key={col.name} className={styles["field-item"]}>
                        <span className={`${styles["type-badge"]} ${styles[`type-${col.type}`]}`}>
                          {col.type === "number" ? "Σ" : col.type === "date" ? "📅" : "A"}
                        </span>
                        <span>{col.name}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </aside>
    );
  }

  return null;
}
