/* ============================================================
   API: Data Transform
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { transformData } from "@/lib/data-engine";
import type { DataTable, TransformRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, transform } = body as {
      table: DataTable;
      transform: TransformRequest;
    };

    if (!table || !transform) {
      return NextResponse.json(
        { error: "Missing table or transform data" },
        { status: 400 }
      );
    }

    const result = transformData(table, transform);

    return NextResponse.json({ table: result });
  } catch (error) {
    console.error("Transform error:", error);
    return NextResponse.json(
      { error: "Transformation failed" },
      { status: 500 }
    );
  }
}
