import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export type TokenPayload = {
  role: "admin" | "guru";
  guru_id?: string;
};

/**
 * Verifikasi token dari header Authorization.
 * Mengembalikan payload kalau valid, atau null kalau tidak valid/tidak ada.
 *
 * PENTING: Pastikan JWT_SECRET sudah di-set sebelum route di-load.
 */
export function verifyToken(request: Request): TokenPayload | null {
  if (!JWT_SECRET) {
    console.error("[VERIFY_TOKEN] JWT_SECRET belum di-set!");
    return null;
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Validasi role
    if (decoded.role !== "admin" && decoded.role !== "guru") {
      return null;
    }

    // Validasi guru_id jika role adalah guru
    if (decoded.role === "guru" && !decoded.guru_id) {
      return null;
    }

    return decoded;
  } catch (error) {
    // Token invalid, expired, atau signature tidak match
    if (error instanceof jwt.JsonWebTokenError) {
      // Token tidak valid (signature, format, dll)
      return null;
    }
    if (error instanceof jwt.TokenExpiredError) {
      // Token sudah expired
      return null;
    }
    // Unknown error
    return null;
  }
}

/**
 * Helper untuk route yang HARUS admin (delete guru/murid, log_admin, dll).
 * Pakai ini kalau cuma admin yang boleh akses, guru ditolak.
 *
 * Mengembalikan payload kalau valid AND role = admin, null sebaliknya.
 */
export function requireAdmin(request: Request): TokenPayload | null {
  const payload = verifyToken(request);
  if (!payload || payload.role !== "admin") {
    return null;
  }
  return payload;
}

/**
 * Helper untuk route yang boleh admin DAN guru tertentu (misal: guru hanya bisa akses data dirinya).
 * Digunakan untuk enforcing row-level authorization.
 *
 * Contoh:
 *   const payload = requireAuth(request);
 *   if (!payload) return Unauthorized;
 *   if (payload.role === "guru") {
 *     // Check bahwa guru hanya akses data guruId miliknya sendiri
 *     if (requestedGuruId !== payload.guru_id) return Forbidden;
 *   }
 */
export function requireAuth(request: Request): TokenPayload | null {
  return verifyToken(request);
}