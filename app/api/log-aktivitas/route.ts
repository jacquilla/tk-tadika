import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { verifyToken } from "../../lib/verify-token";

export async function POST(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { error } = await supabaseAdmin.from("log_aktivitas").insert([body]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
