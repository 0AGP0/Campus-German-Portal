import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const createSchema = z.object({
  label: z.string().min(1),
  order: z.number().int().min(0).optional(),
});

const PRISMA_DOC_MSG =
  "Belge modülleri yüklü değil. Lütfen dev sunucusunu durdurup 'npx prisma generate' ve 'npx prisma db push' çalıştırın, ardından sunucuyu tekrar başlatın.";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const tabs = await prisma.docTab.findMany({
      orderBy: { order: "asc" },
      include: { fields: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(tabs);
  } catch (err) {
    console.error("doc-tabs GET:", err);
    return NextResponse.json({ error: PRISMA_DOC_MSG }, { status: 503 });
  }
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Eksik veya hatalı alanlar." }, { status: 400 });
  }
  try {
    const count = await prisma.docTab.count();
    const tab = await prisma.docTab.create({
      data: {
        label: parsed.data.label.trim(),
        order: parsed.data.order ?? count,
      },
    });
    return NextResponse.json(tab);
  } catch (err) {
    console.error("doc-tabs POST:", err);
    return NextResponse.json({ error: PRISMA_DOC_MSG }, { status: 503 });
  }
}
