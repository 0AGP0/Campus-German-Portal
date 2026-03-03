import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

const SESSION_COOKIE = "cg_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const [userId, secret] = token.split(":");
    if (!userId || !secret) return null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, passwordHash: true },
    });
    if (!user) return null;
    // Basit doğrulama: hash'in ilk 12 karakteri secret olarak kullanılabilir (MVP)
    const expectedSecret = user.passwordHash.slice(0, 12);
    if (secret !== expectedSecret) return null;
    const { passwordHash: _, ...rest } = user;
    return rest as SessionUser;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return;
  const secret = user.passwordHash.slice(0, 12);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${userId}:${secret}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
