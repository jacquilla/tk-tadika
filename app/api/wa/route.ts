import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/verify-token";

export async function POST(request: Request) {
  const payload = requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { targetHp, pesanCustom } = body;

    // Input validation
    if (!targetHp || typeof targetHp !== "string") {
      return NextResponse.json(
        { error: "targetHp wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    if (!pesanCustom || typeof pesanCustom !== "string") {
      return NextResponse.json(
        { error: "pesanCustom wajib diisi dan harus string" },
        { status: 400 },
      );
    }

    // Validate phone format (basic: only digits and +, max 20 chars)
    if (!/^[\d+\-\s()]+$/.test(targetHp) || targetHp.length > 20) {
      return NextResponse.json(
        { error: "Format nomor HP tidak valid" },
        { status: 400 },
      );
    }

    // Validate message length
    if (pesanCustom.length > 3000) {
      return NextResponse.json(
        { error: "Pesan terlalu panjang (max 3000 karakter)" },
        { status: 400 },
      );
    }

    const TOKEN_FONNTE = process.env.FONNTE_TOKEN || "";

    if (!TOKEN_FONNTE) {
      console.error("[WA] FONNTE_TOKEN belum di-set di environment variables");
      return NextResponse.json(
        { error: "Konfigurasi server bermasalah" },
        { status: 500 },
      );
    }

    const formData = new FormData();
    formData.append("target", targetHp.trim());
    formData.append("message", pesanCustom);

    // Add timeout untuk prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: TOKEN_FONNTE },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();
    if (result.status === true) {
      return NextResponse.json({ success: true, detail: result });
    } else {
      return NextResponse.json(
        { success: false, pesan: result.reason || "Ditolak Fonnte" },
        { status: 400 },
      );
    }
  } catch (error: unknown) {
    console.error("[WA] Error:", error);
    return NextResponse.json(
      { success: false, pesan: "Gagal mengirim pesan" },
      { status: 500 },
    );
  }
}
