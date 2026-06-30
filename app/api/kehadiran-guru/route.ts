import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { verifyToken } from "@/app/lib/verify-token";

export async function POST(request: Request) {
  const payload = verifyToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Guru cuma boleh catat kehadiran untuk dirinya sendiri (ambil dari
    // token, bukan dari body, supaya guru A tidak bisa absen atas nama
    // guru B). Admin boleh isi guru_id manual, misal saat guru lupa absen
    // sendiri.
    const guru_id = payload.role === "admin" ? body.guru_id : payload.guru_id;

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
