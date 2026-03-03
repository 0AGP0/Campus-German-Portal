import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, LayoutDashboard, ArrowRight, History, FileText } from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  CONSULTANT: "Danışman",
  STUDENT: "Öğrenci",
};

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const [userCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900">
          Admin Paneli
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-slate-600">
          Platform işlemlerini yönetin, kullanıcı hesaplarını ve öğrenci atamalarını tek merkezden yapılandırın.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="group overflow-hidden border-slate-200 transition-shadow hover:shadow-xl hover:shadow-primary/5">
          <div className="p-1">
            <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <LayoutDashboard className="relative text-6xl text-primary/40 transition-transform group-hover:scale-110" />
              <div className="absolute bottom-4 right-4 rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                <span className="font-bold text-primary">{userCount} Kullanıcı</span>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h3 className="text-xl font-bold text-slate-900">Kullanıcılar</h3>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Danışman ve öğrenci hesaplarını, yetkileri ve durumu yönetin.
            </p>
            <Button asChild className="w-full gap-2">
              <Link href="/dashboard/admin/users">
                Hesapları yönet
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="group overflow-hidden border-slate-200 transition-shadow hover:shadow-xl hover:shadow-primary/5">
          <div className="p-1">
            <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <Settings className="relative text-6xl text-primary/40 transition-transform group-hover:scale-110" />
            </div>
          </div>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              <h3 className="text-xl font-bold text-slate-900">Öğrenci atamaları</h3>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Öğrencileri danışmanlara atayın.
            </p>
            <Button asChild variant="outline" className="w-full gap-2 border-slate-200">
              <Link href="/dashboard/admin/assignments">
                Atamaları yönet
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="group overflow-hidden border-slate-200 transition-shadow hover:shadow-xl hover:shadow-primary/5">
          <div className="p-1">
            <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <FileText className="relative text-6xl text-primary/40 transition-transform group-hover:scale-110" />
            </div>
          </div>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <h3 className="text-xl font-bold text-slate-900">CRM Alanları</h3>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Öğrenci form alanlarını sekmeler ve konteynerlar ile düzenleyin.
            </p>
            <Button asChild variant="outline" className="w-full gap-2 border-slate-200">
              <Link href="/dashboard/admin/crm-fields">
                CRM düzenle
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-900">
          <History className="size-5 text-primary" />
          Son eklenen kullanıcılar
        </h2>
        <Card className="overflow-hidden border-slate-200">
          {recentUsers.length === 0 ? (
            <div className="p-6 text-center text-slate-500">Henüz kullanıcı yok.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{u.name ?? u.email}</p>
                    <p className="text-xs text-slate-500">{u.email} · {roleLabels[u.role] ?? u.role}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
