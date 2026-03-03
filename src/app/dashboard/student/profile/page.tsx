"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export default function StudentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ student: { id: string; stage: string } | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/student-profile", { cache: "no-store", credentials: "include" });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setProfile(data);
      } catch {
        setProfile({ student: null });
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  if (loading) {
    return <div className="mx-auto max-w-2xl p-8 text-center text-slate-500">Yükleniyor…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-slate-900">Profilim</h1>
        <p className="mt-1 text-sm text-slate-500">Hesap bilgileriniz ve başvuru durumu.</p>
      </div>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-6 border-b border-slate-100 pb-6">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-10" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Profil</p>
              <p className="text-xs text-slate-500">
                {profile?.student
                  ? `Başvuru durumu: ${profile.student.stage ?? "—"}`
                  : "Öğrenci kaydınız bulunamadı."}
              </p>
            </div>
          </div>
          <div className="mt-6 text-sm text-slate-600">
            CRM form alanları yeniden yapılandırılacak. Bu sayfa güncellenecek.
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-slate-500">
        Yardım için{" "}
        <a href="mailto:support@campusgerman.com" className="text-primary hover:underline">
          support@campusgerman.com
        </a>{" "}
        ile iletişime geçin.
      </p>
    </div>
  );
}
