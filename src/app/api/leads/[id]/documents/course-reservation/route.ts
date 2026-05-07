import { Buffer } from "node:buffer";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthJwt } from "@/lib/api-auth";
import {
  generateCourseReservationPdf,
  normalizeCourseReservationDraft,
} from "@/lib/courseReservationPdf";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";

export const runtime = "nodejs";

type Body = {
  draft?: unknown;
  flatten?: boolean;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAuthJwt(req);
  if (!token) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { id } = await params;
  const row = await prisma.lead.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "asc" } }, tags: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
  const lead = prismaLeadToDto(row);

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  const draft = normalizeCourseReservationDraft(body.draft, lead);
  try {
    const buf = await generateCourseReservationPdf(draft, Boolean(body.flatten));
    const safeName = `Course_Reservation_${id.slice(0, 12)}.pdf`;
    return NextResponse.json(
      {
        filename: safeName,
        pdfBase64: Buffer.from(buf).toString("base64"),
        draft,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Belge oluşturulamadı";
    const status = msg.includes("bulunamadı") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
