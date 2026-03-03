import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const createTabSchema = z.object({
  label: z.string().min(1),
  order: z.number().int().min(0).optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const tabs = await prisma.crmTab.findMany({
    orderBy: { order: "asc" },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(tabs);
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
  const parsed = createTabSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Hatalı veri." }, { status: 400 });
  }
  const tab = await prisma.crmTab.create({
    data: {
      label: parsed.data.label.trim(),
      order: parsed.data.order ?? 0,
    },
  });
  return NextResponse.json(tab);
}
