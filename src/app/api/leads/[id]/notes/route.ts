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
  const body = (await req.json()) as { body?: string; author?: string };
  const text = body?.body?.trim();
  if (!text) return NextResponse.json({ error: "Not boş olamaz" }, { status: 400 });
  const author = body?.author?.trim();
  try {
    const note = await prisma.leadNote.create({
      data: {
        leadId: id,
        body: text,
        ...(author ? { author } : {}),
      },
    });
    const row = await prisma.lead.findUniqueOrThrow({
      where: { id },
      include: { notes: { orderBy: { createdAt: "asc" } }, tags: true },
    });
    return NextResponse.json({ lead: prismaLeadToDto(row), noteId: note.id });
  } catch {
    return NextResponse.json({ error: "Lead bulunamadı" }, { status: 404 });
  }
}
