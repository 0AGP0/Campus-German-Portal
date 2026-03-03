import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({
  tabId: z.string().optional(),
  label: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  required: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const field = await prisma.docField.findUnique({ where: { id } });
  if (!field) return NextResponse.json({ error: "Belge alanı bulunamadı." }, { status: 404 });
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
  const updated = await prisma.docField.update({
    where: { id },
    data: {
      ...(parsed.data.tabId != null && { tabId: parsed.data.tabId }),
      ...(parsed.data.label != null && { label: parsed.data.label.trim() }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.required != null && { required: parsed.data.required }),
      ...(parsed.data.order != null && { order: parsed.data.order }),
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
  await prisma.docField.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
