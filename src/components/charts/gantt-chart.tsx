"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { ChartConfig, DataTable, ActiveFilter } from "@/types";
import { CHART_COLORS, applyFilters, joinTables } from "@/lib/utils";

interface Props {
  config: ChartConfig;
  tables: DataTable[];
  filters: ActiveFilter[];
  height?: number;
}

export default function GanttChart({ config, tables, filters, height = 300 }: Props) {
  const { option, hasData } = useMemo(() => {
    if (!config.fields.length || config.values.length < 2) return { option: null, hasData: false };
    
    const taskField = config.fields[0];
    const startField = config.values[0];
    const endField = config.values[1];
    
    const table = tables?.find((t) => t.id === taskField.tableId);
    if (!table || !table.rows) return { option: null, hasData: false };
    
    // Get filtered and joined data
    const valueTableIds = [...new Set(config.values.map(v => v.tableId))].filter(id => id !== taskField.tableId);
    let rows: Record<string, unknown>[] = [];
    if (valueTableIds.length > 0) {
      const tablesToJoin = tables.filter(t => t.id === taskField.tableId || valueTableIds.includes(t.id));
      rows = joinTables(tablesToJoin, [], filters);
    } else {
      rows = applyFilters(table, filters || []);
    }
    
    const tasks = new Map<string, { start: number; end: number }>();
    rows.forEach(row => {
      const task = String(row[taskField.columnName] ?? "Task");
      const start = parseFloat(String(row[startField.columnName] ?? 0));
      const end = parseFloat(String(row[endField.columnName] ?? 0));
      if (!tasks.has(task)) {
        tasks.set(task, { start, end });
      }
    });
    
    const taskList = Array.from(tasks.keys());
    const colors = config.colorScheme?.length ? config.colorScheme : CHART_COLORS;
    const series = [
      {
        name: "Start",
        type: "bar",
        stack: "total",
        itemStyle: {
          borderColor: "rgba(0,0,0,0)",
          color: "rgba(0,0,0,0)"
        },
        emphasis: {
          itemStyle: {
            borderColor: "rgba(0,0,0,0)",
            color: "rgba(0,0,0,0)"
          }
        },
        data: taskList.map((task, i) => {
          const { start } = tasks.get(task)!;
          return [start, i];
        })
      },
      {
        name: "Duration",
        type: "bar",
        stack: "total",
        data: taskList.map((task, i) => {
          const { start, end } = tasks.get(task)!;
          return {
            name: task,
            value: [end - start, i],
            itemStyle: { color: colors[i % colors.length] }
          };
        })
      }
    ];
    
    return {
      hasData: true,
      option: {
        title: {
          text: config.title,
          left: "center",
          top: 8,
          textStyle: {
            fontSize: 13,
            fontFamily: "inherit",
            fontWeight: 600,
            color: "var(--color-text)"
          }
        },
        tooltip: config.showTooltip ? {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params: any) => {
            const durationParam = params.find((p: any) => p.seriesName === "Duration");
            if (!durationParam) return "";
            const taskIndex = durationParam.dataIndex;
            const task = taskList[taskIndex];
            const { start, end } = tasks.get(task)!;
            return `<div style="padding: 4px 8px;">
              <strong>${task}</strong><br/>
              <span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:${durationParam.color}"></span>
              Start: ${start}<br/>
              End: ${end}<br/>
              Duration: ${end - start}
            </div>`;
          },
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "var(--color-border)",
          textStyle: { color: "var(--color-text)", fontSize: 11 }
        } : undefined,
        grid: { left: "4%", right: "4%", top: 45, bottom: 30, containLabel: true },
        xAxis: { type: "value", name: "Time" },
        yAxis: { type: "category", data: taskList },
        series
      }
    };
  }, [config, tables, filters]);
  
  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${height}px`, color: "var(--color-text-tertiary)" }}>
        📊 Configure task, start, and end fields
      </div>
    );
  }
  
  return <ReactECharts option={option} style={{ height: `${height}px`, width: "100%" }} opts={{ renderer: "svg" }} />;
}
