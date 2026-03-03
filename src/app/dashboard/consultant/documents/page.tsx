"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";

type StudentRow = { id: string; name: string; email: string };

export default function ConsultantDocumentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/students");
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [router]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900">
          Belgeler
        </h1>
        <p className="mt-1 text-slate-500">
          Öğrenci belgelerini yönetin. Belge yüklemek için öğrenci detayına gidin.
        </p>
      </div>
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-200 bg-slate-50/50">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="size-5 text-primary" />
            Öğrenci belgeleri
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Yükleniyor…</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500">Size atanmış öğrenci yok. Öğrenciler sayfasından yeni öğrenci ekleyebilirsiniz.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg border border-slate-100 py-3 px-4">
                  <div>
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="text-sm text-slate-500">{s.email}</p>
                  </div>
                  <Link href={`/dashboard/consultant/students/${s.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                    Belgeler
                    <ArrowRight className="size-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
