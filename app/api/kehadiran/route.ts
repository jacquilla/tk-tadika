import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { requireAuth } from "@/app/lib/verify-token";

/**
 * POST /api/kehadiran — Catat kehadiran murid baru
 * 
 * Body:
 *   - murid_id: string (UUID murid)
 *   - tanggal: string (YYYY-MM-DD)
 *   - status_hadir: "belum" | "hadir" | "pulang"
 *   - waktu_datang: ISO string (optional)
 *   - waktu_pulang: ISO string (optional)
 *   - penjemput: string (optional)
 *   - keterangan_jemput: string (optional)
 * 
 * Auth: JWT token (admin atau guru)
 */
export async function POST(request: Request) {
  const payload = requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Input validation
    if (!body.murid_id || typeof body.murid_id !== "string") {
      return NextResponse.json(
        { error: "murid_id wajib diisi dan harus string" },
        { status: 400 }
      );
    }

    if (!body.tanggal || typeof body.tanggal !== "string") {
      return NextResponse.json(
        { error: "tanggal wajib diisi dan harus string (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (!body.status_hadir || !["belum", "hadir", "pulang"].includes(body.status_hadir)) {
      return NextResponse.json(
        { error: "status_hadir harus 'belum', 'hadir', atau 'pulang'" },
        { status: 400 }
      );
    }

    // Sanitasi: hanya allow field tertentu
    const allowedFields = [
      "murid_id",
      "tanggal",
      "status_hadir",
      "waktu_datang",
      "waktu_pulang",
      "penjemput",
      "keterangan_jemput",
    ];

    const sanitizedBody: any = {};
    for (const field of allowedFields) {
      if (field in body) {
        sanitizedBody[field] = body[field];
      }
    }

    const { error } = await supabaseAdmin
      .from("kehadiran")
      .insert([sanitizedBody]);
    
    if (error) {
      console.error("[KEHADIRAN] Insert error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[KEHADIRAN] POST error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data kehadiran" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/kehadiran — Update kehadiran murid
 * 
 * Body:
 *   - id: string (UUID record kehadiran)
 *   - status_hadir: "belum" | "hadir" | "pulang" (optional)
 *   - waktu_datang: ISO string (optional)
 *   - waktu_pulang: ISO string (optional)
 *   - penjemput: string (optional)
 *   - keterangan_jemput: string (optional)
 * 
 * Auth: JWT token (admin atau guru)
 */
export async function PUT(request: Request) {
  const payload = requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "id wajib diisi dan harus string" },
        { status: 400 }
      );
    }

    // Sanitasi: ekstrak hanya field yang boleh di-update
    const allowedFields = [
      "status_hadir",
      "waktu_datang",
      "waktu_pulang",
      "penjemput",
      "keterangan_jemput",
    ];

    const update: any = {};
    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined) {
        // Validasi enum fields
        if (field === "status_hadir") {
          if (!["belum", "hadir", "pulang"].includes(body[field])) {
            return NextResponse.json(
              { error: "status_hadir harus 'belum', 'hadir', atau 'pulang'" },
              { status: 400 }
            );
          }
        }
        update[field] = body[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada field untuk di-update" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("kehadiran")
      .update(update)
      .eq("id", body.id);

    if (error) {
      console.error("[KEHADIRAN] Update error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[KEHADIRAN] PUT error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate data kehadiran" },
      { status: 500 }
    );
  }
}
