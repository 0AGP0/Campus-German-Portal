import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }
  const { id, tagId } = await params;
  try {
    await prisma.leadTag.deleteMany({ where: { id: tagId, leadId: id } });
    const row = await prisma.lead.findUniqueOrThrow({
      where: { id },
      include: { notes: { orderBy: { createdAt: "asc" } }, tags: true },
    });
    return NextResponse.json({ lead: prismaLeadToDto(row) });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
