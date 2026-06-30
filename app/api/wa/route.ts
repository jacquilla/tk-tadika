import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/verify-token";

export async function POST(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { targetHp, pesanCustom } = body;

    // CATATAN: token diambil dari env var FONNTE_TOKEN. Skema database
    // punya tabel pengaturan_sekolah dengan kolom token_fonnte yang tidak
    // dipakai di sini -- belum jelas apakah ini sumber yang dimaksud atau
    // memang sengaja terpisah. Perlu dikonfirmasi.
    const TOKEN_FONNTE = process.env.FONNTE_TOKEN || "";

    const formData = new FormData();
    formData.append("target", String(targetHp));
    formData.append("message", pesanCustom);

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
