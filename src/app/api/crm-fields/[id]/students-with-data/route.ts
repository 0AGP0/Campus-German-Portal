import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

/** Admin: Bu alanda verisi olan öğrencileri döner (silme/gizleme öncesi uyarı için) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const field = await prisma.crmField.findUnique({ where: { id } });
  if (!field) return NextResponse.json({ error: "Alan bulunamadı." }, { status: 404 });

  const rows = await prisma.studentCrmData.findMany({
    select: {
      studentId: true,
      data: true,
      student: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  const key = field.key;
  const students: { id: string; name: string | null; email: string }[] = [];
  for (const row of rows) {
    try {
      const obj = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      if (obj && typeof obj === "object" && key in obj) {
        const val = obj[key];
        if (val != null && String(val).trim() !== "") {
          students.push({
            id: row.student.id,
            name: row.student.user?.name ?? null,
            email: row.student.user?.email ?? "",
          });
        }
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return NextResponse.json({ students, count: students.length });
}
