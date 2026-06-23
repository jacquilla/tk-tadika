// File: app/api/cron-spp/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gunakan SERVICE_ROLE_KEY untuk bypass RLS (karena cron berjalan di background tanpa user login)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Pastikan key ini ada di .env Anda
);

export async function POST(request: Request) {
  try {
    // PROTEKSI API: Pastikan hanya admin atau cron job yang bisa memanggil ini
    // (Bisa tambahkan pengecekan Authorization Header di sini nanti)

    // 1. Reset semua murid menjadi MENUNGGAK di awal bulan
    // Jika Anda punya skema yang lebih kompleks (seperti kolom bulan_dibayar), filternya ditaruh di sini.
    const { error } = await supabase
      .from("murid")
      .update({ status_spp: "MENUNGGAK" })
      .neq("id", "0"); // Dummy condition agar Supabase mau update seluruh baris

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "SPP berhasil direset massal",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
