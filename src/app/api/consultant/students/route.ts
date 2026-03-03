import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireConsultant } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireConsultant();
  if (auth.error) return auth.error;
  if (auth.session.role !== "CONSULTANT") {
    return NextResponse.json({ error: "Sadece danışman öğrenci ekleyebilir." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Eksik veya hatalı alanlar." }, { status: 400 });
  }
  const { email, password, name } = parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 400 });
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: emailNorm,
      passwordHash,
      name: name?.trim() || null,
      role: "STUDENT",
    },
    select: { id: true, email: true, name: true },
  });
  await prisma.student.create({
    data: {
      userId: user.id,
      consultantId: auth.session.id,
    },
  });
  return NextResponse.json(user);
}
