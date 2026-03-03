import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

/** Öğrenci/danışman: Sekmeli belge alanları yapısı (admin tanımlı) */
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const tabs = await prisma.docTab.findMany({
      orderBy: { order: "asc" },
      include: {
        fields: { orderBy: { order: "asc" } },
      },
    });
    return NextResponse.json(tabs);
  } catch (err) {
    console.error("doc-structure GET:", err);
    return NextResponse.json(
      { error: "Belge yapısı yüklenemedi. Lütfen yönetici ile iletişime geçin." },
      { status: 503 }
    );
  }
}
