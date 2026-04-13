import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }
  const body = (await req.json()) as { label?: string };
  const label = body?.label?.trim() || "Yeni sütun";
  /** Yerleşik aşama id’leriyle asla çakışmasın diye sabit önek */
  const id = `col-${globalThis.crypto?.randomUUID?.() ?? `c${Date.now()}`}`;
  const max = await prisma.extraKanbanColumn.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (max._max.sortOrder ?? 0) + 1;
  await prisma.extraKanbanColumn.create({ data: { id, label, sortOrder } });
  return NextResponse.json({ column: { id, label } });
}
