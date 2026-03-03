import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireStudent();
  if (auth.error) return auth.error;
  const student = await prisma.student.findUnique({
    where: { userId: auth.session.id },
  });
  if (!student) return NextResponse.json({ student: null });
  return NextResponse.json({
    student: { id: student.id, stage: student.stage, userId: student.userId },
  });
}
