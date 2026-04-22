/* ============================================================
   API: Projects — GET all (by user), POST create
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProjectModel } from "@/lib/models/project";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = req.cookies.get("databi_user")?.value;

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const projects = await ProjectModel.find({ userId })
      .select("name description createdAt updatedAt shareToken")
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = projects.map((p) => ({
      ...p,
      _id: p._id.toString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const userId = req.cookies.get("databi_user")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const project = await ProjectModel.create({
      name: body.name || "Untitled Project",
      description: body.description || "",
      userId,
      tables: body.tables || [],
      relationships: body.relationships || [],
      measures: body.measures || [],
      widgets: body.widgets || [],
      canvasSettings: body.canvasSettings || {
        backgroundColor: "#ffffff",
        width: 1200,
        cols: 24,
        rowHeight: 30,
      },
      filters: body.filters || {},
    });

    return NextResponse.json(project.toJSON(), { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
