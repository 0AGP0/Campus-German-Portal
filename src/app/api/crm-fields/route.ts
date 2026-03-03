import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/api-auth";
import { z } from "zod";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const usePagination = pageParam != null || limitParam != null;
  if (usePagination) {
    const adminAuth = await requireAdmin();
    if (adminAuth.error) return adminAuth.error;
  }
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const limit = Math.min(100, Math.max(5, parseInt(limitParam || "10", 10)));
  const skip = (page - 1) * limit;

  if (usePagination) {
    const [items, total] = await Promise.all([
      prisma.crmField.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        skip,
        take: limit,
      }),
      prisma.crmField.count(),
    ]);
    return NextResponse.json({ items, total, page, limit });
  }
  const items = await prisma.crmField.findMany({
    orderBy: [
      { section: { order: "asc" } },
      { order: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      section: { select: { id: true, title: true, order: true, tabId: true, width: true, tab: { select: { id: true, label: true, order: true } } } },
    },
  });
  return NextResponse.json(items);
}

const createFieldSchema = z.object({
  key: z.string().min(1).regex(/^[a-zA-Z0-9_]+$/, "Sadece harf, rakam ve alt çizgi"),
  label: z.string().min(1),
  type: z.enum(["text", "email", "select", "date", "number"]),
  required: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  options: z.string().optional(),
  sectionId: z.string().optional(),
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
  const parsed = createFieldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Eksik veya hatalı alanlar.", details: parsed.error.flatten() }, { status: 400 });
  }
  const existing = await prisma.crmField.findUnique({ where: { key: parsed.data.key } });
  if (existing) {
    return NextResponse.json({ error: "Bu alan anahtarı zaten var." }, { status: 400 });
  }
  const field = await prisma.crmField.create({
    data: {
      key: parsed.data.key,
      label: parsed.data.label,
      type: parsed.data.type,
      required: parsed.data.required,
      order: parsed.data.order,
      options: parsed.data.options ?? null,
      sectionId: parsed.data.sectionId ?? null,
    },
  });
  return NextResponse.json(field);
}
