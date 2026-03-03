"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Upload, Download, User, HeadphonesIcon, Trash2 } from "lucide-react";

type DocRow = { id: string; filename: string; createdAt: string; uploadedBy: string };

export default function StudentDocumentsPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function fetchData() {
    try {
      const profileRes = await fetch("/api/student-profile");
      if (profileRes.status === 401 || profileRes.status === 403) {
        router.push("/login");
        return;
      }
      const profile = await profileRes.json();
      const sid = profile.student?.id;
      const uid = profile.student?.userId;
      if (!sid) {
        setStudentId(null);
        setDocuments([]);
        setLoading(false);
        return;
      }
      setStudentId(sid);
      setCurrentUserId(uid ?? null);
      const docsRes = await fetch(`/api/documents?studentId=${sid}`);
      const docs = await docsRes.json();
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch {
      setDocuments([]);
      setStudentId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !studentId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("studentId", studentId);
      form.set("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (res.ok) {
        fetchData();
        router.refresh();
      }
      e.target.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  }

  const consultantDocs = documents.filter((d) => d.uploadedBy !== currentUserId);
  const myDocs = documents.filter((d) => d.uploadedBy === currentUserId);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Yükleniyor…</div>;
  }

  if (!studentId) {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Belgelerim</h1>
        <p className="text-slate-500">Öğrenci kaydınız bulunamadı. Lütfen yönetici ile iletişime geçin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Belgelerim
          </h1>
          <p className="mt-1 text-slate-500">
            Akademik ve seyahat belgelerinizi görüntüleyin ve yükleyin.
          </p>
        </div>
        <Button variant="secondary" className="gap-2 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20" disabled>
          <FileText className="size-5" />
          Şablondan PDF oluştur (yakında)
        </Button>
      </div>
      <section>
        <div className="mb-6 flex items-center gap-2">
          <HeadphonesIcon className="size-5 text-primary" />
          <h2 className="text-xl font-bold text-slate-900">
            Danışmanın yüklediği belgeler
          </h2>
        </div>
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50/50">
                <TableHead className="uppercase tracking-wider text-slate-500">Dosya adı</TableHead>
                <TableHead className="uppercase tracking-wider text-slate-500">Tarih</TableHead>
                <TableHead className="text-right uppercase tracking-wider text-slate-500">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultantDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-slate-500">
                    Danışman henüz belge yüklemedi.
                  </TableCell>
                </TableRow>
              ) : (
                consultantDocs.map((d) => (
                  <TableRow key={d.id} className="transition-colors hover:bg-slate-50/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-red-500" />
                        <span className="text-sm font-medium text-slate-700">{d.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDate(d.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <a href={`/api/documents/${d.id}`} download className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                        <Download className="size-4" />
                        İndir
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </section>
      <section>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            <h2 className="text-xl font-bold text-slate-900">
              Yüklediğim belgeler
            </h2>
          </div>
          <label className="inline-flex cursor-pointer">
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50">
              <Upload className="size-5" />
              {uploading ? "Yükleniyor…" : "Belge yükle"}
            </span>
          </label>
        </div>
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50/50">
                <TableHead className="uppercase tracking-wider text-slate-500">Dosya adı</TableHead>
                <TableHead className="uppercase tracking-wider text-slate-500">Tarih</TableHead>
                <TableHead className="text-right uppercase tracking-wider text-slate-500">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-slate-500">
                    Henüz belge yüklemediniz.
                  </TableCell>
                </TableRow>
              ) : (
                myDocs.map((d) => (
                  <TableRow key={d.id} className="transition-colors hover:bg-slate-50/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">{d.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDate(d.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-4">
                        <a href={`/api/documents/${d.id}`} download className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                          <Download className="size-4" />
                          İndir
                        </a>
                        <Button variant="ghost" size="icon" className="size-9 text-slate-400 hover:text-red-500" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
