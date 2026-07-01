import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { verifyToken } from "@/app/lib/verify-token";

// Whitelist field yang boleh di-insert
const ALLOWED_LOG_FIELDS = ["murid_id", "deskripsi", "kategori", "metadata"];

const MAX_DESKRIPSI_LENGTH = 2000;
const MAX_KATEGORI_LENGTH = 50;
const VALID_CATEGORIES = [
  "Umum",
  "Kehadiran",
  "DailySheet",
  "Kegiatan",
  "Catatan",
];

export async function POST(request: Request) {
  const payload = verifyToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // ===== VALIDASI INPUT =====
    // 1. Validasi murid_id
    if (!body.murid_id || typeof body.murid_id !== "string") {
      return NextResponse.json(
        { error: "murid_id wajib diisi dan harus string (UUID)" },
        { status: 400 },
      );
    }

    // UUID format check (basic)
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        body.murid_id,
      )
    ) {
      return NextResponse.json(
        { error: "murid_id format tidak valid (bukan UUID)" },
        { status: 400 },
      );
    }

    // 2. Validasi deskripsi
    if (!body.deskripsi || typeof body.deskripsi !== "string") {
      return NextResponse.json(
        { error: "deskripsi wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    if (body.deskripsi.length > MAX_DESKRIPSI_LENGTH) {
      return NextResponse.json(
        {
          error: `deskripsi terlalu panjang (max ${MAX_DESKRIPSI_LENGTH} karakter)`,
        },
        { status: 400 },
      );
    }

    // 3. Validasi kategori (optional, tapi harus valid jika ada)
    let kategori = body.kategori || "Umum";
    if (typeof kategori !== "string") {
      return NextResponse.json(
        { error: "kategori harus berupa string" },
        { status: 400 },
      );
    }

    if (kategori.length > MAX_KATEGORI_LENGTH) {
      return NextResponse.json(
        { error: `kategori terlalu panjang (max ${MAX_KATEGORI_LENGTH})` },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.includes(kategori)) {
      return NextResponse.json(
        {
          error: `kategori tidak valid. Gunakan: ${VALID_CATEGORIES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // 4. Validasi metadata (optional, harus object jika ada)
    let metadata = body.metadata || {};
    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      return NextResponse.json(
        { error: "metadata harus berupa object" },
        { status: 400 },
      );
    }

    // Limit metadata size (5KB)
    const metadataSize = JSON.stringify(metadata).length;
    if (metadataSize > 5 * 1024) {
      return NextResponse.json(
        { error: "metadata terlalu besar (max 5KB)" },
        { status: 400 },
      );
    }

    // ===== SANITASI & INSERT =====
    const sanitizedBody = {
      murid_id: body.murid_id.trim(),
      deskripsi: body.deskripsi.trim(),
      kategori,
      metadata,
      guru_id: payload.guru_id || null, // Track siapa yang membuat (untuk future authorization)
    };

    const { error } = await supabaseAdmin
      .from("log_aktivitas")
      .insert([sanitizedBody]);

    if (error) {
      console.error("[LOG_AKTIVITAS] Insert error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[LOG_AKTIVITAS] POST error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan log aktivitas" },
      { status: 500 },
    );
  }
}
