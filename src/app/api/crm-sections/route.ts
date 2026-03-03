import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const createSectionSchema = z.object({
  tabId: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().min(0).optional(),
  width: z.number().int().min(25).max(100).optional(),
});

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const tabId = searchParams.get("tabId");
  const where = tabId ? { tabId } : {};
  const sections = await prisma.crmSection.findMany({
    where,
    orderBy: { order: "asc" },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(sections);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = createSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Hatalı veri." }, { status: 400 });
  }
  const section = await prisma.crmSection.create({
    data: {
      tabId: parsed.data.tabId,
      title: parsed.data.title.trim(),
      order: parsed.data.order ?? 0,
      width: parsed.data.width ?? 100,
    },
  });
  return NextResponse.json(section);
}
