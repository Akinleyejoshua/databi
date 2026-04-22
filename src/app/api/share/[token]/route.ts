/* ============================================================
   API: Share — Generate & Retrieve shared projects
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProjectModel } from "@/lib/models/project";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;
    const project = await ProjectModel.findOne({ shareToken: token }).lean();

    if (!project) {
      return NextResponse.json(
        { error: "Shared project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...project,
      _id: project._id.toString(),
    });
  } catch (error) {
    console.error("GET /api/share/[token] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared project" },
      { status: 500 }
    );
  }
}
