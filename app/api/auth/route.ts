import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../../lib/supabase-admin";

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PIN = process.env.ADMIN_PIN;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET belum di-set di environment variables");
}

export async function POST(request: Request) {
  try {
    const { pin, role } = await request.json();

    if (!pin || !role) {
      return NextResponse.json(
        { error: "pin dan role wajib diisi" },
        { status: 400 },
      );
    }

    if (role !== "admin" && role !== "guru") {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }

    // --- Validasi ADMIN ---
    if (role === "admin") {
      if (!ADMIN_PIN) {
        // Jangan biarkan ini diam-diam lolos kalau env var lupa di-set.
        console.error("ADMIN_PIN belum di-set di environment variables");
        return NextResponse.json(
          { error: "Konfigurasi server bermasalah" },
          { status: 500 },
        );
      }

      if (pin !== ADMIN_PIN) {
        return NextResponse.json({ error: "PIN salah" }, { status: 401 });
      }

      const token = jwt.sign({ role: "admin" }, JWT_SECRET, {
        expiresIn: "12h",
      });
      return NextResponse.json({ token });
    }

    // --- Validasi GURU ---
    // Cocokkan PIN ke tabel guru di Supabase (kolom pin_login).
    const { data: guru, error } = await supabaseAdmin
      .from("guru")
      .select("id, nama, pin_login")
      .eq("pin_login", pin)
      .maybeSingle();

    if (error) {
      console.error("Error query guru saat login:", error);
      return NextResponse.json(
        { error: "Terjadi kesalahan server" },
        { status: 500 },
      );
    }

    if (!guru) {
      return NextResponse.json({ error: "PIN salah" }, { status: 401 });
    }

    // guru_id dimasukkan ke token supaya endpoint lain bisa tahu
    // siapa yang request, bukan cuma "valid token apa saja".
    const token = jwt.sign({ role: "guru", guru_id: guru.id }, JWT_SECRET, {
      expiresIn: "12h",
    });

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("Error saat login:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
