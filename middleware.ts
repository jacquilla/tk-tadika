import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CSP: Restrict to same-origin untuk JWT, block inline scripts
  // Adjust berdasarkan kebutuhan (googleapis.com untuk Google Drive upload)
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " + // unsafe-inline diperlukan Next.js client components
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' https: data:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://lh3.googleusercontent.com https://api.fonnte.com; " +
      "frame-ancestors 'none';"
  );

  // HSTS: Force HTTPS (jangan aktifkan di development/localhost)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

// Middleware config: gunakan untuk protected routes
export const config = {
  matcher: [
    // Jalankan middleware untuk semua routes kecuali _next, static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
