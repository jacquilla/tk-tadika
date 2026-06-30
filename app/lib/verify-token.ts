import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export type TokenPayload = {
  role: "admin" | "guru";
  guru_id?: string;
};

/**
 * Verifikasi token dari header Authorization.
 * Mengembalikan payload kalau valid, atau null kalau tidak valid/tidak ada.
 *
 * Catatan: ini sengaja TIDAK lagi mengembalikan boolean seperti versi lama,
 * karena route butuh tahu role & guru_id untuk cek otorisasi, bukan cuma
 * "apakah token valid".
 */
export function verifyToken(request: Request): TokenPayload | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (decoded.role !== "admin" && decoded.role !== "guru") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Helper untuk route yang HARUS admin (delete guru/murid, log_admin, dll).
 * Pakai ini kalau cuma admin yang boleh akses, guru ditolak.
 */
export function requireAdmin(request: Request): TokenPayload | null {
  const payload = verifyToken(request);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}
