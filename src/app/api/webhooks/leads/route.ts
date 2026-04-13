import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";
import { notifyNewLeadEmail } from "@/lib/mail";
import { leadFromInboundPayload, type InboundLeadPayload } from "@/lib/inboundLead";
import { verifyWebhook } from "@/lib/webhook-verify";

function parseCreatedAt(s: string): Date {
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  return new Date();
}

export async function POST(req: NextRequest) {
  if (!verifyWebhook(req)) {
    return NextResponse.json({ error: "Webhook doğrulanamadı" }, { status: 401 });
  }
  const payload = (await req.json()) as InboundLeadPayload;
  if (!payload?.formType || !payload.formData || typeof payload.formData !== "object") {
    return NextResponse.json({ error: "formType ve formData gerekli" }, { status: 400 });
  }
  const leadDto = leadFromInboundPayload(payload);
  const createdAt = parseCreatedAt(leadDto.createdAt);
  try {
    await prisma.lead.create({
      data: {
        id: leadDto.id,
        name: leadDto.name,
        email: leadDto.email,
        phone: leadDto.phone,
        stage: leadDto.stage,
        course: leadDto.course,
        city: leadDto.city,
        value: leadDto.value,
        createdAt,
        formType: leadDto.formType,
        formData: leadDto.formData,
        source: leadDto.source,
        priority: leadDto.priority,
        language: leadDto.language,
        nextStep: leadDto.nextStep,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Bu ID zaten kayıtlı" }, { status: 409 });
    }
    throw e;
  }
  const row = await prisma.lead.findUniqueOrThrow({
    where: { id: leadDto.id },
    include: { notes: { orderBy: { createdAt: "asc" } }, tags: true },
  });
  const dto = prismaLeadToDto(row);
  try {
    await notifyNewLeadEmail(dto);
  } catch (err) {
    console.warn("Lead e-postası gönderilemedi", err);
  }
  return NextResponse.json({ lead: dto }, { status: 201 });
}
