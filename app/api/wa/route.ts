import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetHp, pesanCustom } = body; // Sekarang kurir menerima pesan utuh

    // Token Fonnte kamu
    const TOKEN_FONNTE = "5vzpjJG47YMsDvgNEcDG";

    const formData = new FormData();
    formData.append("target", String(targetHp));
    formData.append("message", pesanCustom); // Memasukkan pesan rangkuman

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
