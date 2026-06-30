import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { requireAdmin } from "@/app/lib/verify-token";

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { error } = await supabaseAdmin.from("log_admin").insert([body]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
