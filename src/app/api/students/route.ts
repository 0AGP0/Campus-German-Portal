import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireConsultant } from "@/lib/api-auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireConsultant();
  if (auth.error) return auth.error;
  const isAdmin = auth.session.role === "ADMIN";
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const stage = searchParams.get("stage")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const where: Prisma.StudentWhereInput = isAdmin ? {} : { consultantId: auth.session.id };
  if (stage && ["BASVURU", "BELGELER_TAMAM", "ODEME_BEKLIYOR", "KAYIT_TAMAM"].includes(stage)) {
    where.stage = stage as Prisma.StudentStage;
  }
  if (q) {
    where.user = {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, email: true, name: true } },
        consultant: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  const list = students.map((s) => ({
    id: s.id,
    userId: s.userId,
    name: s.user?.name ?? "—",
    email: s.user?.email ?? "—",
    stage: s.stage,
    consultantId: s.consultantId,
    consultantName: s.consultant?.name ?? s.consultant?.email ?? "—",
    updatedAt: s.updatedAt,
  }));
  return NextResponse.json({ items: list, total, page, limit });
}
