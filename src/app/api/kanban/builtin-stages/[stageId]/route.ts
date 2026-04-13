import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import {
  countVisibleKanbanColumns,
  pickFallbackStageForHidden,
} from "@/lib/kanbanBuiltinStages";
import { prisma } from "@/lib/db";
import { STAGE_ORDER } from "@/data/leads";

const SETTINGS_ID = "default";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ stageId: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { stageId } = await params;
  if (!STAGE_ORDER.includes(stageId)) {
    return NextResponse.json({ error: "Geçersiz yerleşik aşama" }, { status: 400 });
  }

  const extras = await prisma.extraKanbanColumn.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true } });
  const extraIds = extras.map((e) => e.id);

  const row = await prisma.kanbanBoardSettings.findUnique({ where: { id: SETTINGS_ID } });
  const currentHidden = row?.hiddenBuiltinStageIds ?? [];
  if (currentHidden.includes(stageId)) {
    return NextResponse.json({ ok: true, hiddenBuiltinStageIds: currentHidden });
  }

  const nextHidden = [...currentHidden, stageId];
  if (countVisibleKanbanColumns(nextHidden, extraIds.length) < 1) {
    return NextResponse.json(
      { error: "En az bir sütun panoda görünür kalmalı." },
      { status: 400 },
    );
  }

  let fallback: string;
  try {
    fallback = pickFallbackStageForHidden(nextHidden, extraIds);
  } catch {
    return NextResponse.json({ error: "Uygun hedef aşama bulunamadı." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.lead.updateMany({ where: { stage: stageId }, data: { stage: fallback } }),
    prisma.kanbanBoardSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, hiddenBuiltinStageIds: nextHidden },
      update: { hiddenBuiltinStageIds: nextHidden },
    }),
  ]);

  return NextResponse.json({ ok: true, hiddenBuiltinStageIds: nextHidden });
}
