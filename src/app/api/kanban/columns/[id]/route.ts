import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }
  const { id } = await params;
  const row = await prisma.extraKanbanColumn.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json(
      { error: "Bu kimlikte ek sütun yok (yerleşik aşamalar veritabanında satır olarak tutulmaz)." },
      { status: 404 },
    );
  }
  await prisma.$transaction([
    prisma.lead.updateMany({ where: { stage: id }, data: { stage: "yeni" } }),
    prisma.extraKanbanColumn.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
