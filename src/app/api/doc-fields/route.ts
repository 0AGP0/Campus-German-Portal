import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const createSchema = z.object({
  tabId: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().default(false),
  order: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Eksik veya hatalı alanlar." }, { status: 400 });
  }
  const count = await prisma.docField.count({ where: { tabId: parsed.data.tabId } });
  const field = await prisma.docField.create({
    data: {
      tabId: parsed.data.tabId,
      label: parsed.data.label.trim(),
      description: parsed.data.description?.trim() ?? null,
      required: parsed.data.required,
      order: parsed.data.order ?? count,
    },
  });
  return NextResponse.json(field);
}
