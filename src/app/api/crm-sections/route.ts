import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const createSchema = z.object({
  tabId: z.string().min(1),
  title: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
  width: z.number().int().min(25).max(100).optional(),
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
  const count = await prisma.crmSection.count({ where: { tabId: parsed.data.tabId } });
  const section = await prisma.crmSection.create({
    data: {
      tabId: parsed.data.tabId,
      title: parsed.data.title?.trim() ?? "Yeni bölüm",
      order: parsed.data.order ?? count,
      width: parsed.data.width ?? 100,
    },
  });
  return NextResponse.json(section);
}
