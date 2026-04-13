import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as { label?: string };
  const label = body?.label?.trim();
  if (!label) return NextResponse.json({ error: "Etiket boş olamaz" }, { status: 400 });
  try {
    const tag = await prisma.leadTag.create({ data: { leadId: id, label } });
    const row = await prisma.lead.findUniqueOrThrow({
      where: { id },
      include: { notes: { orderBy: { createdAt: "asc" } }, tags: true },
    });
    return NextResponse.json({ lead: prismaLeadToDto(row), tag: { id: tag.id, label: tag.label } });
  } catch {
    return NextResponse.json({ error: "Lead bulunamadı" }, { status: 404 });
  }
}
