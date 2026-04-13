import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }
  const [leadsRaw, extras, boardSettings] = await Promise.all([
    prisma.lead.findMany({
      include: { notes: { orderBy: { createdAt: "asc" } }, tags: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.extraKanbanColumn.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.kanbanBoardSettings.findUnique({ where: { id: "default" } }),
  ]);
  const leads = leadsRaw.map(prismaLeadToDto);
  const extraColumns = extras.map((e) => ({ id: e.id, label: e.label }));
  const hiddenBuiltinStageIds = boardSettings?.hiddenBuiltinStageIds ?? [];
  return NextResponse.json({ leads, extraColumns, hiddenBuiltinStageIds });
}
