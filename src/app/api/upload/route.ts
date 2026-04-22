/* ============================================================
   API: File Upload — Parse Excel (.xlsx) and CSV
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { detectColumnType } from "@/lib/utils";
import type { DataTable, ColumnSchema } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    let tables: DataTable[] = [];

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      tables = parseExcel(buffer, file.name);
    } else if (fileName.endsWith(".csv")) {
      tables = [parseCsv(buffer, file.name)];
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload .xlsx, .xls, or .csv" },
        { status: 400 }
      );
    }

    return NextResponse.json({ tables });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to parse file" },
      { status: 500 }
    );
  }
}

function parseExcel(buffer: Buffer, fileName: string): DataTable[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const tables: DataTable[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      worksheet,
      { defval: null }
    );

    if (jsonData.length === 0) continue;

    const columns = buildColumns(jsonData);

    tables.push({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: sheetName || fileName.replace(/\.[^/.]+$/, ""),
      columns,
      rows: jsonData,
      rowCount: jsonData.length,
    });
  }

  return tables;
}

function parseCsv(buffer: Buffer, fileName: string): DataTable {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    firstSheet,
    { defval: null }
  );

  const columns = buildColumns(jsonData);

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: fileName.replace(/\.[^/.]+$/, ""),
    columns,
    rows: jsonData,
    rowCount: jsonData.length,
  };
}

function buildColumns(data: Record<string, unknown>[]): ColumnSchema[] {
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
