/* ============================================================
   URL Data Parser — Fetch and parse data from URLs
   Supports CSV, Excel via URL, JSON, and other formats
   ============================================================ */

export interface ParsedUrlData {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: "string" | "number" | "boolean" | "date";
      originalType: string;
    }>;
    rows: Record<string, unknown>[];
    rowCount: number;
  }>;
}

// Supported URL patterns for datasets
const SUPPORTED_PATTERNS = [
  /github\.com\/.*\/raw\//,          // GitHub raw content
  /dropbox\.com/,                     // Dropbox links
  /drive\.google\.com/,               // Google Drive
  /onedrive\.live\.com/,              // OneDrive personal
  /sharepoint\.com/,                  // SharePoint/OneDrive Business
  /\.csv$/i,                          // CSV files
  /\.xlsx?$/i,                        // Excel files
  /\.json$/i,                         // JSON files
  /api\//,                            // Generic API endpoints
];

/**
 * Normalizes OneDrive URLs to downloadable format
 */
export function normalizeOneDriveUrl(url: string): string {
  try {
    // OneDrive personal share link - convert to download
    if (url.includes("onedrive.live.com")) {
      // If it's a share link, modify to download
      if (!url.includes("download=1")) {
        url = url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
      }
      return url;
    }

    // SharePoint/OneDrive Business - convert to download
    if (url.includes("sharepoint.com")) {
      // Add download parameter if not present
      if (!url.includes("download=1")) {
        url = url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
      }
      return url;
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Normalizes Excel Online (Microsoft 365) URLs to downloadable CSV/Excel format
 */
export function normalizeExcelOnlineUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Excel Online sharing links
    if (url.includes("excel.officeapps.live.com") || url.includes("office.com")) {
      // These are web-based editors, not directly downloadable
      // User should export as CSV/Excel from the app or use the download link
      console.warn("Excel Online URL detected. Please export the data as CSV/Excel and use that URL instead.");
      return url;
    }

    // OneDrive/SharePoint Excel files
    if ((url.includes("onedrive.live.com") || url.includes("sharepoint.com")) && 
        (url.endsWith(".xlsx") || url.endsWith(".xls"))) {
      // Add download parameter for Excel files
      if (!url.includes("download=1")) {
        return url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Converts Excel Online export URLs to downloadable format
 * Excel Online export: https://onedrive.live.com/...&export=csv or &export=xlsx
 */
export function handleExcelOnlineExport(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // If it already has an export parameter, add download
    if (urlObj.searchParams.has("export")) {
      if (!urlObj.searchParams.has("download")) {
        urlObj.searchParams.set("download", "1");
      }
      return urlObj.toString();
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Normalizes Microsoft 365 Excel cloud URLs to downloadable format
 * Format: https://excel.cloud.microsoft/open/onedrive/?docId=...&driveId=...
 * 
 * This function attempts to convert Excel cloud edit links to downloadable URLs.
 * If direct download isn't possible, it guides the user to get a shareable link.
 */
export function normalizeExcelCloudUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Check if this is an Excel cloud URL
    if (url.includes("excel.cloud.microsoft") || url.includes("excel.cloud.microsoft/open")) {
      // Extract parameters
      const docId = urlObj.searchParams.get("docId");
      const driveId = urlObj.searchParams.get("driveId");
      
      if (docId && driveId) {
        // Excel cloud URLs with docId/driveId can be converted to OneDrive API URLs
        // The docId format is typically: driveId!itemId
        // We'll construct an OneDrive API download URL
        
        // Try to construct a direct download URL using Microsoft Graph API format
        // This attempts to access the file directly through OneDrive
        const downloadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${docId}?$select=id,name,@microsoft.graph.downloadUrl`;
        
        // Note: This requires proper authentication and may not work for all scenarios
        // Fallback to instructing user to get shareable link
        console.warn(
          "Excel Cloud URL detected. Converting to download format...\n" +
          "If this doesn't work, please:\n" +
          "1. Open the file in Excel Online\n" +
          "2. Click 'Share' → 'Get a link'\n" +
          "3. Copy the shareable link\n" +
          "4. Use that link instead"
        );
        
        return downloadUrl;
      }
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Validates if a URL is a valid dataset URL
 */
export function isValidDatasetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Check if URL is valid and uses http/https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    // Check if it matches known dataset sources
    const hostname = parsed.hostname;
    if (!hostname) return false;

    // Allow GitHub raw, Dropbox, Google Drive, OneDrive, SharePoint, APIs, or direct file URLs
    const isKnownSource = 
      hostname.includes("github.com") ||
      hostname.includes("dropbox.com") ||
      hostname.includes("drive.google.com") ||
      hostname.includes("googleapis.com") ||
      hostname.includes("onedrive.live.com") ||
      hostname.includes("sharepoint.com") ||
      hostname.includes("office.com") ||
      hostname.includes("excel.cloud.microsoft") ||
      url.toLowerCase().endsWith(".csv") ||
      url.toLowerCase().endsWith(".xlsx") ||
      url.toLowerCase().endsWith(".xls") ||
      url.toLowerCase().endsWith(".json") ||
      url.includes("/api/");

    return isKnownSource;
  } catch {
    return false;
  }
}

/**
 * Detects content type from URL or response headers
 */
export function detectContentType(
  url: string,
  contentTypeHeader?: string
): "csv" | "excel" | "json" | "unknown" {
  const lowercaseUrl = url.toLowerCase();

  if (contentTypeHeader) {
    if (contentTypeHeader.includes("csv")) return "csv";
    if (contentTypeHeader.includes("spreadsheet") || contentTypeHeader.includes("excel")) {
      return "excel";
    }
    if (contentTypeHeader.includes("json")) return "json";
  }

  if (lowercaseUrl.endsWith(".csv")) return "csv";
  if (lowercaseUrl.endsWith(".xlsx") || lowercaseUrl.endsWith(".xls")) return "excel";
  if (lowercaseUrl.endsWith(".json")) return "json";

  return "unknown";
}

/**
 * Fetches data from a URL with proper error handling
 */
export async function fetchDataFromUrl(url: string): Promise<Buffer> {
  try {
    // Normalize URLs for OneDrive/SharePoint/Excel Online/Excel Cloud
    let normalizedUrl = url;
    
    if (url.includes("onedrive.live.com") || url.includes("sharepoint.com")) {
      normalizedUrl = normalizeOneDriveUrl(url);
    }
    
    if (url.includes("excel.officeapps.live.com") || url.includes("office.com")) {
      normalizedUrl = normalizeExcelOnlineUrl(url);
    }

    if (url.includes("excel.cloud.microsoft")) {
      normalizedUrl = normalizeExcelCloudUrl(url);
    }

    // Add timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds

    const response = await fetch(normalizedUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check file size (limit to 50MB)
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      throw new Error("File size exceeds 50MB limit");
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
    throw new Error("Failed to fetch URL: Unknown error");
  }
}

/**
 * Parses CSV data from buffer
 */
export function parseCsvBuffer(buffer: Buffer, name: string) {
  const XLSX = require("xlsx");
  
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    firstSheet,
    { defval: null }
  );

  if (jsonData.length === 0) {
    throw new Error("CSV file is empty");
  }

  return {
    name,
    columns: buildColumns(jsonData),
    rows: jsonData,
    rowCount: jsonData.length,
  };
}

/**
 * Parses Excel data from buffer
 */
export function parseExcelBuffer(buffer: Buffer, url: string) {
  const XLSX = require("xlsx");
  
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const tables = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      worksheet,
      { defval: null }
    );

    if (jsonData.length === 0) continue;

    tables.push({
      name: sheetName,
      columns: buildColumns(jsonData),
      rows: jsonData,
      rowCount: jsonData.length,
    });
  }

  if (tables.length === 0) {
    throw new Error("No valid sheets found in Excel file");
  }

  return tables;
}

/**
 * Parses JSON data from buffer
 */
export function parseJsonBuffer(buffer: Buffer, name: string) {
  try {
    const jsonString = buffer.toString("utf-8");
    const data = JSON.parse(jsonString);

    // Handle different JSON structures
    let rows: Record<string, unknown>[] = [];

    if (Array.isArray(data)) {
      rows = data;
    } else if (data && typeof data === "object") {
      // Try common structures
      if (Array.isArray(data.data)) {
        rows = data.data;
      } else if (Array.isArray(data.records)) {
        rows = data.records;
      } else if (Array.isArray(data.rows)) {
        rows = data.rows;
      } else {
        // Single object, wrap in array
        rows = [data];
      }
    }

    if (rows.length === 0) {
      throw new Error("JSON contains no data rows");
    }

    return {
      name,
      columns: buildColumns(rows),
      rows,
      rowCount: rows.length,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
    throw new Error("Failed to parse JSON: Invalid format");
  }
}

/**
 * Builds column schema from data
 */
export function buildColumns(
  data: Record<string, unknown>[]
): Array<{
  name: string;
  type: "string" | "number" | "boolean" | "date";
  originalType: string;
}> {
  if (data.length === 0) return [];

  const keys = Object.keys(data[0]);

  return keys.map((key) => {
    const values = data.map((row) => row[key]);
    const detectedType = detectColumnType(values);

    return {
      name: key,
      type: detectedType,
      originalType: typeof data[0][key],
    };
  });
}

/**
 * Detects column data type from values
 */
export function detectColumnType(
  values: unknown[]
): "string" | "number" | "boolean" | "date" {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);

  if (nonNullValues.length === 0) return "string";

  // Check for booleans
  if (
    nonNullValues.every(
      (v) => v === true || v === false || typeof v === "boolean"
    )
  ) {
    return "boolean";
  }

  // Check for numbers
  if (nonNullValues.every((v) => typeof v === "number" || !isNaN(Number(v)))) {
    return "number";
  }

  // Check for dates
  if (
    nonNullValues.every((v) => {
      if (v instanceof Date) return true;
      if (typeof v === "string") {
        const parsed = new Date(v);
        return !isNaN(parsed.getTime());
      }
      return false;
    })
  ) {
    return "date";
  }

  return "string";
}
