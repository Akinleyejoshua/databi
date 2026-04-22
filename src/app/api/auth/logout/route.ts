/* ============================================================
   API: Auth — Logout (clear cookie)
   ============================================================ */

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("databi_user");
  return response;
}
