import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminCredentials,
  verifyAdminCredentials,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ ok: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    await createAdminSessionToken(email),
    adminSessionCookieOptions(),
  );
  return response;
}

export async function GET() {
  const { email } = getAdminCredentials();
  return NextResponse.json({
    ok: true,
    hintEmail: process.env.ADMIN_EMAIL ? undefined : email,
    demoMode: !process.env.ADMIN_PASSWORD,
  });
}
