/* ============================================================
   API: URL Data Import — Fetch and parse data from URLs
   Supports CSV, Excel, JSON formats
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import type { DataTable, ColumnSchema } from "@/types";
import {
  isValidDatasetUrl,
  detectContentType,
  fetchDataFromUrl,
  parseCsvBuffer,
  parseExcelBuffer,
  parseJsonBuffer,
  buildColumns,
} from "@/lib/url-data-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, refreshInterval = 3600000, isAutoRefresh = false } = body;

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Validate URL format
    if (!isValidDatasetUrl(url)) {
      return NextResponse.json(
        { error: "Invalid or unsupported dataset URL. Supported: GitHub raw, Dropbox, Google Drive, OneDrive, SharePoint, Excel Online, direct CSV/Excel/JSON files, or API endpoints" },
        { status: 400 }
      );
    }

    // Fetch data from URL
    const buffer = await fetchDataFromUrl(url);

    // Detect content type
    const contentType = detectContentType(url);

    let tables: DataTable[] = [];

    // Parse based on content type
    if (contentType === "csv") {
      const table = parseCsvBuffer(buffer, extractNameFromUrl(url));
      tables = [
        {
          ...table,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          source: {
            type: "url",
            url,
            refreshInterval,
            isAutoRefresh,
            lastRefreshed: new Date().toISOString(),
          },
        },
      ];
    } else if (contentType === "excel") {
      const parsedTables = parseExcelBuffer(buffer, url);
      tables = parsedTables.map((table) => ({
        ...table,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        source: {
          type: "url",
          url,
          refreshInterval,
          isAutoRefresh,
          lastRefreshed: new Date().toISOString(),
        },
      }));
    } else if (contentType === "json") {
      const table = parseJsonBuffer(buffer, extractNameFromUrl(url));
      tables = [
        {
          ...table,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          source: {
            type: "url",
            url,
            refreshInterval,
            isAutoRefresh,
            lastRefreshed: new Date().toISOString(),
          },
        },
      ];
    } else {
      // Try to parse as CSV by default
      try {
        const table = parseCsvBuffer(buffer, extractNameFromUrl(url));
        tables = [
          {
            ...table,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            source: {
              type: "url",
              url,
              refreshInterval,
              isAutoRefresh,
              lastRefreshed: new Date().toISOString(),
            },
          },
        ];
      } catch {
        // Try JSON as fallback
        try {
          const table = parseJsonBuffer(buffer, extractNameFromUrl(url));
          tables = [
            {
              ...table,
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              source: {
                type: "url",
                url,
                refreshInterval,
                isAutoRefresh,
                lastRefreshed: new Date().toISOString(),
              },
            },
          ];
        } catch {
          return NextResponse.json(
            { error: "Unable to parse data from URL. Ensure it contains valid CSV, Excel, or JSON data." },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({ tables });
  } catch (error) {
    console.error("URL import error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to import data from URL" },
      { status: 500 }
    );
  }
}

/**
 * Extracts a readable name from a URL
 */
function extractNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf("/") + 1);

    if (filename) {
      // Remove file extensions
      return filename.replace(/\.[^/.]+$/, "");
    }

    return urlObj.hostname || "Imported Data";
  } catch {
    return "Imported Data";
  }
}
