import { Buffer } from "node:buffer";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthJwt } from "@/lib/api-auth";
import { generateBookingOfficialHtmlPdf } from "@/lib/bookingOfficialHtmlPdf";
import { MOCK_BOOKING_LEAD } from "@/lib/mockBookingLead";

/**
 * Giriş yapmış kullanıcı için örnek booking belgesi (veritabanı yok).
 * Tarayıcı: GET /api/documents/mock-booking-official
 */
export async function GET(req: NextRequest) {
  const token = await getAuthJwt(req);
  if (!token) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  try {
    const arrayBuffer = await generateBookingOfficialHtmlPdf(MOCK_BOOKING_LEAD);
    const buf = Buffer.from(new Uint8Array(arrayBuffer));
    return NextResponse.json(
      { filename: "CampusGerman_Mock_Booking.pdf", pdfBase64: buf.toString("base64") },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "PDF oluşturulamadı" }, { status: 500 });
  }
}
