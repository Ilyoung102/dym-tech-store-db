import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "dym_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-this-value";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionValue(adminId: string) {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${adminId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export async function setAdminSession(adminId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionValue(adminId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminFromSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [adminId, expiresAtText, signature] = parts;
  const payload = `${adminId}.${expiresAtText}`;
  const expected = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return prisma.admin.findFirst({ where: { id: adminId, isActive: true }, select: { id: true, email: true, name: true, role: true } });
}

export async function requireAdmin() {
  const admin = await getAdminFromSession();
  if (!admin) throw new Error("UNAUTHORIZED_ADMIN");
  return admin;
}
