import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent, requireConsultant, requireAdmin } from "@/lib/api-auth";
import type { SessionUser } from "@/lib/auth";

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m] ?? m);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const templateId = body?.templateId as string | undefined;
  const studentIdParam = body?.studentId as string | undefined;

  if (!templateId) {
    return NextResponse.json({ error: "templateId gerekli." }, { status: 400 });
  }

  let auth: { session: SessionUser };
  let studentId: string;

  const admin = await requireAdmin();
  if (!admin.error) {
    auth = admin;
    if (!studentIdParam) {
      return NextResponse.json({ error: "Admin için studentId gerekli." }, { status: 400 });
    }
    studentId = studentIdParam;
  } else {
    const consultant = await requireConsultant();
    if (!consultant.error) {
      auth = consultant;
      if (!studentIdParam) {
        return NextResponse.json({ error: "Danışman için studentId gerekli." }, { status: 400 });
      }
      studentId = studentIdParam;
    } else {
      const student = await requireStudent();
      if (student.error) return student.error;
      auth = student;
      const me = await prisma.student.findUnique({ where: { userId: auth.session.id } });
      if (!me) return NextResponse.json({ error: "Öğrenci kaydı bulunamadı." }, { status: 404 });
      studentId = me.id;
    }
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true, crmData: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  }
  if (auth.session.role === "CONSULTANT" && student.consultantId !== auth.session.id) {
    return NextResponse.json({ error: "Bu öğrenci için yetkiniz yok." }, { status: 403 });
  }

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) {
    return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });
  }
  if (!template.active && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Şablon kullanılamıyor." }, { status: 403 });
  }

  let html = template.content ?? "";
  if (!html && template.htmlPath) {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const fullPath = path.join(process.cwd(), template.htmlPath);
      html = await fs.readFile(fullPath, "utf-8");
    } catch {
      return NextResponse.json({ error: "Şablon içeriği okunamadı." }, { status: 500 });
    }
  }
  if (!html) {
    return NextResponse.json({ error: "Şablon içeriği boş." }, { status: 400 });
  }

  const crmData: Record<string, unknown> = student.crmData?.data
    ? (JSON.parse(student.crmData.data) as Record<string, unknown>)
    : {};
  const stageLabels: Record<string, string> = {
    BASVURU: "Başvuru",
    BELGELER_TAMAM: "Belgeler tamam",
    ODEME_BEKLIYOR: "Ödeme bekliyor",
    KAYIT_TAMAM: "Kayıt tamam",
  };

  let mapping: Record<string, string> = {};
  if (template.mapping) {
    try {
      mapping = JSON.parse(template.mapping) as Record<string, string>;
    } catch {
      // mapping yoksa placeholder'lar boş kalır
    }
  }

  const now = new Date();
  const replacements: Record<string, string> = {
    "user.name": student.user?.name ?? "",
    "user.email": student.user?.email ?? "",
    "student.stage": stageLabels[student.stage] ?? student.stage,
    date: now.toLocaleDateString("tr-TR"),
    year: String(now.getFullYear()),
  };
  for (const [key, value] of Object.entries(crmData)) {
    replacements[`crm.${key}`] = value != null ? String(value) : "";
  }

  for (const [placeholderKey, source] of Object.entries(mapping)) {
    const value = replacements[source] ?? "";
    const safe = escapeHtml(value);
    html = html.replace(new RegExp(`\\{\\{\\s*${placeholderKey}\\s*\\}\\}`, "g"), safe);
  }
  // Eşlenmemiş {{x}} kalsın boş veya olduğu gibi - istersen son bir replace ile boşalt
  html = html.replace(/\{\{\s*[\w.]+\s*\}\}/g, "");

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline; filename=belge.html",
    },
  });
}
