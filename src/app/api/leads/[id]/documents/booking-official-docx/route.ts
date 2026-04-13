import { Buffer } from "node:buffer";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthJwt } from "@/lib/api-auth";
import { generateBookingOfficialDocx } from "@/lib/bookingOfficialDocx";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAuthJwt(_req);
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
  if (row.formType !== "booking") {
    return NextResponse.json({ error: "Yalnızca booking formu leadleri için belge üretilir" }, { status: 400 });
  }

  try {
    const lead = prismaLeadToDto(row);
    const buf = await generateBookingOfficialDocx(lead);
    const safeName = `CampusGerman_Booking_${id.slice(0, 12)}.docx`;
    return NextResponse.json(
      {
        filename: safeName,
        docxBase64: Buffer.from(buf).toString("base64"),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "DOCX oluşturulamadı";
    const status = msg.includes("bulunamadı") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
