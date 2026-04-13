import { Buffer } from "node:buffer";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthJwt } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";
import { generateBookingOfficialHtmlPdf } from "@/lib/bookingOfficialHtmlPdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  if (row.formType !== "booking") {
    return NextResponse.json({ error: "Yalnızca booking formu leadleri için belge üretilir" }, { status: 400 });
  }

  try {
    const lead = prismaLeadToDto(row);
    const arrayBuffer = await generateBookingOfficialHtmlPdf(lead);
    const buf = Buffer.from(new Uint8Array(arrayBuffer));
    const safeName = `CampusGerman_Booking_${id.slice(0, 12)}.pdf`;
    /**
     * Ham application/pdf gövdesi bazı Windows / Next dev ortamlarında istemcide bozulabiliyor.
     * JSON + base64 ile metin taşıyınca ikili bütünlük garanti.
     */
    return NextResponse.json(
      { filename: safeName, pdfBase64: buf.toString("base64") },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "PDF oluşturulamadı" }, { status: 500 });
  }
}
