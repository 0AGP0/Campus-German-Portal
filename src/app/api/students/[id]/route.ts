import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireConsultant } from "@/lib/api-auth";
import { z } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireConsultant();
  if (auth.error) return auth.error;
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      documents: true,
    },
  });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  if (auth.session.role !== "ADMIN" && student.consultantId !== auth.session.id) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  return NextResponse.json(student);
}

const updateSchema = z.object({
  stage: z.enum(["BASVURU", "BELGELER_TAMAM", "ODEME_BEKLIYOR", "KAYIT_TAMAM"]).optional(),
  consultantId: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireConsultant();
  if (auth.error) return auth.error;
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  if (auth.session.role !== "ADMIN" && student.consultantId !== auth.session.id) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Hatalı veri." }, { status: 400 });
  }
  if (parsed.data.stage != null) {
    await prisma.student.update({
      where: { id },
      data: { stage: parsed.data.stage },
    });
  }
  if (parsed.data.consultantId !== undefined && auth.session.role === "ADMIN") {
    await prisma.student.update({
      where: { id },
      data: { consultantId: parsed.data.consultantId },
    });
  }
  const updated = await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json(updated);
}
