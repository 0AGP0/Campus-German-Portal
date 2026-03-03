import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/api-auth";
import { z } from "zod";

export async function GET() {
  const auth = await requireStudent();
  if (auth.error) return auth.error;
  const student = await prisma.student.findUnique({
    where: { userId: auth.session.id },
    include: { crmData: true },
  });
  if (!student) return NextResponse.json({ student: null, crmData: null });
  const data = student.crmData?.data
    ? (JSON.parse(student.crmData.data) as Record<string, unknown>)
    : {};
  return NextResponse.json({
    student: {
      id: student.id,
      stage: student.stage,
      userId: student.userId,
    },
    crmData: data,
  });
}

const patchSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStudent();
  if (auth.error) return auth.error;
  const student = await prisma.student.findUnique({
    where: { userId: auth.session.id },
  });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Hatalı veri." }, { status: 400 });
  }
  if (parsed.data.data !== undefined) {
    const json = JSON.stringify(parsed.data.data);
    await prisma.studentCrmData.upsert({
      where: { studentId: student.id },
      create: { studentId: student.id, data: json },
      update: { data: json },
    });
  }
  return NextResponse.json({ ok: true });
}
