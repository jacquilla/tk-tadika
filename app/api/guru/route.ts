import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { requireAdmin } from "@/app/lib/verify-token";

// Whitelist field untuk guru
const ALLOWED_GURU_FIELDS = ["nama", "pin_login"];
const MAX_NAMA_LENGTH = 100;
const PIN_LENGTH = 4; // Asumsikan PIN 4 digit

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // ===== VALIDASI =====
    if (!body.nama || typeof body.nama !== "string") {
      return NextResponse.json(
        { error: "nama wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    if (body.nama.length > MAX_NAMA_LENGTH) {
      return NextResponse.json(
        { error: `nama terlalu panjang (max ${MAX_NAMA_LENGTH} karakter)` },
        { status: 400 },
      );
    }

    if (!body.pin_login || typeof body.pin_login !== "string") {
      return NextResponse.json(
        { error: "pin_login wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    // Validasi PIN format (hanya angka, panjang sesuai)
    if (!/^\d+$/.test(body.pin_login) || body.pin_login.length !== PIN_LENGTH) {
      return NextResponse.json(
        { error: `pin_login harus ${PIN_LENGTH} digit angka` },
        { status: 400 },
      );
    }

    // ===== SANITASI =====
    const sanitizedBody: any = {};
    for (const field of ALLOWED_GURU_FIELDS) {
      if (field in body) {
        sanitizedBody[field] =
          field === "nama" ? body[field].trim() : body[field];
      }
    }

    const { error } = await supabaseAdmin.from("guru").insert([sanitizedBody]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[GURU] POST error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data guru" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...update } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "id wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    // Sanitasi: hanya allow field tertentu
    const sanitizedUpdate: any = {};
    for (const field of ALLOWED_GURU_FIELDS) {
      if (field in update) {
        if (field === "pin_login") {
          if (
            !/^\d+$/.test(update[field]) ||
            update[field].length !== PIN_LENGTH
          ) {
            return NextResponse.json(
              { error: `pin_login harus ${PIN_LENGTH} digit angka` },
              { status: 400 },
            );
          }
        }
        sanitizedUpdate[field] =
          field === "nama" ? update[field].trim() : update[field];
      }
    }

    if (Object.keys(sanitizedUpdate).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada field untuk di-update" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("guru")
      .update(sanitizedUpdate)
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[GURU] PUT error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate data guru" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "id wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.from("guru").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[GURU] DELETE error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data guru" },
      { status: 500 },
    );
  }
}
