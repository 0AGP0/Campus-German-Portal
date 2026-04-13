import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { MOCK_BOOKING_LEAD, MOCK_BOOKING_LEAD_ID } from "../src/lib/mockBookingLead";

const prisma = new PrismaClient();

async function seedAdmin(): Promise<void> {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD tanımlı değil — admin seed atlandı.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash, name: existing.name ?? "Yönetici" },
    });
    console.log("Admin şifresi .env (INITIAL_ADMIN_*) değerine göre güncellendi:", email);
    return;
  }
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Yönetici",
    },
  });
  console.log("İlk admin oluşturuldu:", email);
}

/** Boş veritabanında Kanban / detay / PDF denemesi için tek örnek booking lead. */
async function seedMockBookingLead(): Promise<void> {
  const l = MOCK_BOOKING_LEAD;
  const createdAt = new Date(`${l.createdAt}T12:00:00.000Z`);
  await prisma.lead.upsert({
    where: { id: MOCK_BOOKING_LEAD_ID },
    create: {
      id: MOCK_BOOKING_LEAD_ID,
      name: l.name,
      email: l.email,
      phone: l.phone,
      stage: l.stage,
      course: l.course,
      city: l.city,
      value: l.value,
      createdAt,
      formType: l.formType,
      formData: l.formData,
      source: l.source,
      priority: l.priority,
      language: l.language,
      nextStep: l.nextStep,
      lost: false,
    },
    update: {
      name: l.name,
      email: l.email,
      phone: l.phone,
      stage: l.stage,
      course: l.course,
      city: l.city,
      value: l.value,
      formData: l.formData,
      source: l.source,
      priority: l.priority,
      language: l.language,
      nextStep: l.nextStep,
      lost: false,
    },
  });
  console.log("Demo booking lead (upsert):", MOCK_BOOKING_LEAD_ID);
}

async function main() {
  await seedAdmin();
  await seedMockBookingLead();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
