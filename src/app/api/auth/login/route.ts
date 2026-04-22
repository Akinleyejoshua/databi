/* ============================================================
   API: Auth — Email-only login (find or create user)
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Find or create user atomically to prevent duplicates
    // This ensures that if the user exists, we log them in; otherwise, we create a new account.
    const user = await UserModel.findOneAndUpdate(
      { email: normalizedEmail },
      { 
        $setOnInsert: { 
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0] 
        } 
      },
      { upsert: true, new: true, lean: true }
    );

    if (!user) {
      throw new Error("Failed to find or create user");
    }

    const response = NextResponse.json({
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // Set a simple cookie for session (storing email for environment portability)
    response.cookies.set("databi_user", normalizedEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
