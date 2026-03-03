import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

/** Admin builder için tam ağaç: sekmeler → bölümler → alanlar */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const tabs = await prisma.crmTab.findMany({
    orderBy: { order: "asc" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          fields: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  const fieldsWithoutSection = await prisma.crmField.findMany({
    where: { sectionId: null },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({
    tabs,
    orphanFields: fieldsWithoutSection,
  });
}
