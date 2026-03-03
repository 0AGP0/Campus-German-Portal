import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

/** Admin: Tam CRM ağacı (sekmeler → konteynerlar → görünür alanlar) + gizli alanlar listesi */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const tabs = await prisma.crmTab.findMany({
    orderBy: { order: "asc" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          fields: {
            where: { hidden: false },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  const orphanFields = await prisma.crmField.findMany({
    where: { sectionId: null, hidden: false },
    orderBy: { order: "asc" },
  });

  const hiddenFields = await prisma.crmField.findMany({
    where: { hidden: true },
    orderBy: { createdAt: "desc" },
    include: {
      section: {
        select: {
          id: true,
          title: true,
          tab: { select: { id: true, label: true } },
        },
      },
    },
  });

  return NextResponse.json({
    tabs,
    orphanFields,
    hiddenFields,
  });
}
