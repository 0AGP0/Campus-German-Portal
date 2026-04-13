import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Route Handler isteklerinde JWT oturumu (çerez).
 * Bazı Next.js sürümlerinde `getServerSession()` App Router API route’larında çerezi göremeyebilir;
 * PDF/binary yanıtlarda istemciye HTML/JSON karışması bununla ilişkili olabiliyor.
 */
export async function getAuthJwt(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
  if (!secret) return null;
  return getToken({ req, secret });
}
