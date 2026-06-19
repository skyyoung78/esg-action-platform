export const ADMIN_SESSION_COOKIE = "esg_admin_session";

const DEFAULT_ADMIN_EMAIL = "admin@esg-action.kr";
const DEFAULT_ADMIN_PASSWORD = "demo-admin";

export function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
}

export function getAdminCredentials(): { email: string; password: string } {
  return {
    email: process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD,
  };
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const expected = getAdminCredentials();
  return email.trim().toLowerCase() === expected.email.toLowerCase() && password === expected.password;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createAdminSessionToken(email: string): Promise<string> {
  return hmacSha256Hex(sessionSecret(), email.toLowerCase());
}

export async function isValidAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const { email } = getAdminCredentials();
  const expected = await createAdminSessionToken(email);
  if (token.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < token.length; i += 1) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function adminSessionCookieOptions(maxAgeSeconds = 60 * 60 * 12) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
