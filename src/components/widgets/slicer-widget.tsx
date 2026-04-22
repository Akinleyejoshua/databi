/* ============================================================
   Slicer Widget — Global data filter
   ============================================================ */
"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/use-project-store";
import type { Widget } from "@/types";
import styles from "./slicer-widget.module.css";

interface Props { widget: Widget; }

export default function SlicerWidget({ widget }: Props) {
  const { project, setFilter, clearFilter, activeFilters, updateWidget } = useProjectStore();
  const slicer = widget.slicerConfig;

  const uniqueValues = useMemo(() => {
    if (!project || !slicer?.tableId || !slicer?.columnName) return [];
    const table = project.tables.find((t) => t.id === slicer.tableId);
    if (!table) return [];
    return [...new Set(table.rows.map((r) => r[slicer.columnName]))].filter((v) => v !== null && v !== undefined);
  }, [project, slicer]);

  if (!slicer?.tableId || !slicer?.columnName) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
        Configure slicer settings
      </div>
    );
  }

  const selected = new Set(slicer.selectedValues.map(String));

  const toggle = (val: unknown) => {
    const strVal = String(val);
    const newSelected = new Set(selected);
    if (newSelected.has(strVal)) {
      newSelected.delete(strVal);
    } else {
      if (!slicer.multiSelect) newSelected.clear();
      newSelected.add(strVal);
    }
    const newValues = Array.from(newSelected);

    updateWidget(widget.id, {
      slicerConfig: { ...slicer, selectedValues: newValues },
    });

    if (newValues.length > 0) {
      setFilter({ tableId: slicer.tableId, columnName: slicer.columnName, values: uniqueValues.filter((v) => newValues.includes(String(v))) });
    } else {
      clearFilter(slicer.tableId, slicer.columnName);
    }
  };

  const clearAll = () => {
    updateWidget(widget.id, { slicerConfig: { ...slicer, selectedValues: [] } });
    clearFilter(slicer.tableId, slicer.columnName);
  };

  return (
    <div className={styles.slicer}>
      <div className={styles["slicer-header"]}>
        <span className={styles["slicer-title"]}>{slicer.columnName}</span>
        {selected.size > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ fontSize: "11px" }}>Clear</button>
        )}
      </div>
      <div className={styles["slicer-list"]}>
        {uniqueValues.slice(0, 100).map((val, i) => (
          <label key={i} className={`${styles["slicer-item"]} ${selected.has(String(val)) ? styles["slicer-item--selected"] : ""}`}>
            <input type="checkbox" checked={selected.has(String(val))} onChange={() => toggle(val)} style={{ display: "none" }} />
            <span className={styles["slicer-check"]}>{selected.has(String(val)) ? "✓" : ""}</span>
            <span>{String(val)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
