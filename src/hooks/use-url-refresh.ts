/* ============================================================
   Hook: Use URL Data Refresh Manager
   Manages auto-refresh of URL-based datasets
   ============================================================ */

import { useEffect, useRef } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import type { DataTable } from "@/types";

export function useUrlDataRefreshManager() {
  const { project, updateTable } = useProjectStore();
  const { addToast } = useUiStore();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeRefreshesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!project) return;

    // Find all URL-based tables with auto-refresh enabled
    const urlTablesToRefresh = project.tables.filter(
      (table) =>
        table.source?.type === "url" &&
        table.source?.isAutoRefresh &&
        table.source?.url
    );

    // Set up refresh intervals for each URL table
    urlTablesToRefresh.forEach((table) => {
      if (!table.source?.url || !table.source?.refreshInterval) return;

      // Clear existing interval if any
      const existingInterval = activeRefreshesRef.current.get(table.id);
      if (existingInterval) {
        clearInterval(existingInterval);
      }

      // Set new interval
      const interval = setInterval(async () => {
        await refreshUrlData(table);
      }, table.source.refreshInterval);

      activeRefreshesRef.current.set(table.id, interval);
    });

    return () => {
      // Clean up all intervals on unmount
      activeRefreshesRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      activeRefreshesRef.current.clear();
    };
  }, [project?.tables]);

  const refreshUrlData = async (table: DataTable) => {
    if (!table.source?.url) return;

    try {
      const res = await fetch("/api/data/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: table.source.url,
          refreshInterval: table.source.refreshInterval,
          isAutoRefresh: table.source.isAutoRefresh,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to refresh data");
      }

      const data = await res.json();
      const newTableData = data.tables[0];

      if (newTableData) {
        // Update table with new data
        updateTable(table.id, {
          rows: newTableData.rows,
          rowCount: newTableData.rowCount,
          columns: newTableData.columns,
          source: {
            ...table.source,
            type: "url",
            lastRefreshed: new Date().toISOString(),
          },
        });

        // Optional: Show toast notification
        // addToast(`Updated: ${table.name}`, "success");
      }
    } catch (error) {
      console.error(`Failed to refresh ${table.name}:`, error);
      addToast(`Failed to refresh ${table.name}`, "error");
    }
  };

  /**
   * Manually trigger refresh for a specific URL-based table
   */
  const refreshTable = async (tableId: string) => {
    const table = project?.tables.find((t) => t.id === tableId);
    if (!table || !table.source?.url) {
      addToast("Table does not have a URL source", "error");
      return;
    }

    await refreshUrlData(table);
  };

  /**
   * Enable auto-refresh for a table
   */
  const enableAutoRefresh = (tableId: string, intervalMs?: number) => {
    const table = project?.tables.find((t) => t.id === tableId);
    if (!table) return;

    updateTable(tableId, {
      source: {
        ...table.source,
        type: table.source?.type || "url",
        isAutoRefresh: true,
        refreshInterval: intervalMs || table.source?.refreshInterval || 3600000,
      },
    });
  };

  /**
   * Disable auto-refresh for a table
   */
  const disableAutoRefresh = (tableId: string) => {
    const table = project?.tables.find((t) => t.id === tableId);
    if (!table) return;

    const existingInterval = activeRefreshesRef.current.get(tableId);
    if (existingInterval) {
      clearInterval(existingInterval);
      activeRefreshesRef.current.delete(tableId);
    }

    updateTable(tableId, {
      source: {
        ...table.source,
        type: table.source?.type || "url",
        isAutoRefresh: false,
      },
    });
  };

  return {
    refreshTable,
    enableAutoRefresh,
    disableAutoRefresh,
  };
}
