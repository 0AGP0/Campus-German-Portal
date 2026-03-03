import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireConsultant, requireStudent } from "@/lib/api-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function POST(request: Request) {
  const authConsultant = await requireConsultant();
  let auth: { session: { id: string; role: string } };
  if (authConsultant.error) {
    const authStudent = await requireStudent();
    if (authStudent.error) return authStudent.error;
    auth = authStudent;
  } else {
    auth = authConsultant;
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Form verisi gerekli." }, { status: 400 });
  const studentId = formData.get("studentId") as string | null;
  const file = formData.get("file") as File | null;
  if (!studentId || !file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "studentId ve file gerekli." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  if (auth.session.role === "STUDENT") {
    if (student.userId !== auth.session.id) {
      return NextResponse.json({ error: "Sadece kendi belgelerinizi yükleyebilirsiniz." }, { status: 403 });
    }
  } else if (auth.session.role !== "ADMIN" && student.consultantId !== auth.session.id) {
    return NextResponse.json({ error: "Bu öğrenciye belge yükleyemezsiniz." }, { status: 403 });
  }

  await mkdir(path.join(UPLOAD_DIR, studentId), { recursive: true });
  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, studentId, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const doc = await prisma.document.create({
    data: {
      studentId,
      filename: file.name,
      filepath: `${studentId}/${filename}`,
      mimeType: file.type || null,
      uploadedBy: auth.session.id,
    },
  });
  return NextResponse.json(doc);
}
