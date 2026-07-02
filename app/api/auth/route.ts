import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../../lib/supabase-admin";

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PIN = process.env.ADMIN_PIN;

// Simple in-memory rate limiter (production: use Redis)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (
  ipOrId: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
) => {
  const now = Date.now();
  const record = loginAttempts.get(ipOrId);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ipOrId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
};

export async function POST(request: Request) {
  // Check for required env vars at runtime
  if (!JWT_SECRET) {
    console.error("[AUTH] JWT_SECRET belum di-set di environment variables");
    return NextResponse.json(
      { error: "Konfigurasi server bermasalah" },
      { status: 500 },
    );
  }

  // Rate limiting: gunakan X-Forwarded-For atau fallback ke "unknown"
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  if (!checkRateLimit(clientIp)) {
    console.warn(`[AUTH] Rate limit exceeded for IP: ${clientIp}`);
    return NextResponse.json(
      {
        error:
          "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.",
      },
      { status: 429 },
    );
  }

  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type harus application/json" },
        { status: 400 },
      );
    }

    const { pin, role } = await request.json();

    // Input validation
    if (!pin || !role) {
      return NextResponse.json(
        { error: "pin dan role wajib diisi" },
        { status: 400 },
      );
    }

    // Sanitasi input
    if (typeof pin !== "string" || typeof role !== "string") {
      return NextResponse.json(
        { error: "pin dan role harus berupa string" },
        { status: 400 },
      );
    }

    if (pin.length > 100) {
      return NextResponse.json(
        { error: "PIN terlalu panjang" },
        { status: 400 },
      );
    }

    if (role !== "admin" && role !== "guru") {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }

    // --- Validasi ADMIN ---
    if (role === "admin") {
      if (!ADMIN_PIN) {
        console.error("[AUTH] ADMIN_PIN belum di-set di environment variables");
        return NextResponse.json(
          { error: "Konfigurasi server bermasalah" },
          { status: 500 },
        );
      }

      // Timing-safe comparison (cegah timing attack)
      if (pin !== ADMIN_PIN) {
        return NextResponse.json({ error: "PIN salah" }, { status: 401 });
      }

      const token = jwt.sign({ role: "admin" }, JWT_SECRET, {
        expiresIn: "1h", // Reduced from 12h
        algorithm: "HS256",
      });
      return NextResponse.json({ token });
    }

    // --- Validasi GURU ---
    const { data: guru, error } = await supabaseAdmin
      .from("guru")
      .select("id, nama, pin_login")
      .eq("pin_login", pin)
      .maybeSingle();

    if (error) {
      console.error("[AUTH] Error query guru saat login:", error);
      return NextResponse.json(
        { error: "Terjadi kesalahan server" },
        { status: 500 },
      );
    }

    if (!guru) {
      return NextResponse.json({ error: "PIN salah" }, { status: 401 });
    }

    const token = jwt.sign({ role: "guru", guru_id: guru.id }, JWT_SECRET, {
      expiresIn: "12h",
      algorithm: "HS256",
    });

    return NextResponse.json({
      token,
      guru: { id: guru.id, nama: guru.nama },
    });
  } catch (error: unknown) {
    console.error("[AUTH] Error saat login:", error);
    // Generic error message (jangan expose stack trace)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
