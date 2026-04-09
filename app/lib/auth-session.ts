import type { NextRequest } from "next/server";

export type SessionPayload = {
  u: string;
  r: string;
  exp: number;
};

const SECRET = process.env.ADMIN_SESSION_SECRET || "change-me-in-production";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function utf8ToBase64Url(str: string): string {
  return toBase64Url(new TextEncoder().encode(str));
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4 || 4)) % 4;
  const bin = atob(padded + "=".repeat(padLen));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(new Uint8Array(sig));
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function createSessionToken(
  username: string,
  role: string
): Promise<string> {
  const payload: SessionPayload = {
    u: username,
    r: role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = utf8ToBase64Url(JSON.stringify(payload));
  const signature = await hmacSha256Base64Url(SECRET, encoded);
  return `${encoded}.${signature}`;
}

export async function verifySessionToken(
  token?: string
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = await hmacSha256Base64Url(SECRET, encoded);
  try {
    const sigBytes = fromBase64Url(signature);
    const expBytes = fromBase64Url(expected);
    if (!timingSafeEqualBytes(sigBytes, expBytes)) return null;
    const jsonStr = new TextDecoder().decode(fromBase64Url(encoded));
    const payload = JSON.parse(jsonStr) as SessionPayload;
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export type AdminSession = { username: string; role: string };

function normalizeRole(role: string) {
  return (role || "superadmin").trim().toLowerCase();
}

export async function getAdminSession(
  req: NextRequest
): Promise<AdminSession | null> {
  const token = req.cookies.get("admin_session")?.value;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  return { username: payload.u, role: payload.r };
}

export function canMutateGlobalSettings(session: AdminSession | null): boolean {
  if (!session) return false;
  return normalizeRole(session.role) === "superadmin";
}

export function canEditOperationalData(session: AdminSession | null): boolean {
  if (!session) return false;
  return normalizeRole(session.role) !== "viewer";
}
