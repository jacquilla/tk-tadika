import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { requireAdmin } from "@/app/lib/verify-token";

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("riwayat_spp")
      .select("*, murid(nama)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
