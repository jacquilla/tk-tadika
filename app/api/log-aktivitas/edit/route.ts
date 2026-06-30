import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../lib/supabase-admin";
import { verifyToken } from "@/app/lib/verify-token";

export async function PUT(request: Request) {
  // 1. Verifikasi token
  const payload = verifyToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, deskripsi, metadata, waktuBaru, foto_url } = body;

    if (!id || !deskripsi) {
      return NextResponse.json(
        { error: "ID dan deskripsi wajib diisi" },
        { status: 400 },
      );
    }

    // 2. Ambil log
    const { data: existingLog, error: fetchError } = await supabase
      .from("log_aktivitas")
      .select("*, murid_id, created_at")
      .eq("id", id)
      .single();

    if (fetchError || !existingLog) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Log tidak ditemukan" },
        { status: 404 },
      );
    }

    // 2b. CATATAN: pengecekan kepemilikan log (hanya penulis asli yang boleh
    // edit) BELUM bisa diterapkan di sini karena tabel log_aktivitas belum
    // punya kolom guru_id di skema saat ini. Saat ini SEMUA guru yang login
    // bisa edit log aktivitas murid mana pun, selama masih hari yang sama
    // dan anak belum berstatus pulang (lihat langkah 3 & 4 di bawah).
    //
    // Kalau nanti kolom guru_id ditambahkan ke log_aktivitas (dan endpoint
    // insert log-aktivitas/route.ts diisi guru_id saat create), aktifkan
    // blok ini:
    //
    // if (payload.role !== "admin" && existingLog.guru_id !== payload.guru_id) {
    //   return NextResponse.json(
    //     { error: "Anda tidak berhak mengedit log ini" },
    //     { status: 403 },
    //   );
    // }

    // 3. Validasi hari ini (WITA)
    const now = new Date();
    const logDate = new Date(existingLog.created_at);
    const todayStart = new Date(
      `${now.toISOString().split("T")[0]}T00:00:00+08:00`,
    );
    const todayEnd = new Date(
      `${now.toISOString().split("T")[0]}T23:59:59+08:00`,
    );

    if (logDate < todayStart || logDate > todayEnd) {
      return NextResponse.json(
        { error: "Hanya log hari ini yang dapat diedit" },
        { status: 403 },
      );
    }

    // 4. Cek pulang
    const { data: kehadiran } = await supabase
      .from("kehadiran")
      .select("status_hadir")
      .eq("murid_id", existingLog.murid_id)
      .eq("tanggal", now.toISOString().split("T")[0])
      .maybeSingle();

    if (kehadiran?.status_hadir === "pulang") {
      return NextResponse.json(
        { error: "Anak sudah pulang, edit tidak diizinkan" },
        { status: 403 },
      );
    }

    // 5. Update
    // Catatan: tabel log_aktivitas tidak punya kolom foto_url terpisah.
    // foto_url disimpan sebagai bagian dari metadata (jsonb). Digabung
    // di atas metadata LAMA (existingLog.metadata), supaya field metadata
    // lain yang sudah tersimpan tidak hilang kalau client cuma kirim
    // foto_url tanpa metadata baru.
    const updatePayload: any = { deskripsi };
    if (metadata || foto_url) {
      updatePayload.metadata = {
        ...(existingLog.metadata || {}),
        ...(metadata || {}),
        ...(foto_url ? { foto_url } : {}),
      };
    }
    if (waktuBaru) updatePayload.created_at = waktuBaru;

    const { error: updateError } = await supabase
      .from("log_aktivitas")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        deskripsi,
        metadata: updatePayload.metadata,
        created_at: waktuBaru || existingLog.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error edit log:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
