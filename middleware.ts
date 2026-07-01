import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ===== SECURITY HEADERS =====
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const isDev = process.env.NODE_ENV === "development";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
  const supabaseWs = supabaseOrigin.replace("https://", "wss://");

  const cspHeader =
    "default-src 'self'; " +
    "connect-src 'self' " +
    (supabaseOrigin ? `${supabaseOrigin} ${supabaseWs} ` : "") +
    "https://drive.google.com https://api.fonnte.com; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' https: data:; " +
    "connect-src 'self' " +
    (process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL} `
      : "") +
    "https://drive.google.com https://api.fonnte.com; " +
    "frame-ancestors 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';";

  response.headers.set("Content-Security-Policy", cspHeader);

  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()",
  );

  // ===== JWT AUTH CHECK =====
  const token = request.cookies.get("jwtToken")?.value;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      // Kalau token valid dan user ke /login → alihkan ke /tabDatang
      if (request.nextUrl.pathname === "/login") {
        return NextResponse.redirect(new URL("/tabDatang", request.url));
      }
    } catch {
      // Token invalid/expired → biarkan user ke login
    }
  } else {
    // Kalau nggak ada token dan user coba akses /tabDatang → paksa balik ke login
    if (request.nextUrl.pathname.startsWith("/handleDatang")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
