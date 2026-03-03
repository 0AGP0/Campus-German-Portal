import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  mapping: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });
  return NextResponse.json(template);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });
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
  const updated = await prisma.template.update({
    where: { id },
    data: {
      ...(parsed.data.name != null && { name: parsed.data.name.trim() }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.content !== undefined && { content: parsed.data.content }),
      ...(parsed.data.mapping !== undefined && {
        mapping: parsed.data.mapping == null ? null : parsed.data.mapping,
      }),
      ...(parsed.data.active !== undefined && { active: parsed.data.active }),
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
  await prisma.template.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
