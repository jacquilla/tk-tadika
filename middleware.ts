import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // ===== CONTENT SECURITY POLICY (untuk dev & prod) =====
  // PENTING: CSP harus include semua external resources yang digunakan
  const isDev = process.env.NODE_ENV === "development";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
  const supabaseWs = supabaseOrigin.replace("https://", "wss://");

  const cspHeader =
    "default-src 'self'; " +
    "connect-src 'self' " +
    (supabaseOrigin ? `${supabaseOrigin} ${supabaseWs} ` : "") +
    "https://drive.google.com https://api.fonnte.com; " +
    // ... rest
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // unsafe-eval hanya untuk dev (React dev mode)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " + // Google Fonts
    "font-src 'self' https://fonts.gstatic.com; " + // Google Fonts CDN
    "img-src 'self' https: data:; " +
    "connect-src 'self' " + // Supabase & external APIs
    (process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL} `
      : "") +
    "https://drive.google.com " + // Google Drive (untuk image preview)
    "https://api.fonnte.com; " + // WhatsApp API
    "frame-ancestors 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';";

  response.headers.set("Content-Security-Policy", cspHeader);

  // HSTS: Force HTTPS (production only)
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()",
  );

  return response;
}

export const config = {
  matcher: [
    // Jalankan middleware untuk semua routes kecuali _next, static files
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
