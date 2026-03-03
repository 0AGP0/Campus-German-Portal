import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  type: z.enum(["text", "email", "select", "date", "number"]).optional(),
  required: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  sectionId: z.string().nullable().optional(),
  options: z.string().nullable().optional(),
  hidden: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const field = await prisma.crmField.findUnique({ where: { id } });
  if (!field) return NextResponse.json({ error: "Alan bulunamadı." }, { status: 404 });
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
  const updated = await prisma.crmField.update({
    where: { id },
    data: {
      ...(parsed.data.label != null && { label: parsed.data.label }),
      ...(parsed.data.type != null && { type: parsed.data.type }),
      ...(parsed.data.required != null && { required: parsed.data.required }),
      ...(parsed.data.order != null && { order: parsed.data.order }),
      ...(parsed.data.sectionId !== undefined && { sectionId: parsed.data.sectionId }),
      ...(parsed.data.options !== undefined && { options: parsed.data.options }),
      ...(parsed.data.hidden !== undefined && { hidden: parsed.data.hidden }),
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
  await prisma.crmField.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
