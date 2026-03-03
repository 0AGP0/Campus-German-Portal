import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";

type AuthResult =
  | { session: SessionUser; error: null }
  | { session: null; error: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Oturum gerekli." }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAdmin(): Promise<AuthResult> {
  const out = await requireAuth();
  if (out.error) return out;
  if (out.session.role !== "ADMIN") {
    return { session: null, error: NextResponse.json({ error: "Yetkisiz." }, { status: 403 }) };
  }
  return out;
}

export async function requireConsultant(): Promise<AuthResult> {
  const out = await requireAuth();
  if (out.error) return out;
  if (out.session.role !== "CONSULTANT" && out.session.role !== "ADMIN") {
    return { session: null, error: NextResponse.json({ error: "Yetkisiz." }, { status: 403 }) };
  }
  return out;
}

export async function requireStudent(): Promise<AuthResult> {
  const out = await requireAuth();
  if (out.error) return out;
  if (out.session.role !== "STUDENT") {
    return { session: null, error: NextResponse.json({ error: "Yetkisiz." }, { status: 403 }) };
  }
  return out;
}
