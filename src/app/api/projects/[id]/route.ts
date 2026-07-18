/* ============================================================
   API: Single Project — GET, PUT, DELETE
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProjectModel } from "@/lib/models/project";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userEmail = _req.cookies.get("databi_user")?.value;
    if (!userEmail) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const project = await ProjectModel.findOne({ _id: id, userId: userEmail }).lean();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ...project, _id: project._id.toString() });
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userEmail = req.cookies.get("databi_user")?.value;
    if (!userEmail) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Remove _id from body to avoid MongoDB immutable field error
    const { _id, ...updateData } = body;

    // Use a lightweight update: we only need to confirm the write succeeded.
    // Returning the full document (which can contain thousands of table rows,
    // widgets, sheets, etc.) over the wire is the main source of save latency,
    // so we return a minimal ack instead. The client already holds the project
    // state and only reads `_id` from the response.
    const result = await ProjectModel.updateOne(
      { _id: id, userId: userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, _id: id });
  } catch (error) {
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userEmail = _req.cookies.get("databi_user")?.value;
    if (!userEmail) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const project = await ProjectModel.findOneAndDelete({ _id: id, userId: userEmail });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
