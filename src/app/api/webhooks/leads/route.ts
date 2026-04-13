import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";
import { notifyNewLeadEmail } from "@/lib/mail";
import {
  leadFromInboundPayload,
  normalizeInboundFormData,
  type InboundLeadPayload,
} from "@/lib/inboundLead";
import { verifyWebhook } from "@/lib/webhook-verify";

/** Tarayıcı/curl ile “çalışıyor mu” kontrolü (POST gerekli) */
export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Lead eklemek için POST + JSON gönderin. Make.com: HTTP modülü, Authorization: Bearer WEBHOOK_SECRET",
  });
}

function parseCreatedAt(s: string): Date {
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  return new Date();
}

export async function POST(req: NextRequest) {
  if (!verifyWebhook(req)) {
    return NextResponse.json({ error: "Webhook doğrulanamadı" }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, unknown>;
  const formType = body.formType as InboundLeadPayload["formType"] | undefined;
  const rawFd = body.formData;
  const formData = normalizeInboundFormData(rawFd);
  if (!formType || !["booking", "contact", "quote"].includes(formType)) {
    return NextResponse.json({ error: "formType: booking | contact | quote gerekli" }, { status: 400 });
  }
  if (rawFd !== undefined && rawFd !== null && (typeof rawFd !== "object" || Array.isArray(rawFd))) {
    return NextResponse.json({ error: "formData nesne (object) olmalı" }, { status: 400 });
  }
  const payload: InboundLeadPayload = {
    formType,
    formData,
    ...(typeof body.id === "string" && body.id.trim() ? { id: body.id.trim() } : {}),
    ...(typeof body.source === "string" ? { source: body.source } : {}),
    ...(typeof body.stage === "string" ? { stage: body.stage } : {}),
  };
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
