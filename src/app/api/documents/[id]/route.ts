import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Belge bulunamadı." }, { status: 404 });

  const student = await prisma.student.findUnique({ where: { id: doc.studentId } });
  if (!student) return new NextResponse(null, { status: 404 });

  const canAccess =
    auth.session.id === student.userId ||
    auth.session.role === "ADMIN" ||
    student.consultantId === auth.session.id;
  if (!canAccess) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const fullPath = path.join(UPLOAD_DIR, doc.filepath);
  try {
    const buffer = await readFile(fullPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.filename)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Dosya okunamadı." }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Belge bulunamadı." }, { status: 404 });
  const student = await prisma.student.findUnique({ where: { id: doc.studentId } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  const canDelete =
    auth.session.id === doc.uploadedBy ||
    auth.session.role === "ADMIN" ||
    (auth.session.role === "CONSULTANT" && student.consultantId === auth.session.id);
  if (!canDelete) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const { unlink } = await import("fs/promises");
  const fullPath = path.join(UPLOAD_DIR, doc.filepath);
  await unlink(fullPath).catch(() => {});
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
