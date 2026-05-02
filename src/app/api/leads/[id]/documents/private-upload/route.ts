import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthJwt } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { resolvePrivateUploadForLead } from "@/lib/private-documents-storage";

export const runtime = "nodejs";

type Slot = "passport" | "signature";

function slotToFormKey(slot: Slot): "passport_copy_path" | "digital_signature_path" {
  return slot === "passport" ? "passport_copy_path" : "digital_signature_path";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAuthJwt(req);
  if (!token) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { id: leadId } = await params;
  const slot = req.nextUrl.searchParams.get("slot") as Slot | null;
  if (slot !== "passport" && slot !== "signature") {
    return NextResponse.json({ error: "Geçerli slot: passport veya signature" }, { status: 400 });
  }

  const row = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!row) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
  if (row.formType !== "private-documents-form") {
    return NextResponse.json({ error: "Bu kayıt özel evrak formu değil" }, { status: 400 });
  }

  const fd = row.formData as Record<string, unknown>;
  const relKey = String(fd[slotToFormKey(slot)] ?? "").trim();
  if (!relKey) {
    return NextResponse.json({ error: "Dosya yolu kayıtta yok" }, { status: 404 });
  }

  const resolved = resolvePrivateUploadForLead(leadId, relKey);
  if (!resolved) {
    return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(resolved.absPath);
  } catch {
    return NextResponse.json(
      { error: "Dosya diskte bulunamadı. UPLOAD_DIR veya sunucu yolu kontrol edin." },
      { status: 404 },
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", resolved.mime);
  headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(resolved.downloadName)}"`);
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(new Uint8Array(buf), { status: 200, headers });
}
