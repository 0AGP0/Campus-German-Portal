import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({
  tabId: z.string().optional(),
  title: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
  width: z.number().int().min(25).max(100).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const section = await prisma.crmSection.findUnique({ where: { id } });
  if (!section) return NextResponse.json({ error: "Bölüm bulunamadı." }, { status: 404 });
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
  const updated = await prisma.crmSection.update({
    where: { id },
    data: {
      ...(parsed.data.tabId != null && { tabId: parsed.data.tabId }),
      ...(parsed.data.title != null && { title: parsed.data.title.trim() }),
      ...(parsed.data.order != null && { order: parsed.data.order }),
      ...(parsed.data.width != null && { width: parsed.data.width }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  await prisma.crmSection.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
