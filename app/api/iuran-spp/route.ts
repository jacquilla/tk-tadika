import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { requireAdmin } from "@/app/lib/verify-token";

// Whitelist field untuk iuran_spp
const ALLOWED_SPP_FIELDS = ["murid_id", "tahun", "bulan", "jumlah", "status"];
const VALID_BULAN = Array.from({ length: 12 }, (_, i) => i + 1);
const VALID_STATUS_SPP = ["lunas", "menunggak"];
const MAX_JUMLAH = 999999999;

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // ===== VALIDASI =====
    if (!body.murid_id || typeof body.murid_id !== "string") {
      return NextResponse.json(
        { error: "murid_id wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    if (!body.tahun || !Number.isInteger(body.tahun) || body.tahun < 2020) {
      return NextResponse.json(
        { error: "tahun wajib diisi dan harus angka >= 2020" },
        { status: 400 },
      );
    }

    if (!VALID_BULAN.includes(body.bulan)) {
      return NextResponse.json(
        { error: "bulan harus antara 1-12" },
        { status: 400 },
      );
    }

    if (body.jumlah && (!Number.isInteger(body.jumlah) || body.jumlah < 0)) {
      return NextResponse.json(
        { error: "jumlah harus angka positif" },
        { status: 400 },
      );
    }

    if (body.jumlah > MAX_JUMLAH) {
      return NextResponse.json(
        { error: `jumlah terlalu besar (max ${MAX_JUMLAH})` },
        { status: 400 },
      );
    }

    if (body.status && !VALID_STATUS_SPP.includes(body.status)) {
      return NextResponse.json(
        {
          error: `status harus salah satu dari: ${VALID_STATUS_SPP.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // ===== SANITASI =====
    const sanitizedBody: any = {};
    for (const field of ALLOWED_SPP_FIELDS) {
      if (field in body) {
        sanitizedBody[field] = body[field];
      }
    }

    const { error } = await supabaseAdmin
      .from("iuran_spp")
      .upsert([sanitizedBody]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[IURAN_SPP] POST error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data iuran SPP" },
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
    const { murid_id, tahun, bulan } = body;

    if (!murid_id || !tahun || !bulan) {
      return NextResponse.json(
        { error: "murid_id, tahun, dan bulan wajib diisi" },
        { status: 400 },
      );
    }

    if (!VALID_BULAN.includes(bulan)) {
      return NextResponse.json(
        { error: "bulan harus antara 1-12" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("iuran_spp")
      .delete()
      .eq("murid_id", murid_id)
      .eq("tahun", tahun)
      .eq("bulan", bulan);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[IURAN_SPP] DELETE error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data iuran SPP" },
      { status: 500 },
    );
  }
}
