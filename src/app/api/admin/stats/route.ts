import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const [userCount, crmFieldCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.crmField.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    }),
  ]);
  return NextResponse.json({
    userCount,
    crmFieldCount,
    recentUsers,
  });
}
