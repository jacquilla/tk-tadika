import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { verifyToken } from "@/app/lib/verify-token";

export async function POST(request: Request) {
  // Verifikasi token JWT
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { guru_id } = body;

    if (!guru_id) {
      return NextResponse.json(
        { error: "guru_id wajib diisi" },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Cek apakah sudah hadir hari ini
    const { data: existing } = await supabaseAdmin
      .from("kehadiran_guru")
      .select("id")
      .eq("guru_id", guru_id)
      .eq("tanggal", today)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        message: "Sudah tercatat hadir",
        already_present: true,
      });
    }

    // Insert kehadiran baru
    const { error } = await supabaseAdmin
      .from("kehadiran_guru")
      .insert({ guru_id, tanggal: today });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error catat kehadiran guru:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
