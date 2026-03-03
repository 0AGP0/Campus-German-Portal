import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(0).optional(),
  role: z.enum(["ADMIN", "CONSULTANT", "STUDENT"]).optional(),
  consultantId: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      studentProfile: { select: { id: true, consultantId: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  const out: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
  if (user.studentProfile) {
    (out as Record<string, unknown>).studentId = user.studentProfile.id;
    (out as Record<string, unknown>).consultantId = user.studentProfile.consultantId;
  }
  return NextResponse.json(out);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Hatalı veri." }, { status: 400 });
  }

  const updateData: { name?: string | null; role?: "ADMIN" | "CONSULTANT" | "STUDENT" } = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name.trim() || null;
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  if (user.role === "STUDENT" && parsed.data.consultantId !== undefined) {
    const student = await prisma.student.findFirst({ where: { userId: id } });
    if (student) {
      await prisma.student.update({
        where: { id: student.id },
        data: { consultantId: parsed.data.consultantId },
      });
    }
  }

  const updated = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return NextResponse.json(updated);
}
