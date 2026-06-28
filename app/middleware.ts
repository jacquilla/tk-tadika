import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Halaman yang hanya bisa diakses jika sudah login (ada session)
  const protectedPaths = ["/dashboard", "/admin"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    const session = request.cookies.get("tk-session");
    if (!session) {
      // Redirect ke login jika belum ada session
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
