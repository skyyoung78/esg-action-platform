import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-session";

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (await isValidAdminSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/dashboard", "/admin/dashboard/:path*"],
};
