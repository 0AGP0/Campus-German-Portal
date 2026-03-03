import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@campusgerman.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

  // Admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Admin",
        role: "ADMIN",
      },
    });
    console.log("Admin oluşturuldu:", adminEmail, "şifre: Admin123!");
  } else {
    console.log("Admin zaten mevcut:", adminEmail);
  }

  // Örnek danışman
  const consultantEmail = "danisman@campusgerman.com";
  const consultantPassword = "Danisman123!";
  let consultant = await prisma.user.findUnique({
    where: { email: consultantEmail },
  });
  if (!consultant) {
    const consultantHash = await bcrypt.hash(consultantPassword, 10);
    consultant = await prisma.user.create({
      data: {
        email: consultantEmail,
        passwordHash: consultantHash,
        name: "Ayşe Danışman",
        role: "CONSULTANT",
      },
    });
    console.log("Danışman oluşturuldu:", consultantEmail, "şifre: Danisman123!");
  } else {
    console.log("Danışman zaten mevcut:", consultantEmail);
  }

  // Örnek öğrenciler (danışmana atanmış)
  const studentsData = [
    { email: "ogrenci1@campusgerman.com", name: "Mehmet Öğrenci" },
    { email: "ogrenci2@campusgerman.com", name: "Zeynep Öğrenci" },
  ];
  const studentPassword = "Ogrenci123!";
  const studentHash = await bcrypt.hash(studentPassword, 10);

  for (const s of studentsData) {
    let user = await prisma.user.findUnique({ where: { email: s.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: s.email,
          passwordHash: studentHash,
          name: s.name,
          role: "STUDENT",
        },
      });
      await prisma.student.create({
        data: {
          userId: user.id,
          consultantId: consultant?.id ?? null,
          stage: s.email.includes("ogrenci1") ? "BASVURU" : "BELGELER_TAMAM",
        },
      });
      console.log("Öğrenci oluşturuldu:", s.email, "şifre: Ogrenci123!");
    }
  }

  // Örnek CRM yapısı (yoksa oluştur)
  const tabCount = await prisma.crmTab.count();
  if (tabCount === 0) {
    const tab = await prisma.crmTab.create({
      data: { label: "Kişisel Bilgiler", order: 0 },
    });
    const section = await prisma.crmSection.create({
      data: { tabId: tab.id, title: "İletişim", order: 0, width: 100 },
    });
    await prisma.crmField.createMany({
      data: [
        { key: "phone", label: "Telefon", type: "text", required: false, order: 0, sectionId: section.id },
        { key: "birth_date", label: "Doğum Tarihi", type: "date", required: false, order: 1, sectionId: section.id },
      ],
    });
    console.log("Örnek CRM sekmesi ve alanları oluşturuldu.");
  }

  // Örnek belge sekmeleri (yoksa oluştur)
  const docTabCount = await prisma.docTab.count();
  if (docTabCount === 0) {
    const docTab = await prisma.docTab.create({
      data: { label: "Başvuru Belgeleri", order: 0 },
    });
    await prisma.docField.createMany({
      data: [
        { tabId: docTab.id, label: "Pasaport kopyası", description: "Pasaport kimlik sayfası", required: true, order: 0 },
        { tabId: docTab.id, label: "Diploma / transkript", required: true, order: 1 },
        { tabId: docTab.id, label: "Fotoğraf", description: "Biyometrik fotoğraf", required: false, order: 2 },
      ],
    });
    console.log("Örnek belge sekmesi ve alanları oluşturuldu.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
