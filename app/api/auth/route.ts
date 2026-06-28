import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-tk-tadika-2024"; // ganti dengan secret aman

export async function POST(request: Request) {
  try {
    const { pin, role } = await request.json(); // role: "guru" atau "admin"

    // Di sini kita anggap PIN sudah diverifikasi di frontend (untuk guru via Supabase, untuk admin via env)
    // Kita hanya perlu membuat token
    const token = jwt.sign({ role, pin }, JWT_SECRET, { expiresIn: "12h" });

    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
