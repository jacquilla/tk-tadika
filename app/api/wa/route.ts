import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Tambahkan variabel penangkap url gambar dari frontend (jika ada)
    const { targetHp, pesanCustom, urlGambar } = body;

    // Mengambil token dari file .env.local Anda
    const TOKEN_FONNTE = process.env.FONNTE_TOKEN || "";

    const formData = new FormData();
    formData.append("target", String(targetHp));
    formData.append("message", pesanCustom);

    // Jika frontend mengirimkan link gambar (hasil upload Drive), tambahkan ke Fonnte
    if (urlGambar) {
      formData.append("url", urlGambar);
    }

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: TOKEN_FONNTE },
      body: formData,
    });

    const result = await response.json();

    if (result.status === true) {
      return NextResponse.json({ success: true, detail: result });
    } else {
      return NextResponse.json(
        { success: false, pesan: result.reason || "Ditolak Fonnte" },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, pesan: "Server Error" },
      { status: 500 },
    );
  }
}
