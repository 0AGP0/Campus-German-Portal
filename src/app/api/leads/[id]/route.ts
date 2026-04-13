import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as Partial<{
    stage: string;
    nextStep: string;
    priority: string;
    lost: boolean;
    starred: boolean;
  }>;
  const data: Record<string, unknown> = {};
  if (typeof body.stage === "string") data.stage = body.stage;
  if (typeof body.nextStep === "string") data.nextStep = body.nextStep;
  if (typeof body.priority === "string") data.priority = body.priority;
  if (typeof body.lost === "boolean") data.lost = body.lost;
  if (typeof body.starred === "boolean") data.starred = body.starred;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Geçersiz gövde" }, { status: 400 });
  }
  try {
    await prisma.lead.update({ where: { id }, data });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
  const row = await prisma.lead.findUniqueOrThrow({
    where: { id },
    include: { notes: { orderBy: { createdAt: "asc" } }, tags: true },
  });
  return NextResponse.json({ lead: prismaLeadToDto(row) });
}
