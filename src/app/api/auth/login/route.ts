import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre gerekli." },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Geçersiz e-posta veya şifre." },
        { status: 401 }
      );
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Geçersiz e-posta veya şifre." },
        { status: 401 }
      );
    }
    await createSession(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      redirect: getRedirectForRole(user.role),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Giriş işlemi başarısız." },
      { status: 500 }
    );
  }
}

function getRedirectForRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "CONSULTANT":
      return "/dashboard/consultant";
    case "STUDENT":
      return "/dashboard/student";
    default:
      return "/dashboard";
  }
}
