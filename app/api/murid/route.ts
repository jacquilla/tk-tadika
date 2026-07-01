import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { requireAdmin } from "@/app/lib/verify-token";

// Whitelist field yang boleh di-insert untuk murid
const ALLOWED_MURID_FIELDS = [
  "nama",
  "kelas",
  "nomor_hp_ortu",
  "foto_url",
  "status_spp",
  "tahun_ajaran",
];

const MAX_NAMA_LENGTH = 100;
const MAX_KELAS_LENGTH = 20;
const VALID_KELAS = ["mawar", "melati"];
const VALID_STATUS_SPP = ["lunas", "menunggak"];

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // ===== VALIDASI INPUT =====
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

    if (!body.kelas || typeof body.kelas !== "string") {
      return NextResponse.json(
        { error: "kelas wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    if (!VALID_KELAS.includes(body.kelas.toLowerCase())) {
      return NextResponse.json(
        { error: `kelas harus salah satu dari: ${VALID_KELAS.join(", ")}` },
        { status: 400 },
      );
    }

    if (body.nomor_hp_ortu && typeof body.nomor_hp_ortu !== "string") {
      return NextResponse.json(
        { error: "nomor_hp_ortu harus berupa string" },
        { status: 400 },
      );
    }

    // Validasi format nomor HP (basic)
    if (
      body.nomor_hp_ortu &&
      !/^[\d+\-\s()]+$/.test(body.nomor_hp_ortu.trim())
    ) {
      return NextResponse.json(
        { error: "Format nomor HP tidak valid" },
        { status: 400 },
      );
    }

    if (body.status_spp && !VALID_STATUS_SPP.includes(body.status_spp)) {
      return NextResponse.json(
        {
          error: `status_spp harus salah satu dari: ${VALID_STATUS_SPP.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // ===== SANITASI =====
    const sanitizedBody: any = {};
    for (const field of ALLOWED_MURID_FIELDS) {
      if (field in body) {
        if (field === "nama") {
          sanitizedBody[field] = body[field].trim();
        } else if (field === "kelas") {
          sanitizedBody[field] = body[field].toLowerCase().trim();
        } else if (field === "nomor_hp_ortu") {
          sanitizedBody[field] = body[field].trim();
        } else {
          sanitizedBody[field] = body[field];
        }
      }
    }

    const { error } = await supabaseAdmin.from("murid").insert([sanitizedBody]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MURID] POST error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data murid" },
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

    // ===== VALIDASI =====
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "id wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    // Sanitasi: hanya allow field tertentu
    const sanitizedUpdate: any = {};
    for (const field of ALLOWED_MURID_FIELDS) {
      if (field in update) {
        if (field === "nama") {
          sanitizedUpdate[field] = update[field].trim();
        } else if (field === "kelas") {
          if (!VALID_KELAS.includes(update[field].toLowerCase())) {
            return NextResponse.json(
              { error: `kelas tidak valid` },
              { status: 400 },
            );
          }
          sanitizedUpdate[field] = update[field].toLowerCase().trim();
        } else if (field === "status_spp") {
          if (!VALID_STATUS_SPP.includes(update[field])) {
            return NextResponse.json(
              { error: `status_spp tidak valid` },
              { status: 400 },
            );
          }
          sanitizedUpdate[field] = update[field];
        } else {
          sanitizedUpdate[field] = update[field];
        }
      }
    }

    if (Object.keys(sanitizedUpdate).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada field untuk di-update" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("murid")
      .update(sanitizedUpdate)
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MURID] PUT error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate data murid" },
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

    const { error } = await supabaseAdmin.from("murid").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MURID] DELETE error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data murid" },
      { status: 500 },
    );
  }
}
