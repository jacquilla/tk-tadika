import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetHp, pesanCustom } = body;

    // 1. Validasi Data
    if (!targetHp || !pesanCustom) {
      return NextResponse.json(
        { error: "Nomor HP dan Pesan wajib diisi" },
        { status: 400 },
      );
    }

    // 2. Ambil Token Rahasia Fonnte
    const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

    if (!FONNTE_TOKEN) {
      console.error("Token Fonnte belum dipasang di .env");
      return NextResponse.json(
        { error: "Token Fonnte belum dikonfigurasi" },
        { status: 500 },
      );
    }

    // 3. Tembak API ke Server Fonnte
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: targetHp,
        message: pesanCustom,
        delay: "2", // Jeda 2 detik agar tidak dianggap spam oleh WA
      }),
    });

    const data = await response.json();

    // 4. Cek Hasilnya
    if (data.status) {
      return NextResponse.json({
        success: true,
        message: "WA Berhasil Terkirim!",
        data,
      });
    } else {
      console.error("Fonnte Error:", data.reason);
      return NextResponse.json(
        { success: false, error: data.reason },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error Server API WA:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 },
    );
  }
}
