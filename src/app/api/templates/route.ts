import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const isAdmin = auth.session.role === "ADMIN";
  const templates = await prisma.template.findMany({
    where: isAdmin ? undefined : { active: true },
    orderBy: { createdAt: "desc" },
    select: isAdmin
      ? undefined
      : { id: true, name: true, description: true },
  });
  return NextResponse.json(templates);
}

const createSchema = {
  name: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  description: (v: unknown) => v == null || typeof v === "string",
  content: (v: unknown) => v == null || typeof v === "string",
  mapping: (v: unknown) => v == null || typeof v === "string",
  active: (v: unknown) => v == null || typeof v === "boolean",
};

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  if (!createSchema.name(b?.name)) {
    return NextResponse.json({ error: "Şablon adı gerekli." }, { status: 400 });
  }
  const template = await prisma.template.create({
    data: {
      name: (b.name as string).trim(),
      description: b?.description != null ? String(b.description) : null,
      htmlPath: null,
      content: b?.content != null ? String(b.content) : null,
      placeholders: null,
      mapping:
        b?.mapping != null
          ? typeof b.mapping === "string"
            ? b.mapping
            : JSON.stringify(b.mapping)
          : null,
      active: b?.active === true,
    },
  });
  return NextResponse.json(template);
}
