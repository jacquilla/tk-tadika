import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { verifyToken } from "../../lib/verify-token";

export async function POST(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { error } = await supabaseAdmin.from("kehadiran").insert([body]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, ...update } = await request.json();
    const { error } = await supabaseAdmin
      .from("kehadiran")
      .update(update)
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
