import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../lib/supabase-admin";
import { verifyToken } from "@/app/lib/verify-token";

export async function PUT(request: Request) {
  // 1. Verifikasi token
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, deskripsi, metadata, waktuBaru, foto_url } = body;

    console.log("Request body:", body);

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
    const updatePayload: any = { deskripsi };
    if (metadata) updatePayload.metadata = metadata;
    if (waktuBaru) updatePayload.created_at = waktuBaru;

    console.log("Updating log ID:", id, "Payload:", updatePayload);

    const { error: updateError } = await supabase
      .from("log_aktivitas")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    console.log("Update success");

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
