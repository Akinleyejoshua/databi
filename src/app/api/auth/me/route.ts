/* ============================================================
   API: Auth — Get current user from cookie
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("databi_user")?.value;

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await connectDB();
    const user = await UserModel.findById(userId).lean();

    if (!user) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete("databi_user");
      return response;
    }

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
