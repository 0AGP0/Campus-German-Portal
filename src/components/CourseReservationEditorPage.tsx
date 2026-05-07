"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

type Draft = {
  name: string;
  residence: string;
  courseLevel: string;
  courseStart: string;
  courseFormat: string;
  courseWeek: string;
  courseFee: string;
  extraFee: string;
  totalAmount: string;
  amountDue: string;
  paymentMethod: "full" | "partial";
  onboarding: boolean;
  housing: boolean;
  welcomePackage: boolean;
  visaRefund: boolean;
  speakClub: boolean;
};

type ApiPayload = { error?: string; filename?: string; pdfBase64?: string; draft?: Draft };

const COURSE_LEVEL_OPTIONS = [
  "A1",
  "A1, A2,",
  "A1, A2, B1",
  "A1, A2, B1, B2",
  "A1, A2, B1, B2, C1",
  "A2",
  "A2, B1",
  "A2, B1, B2",
  "A2, B1, B2, C1",
  "B1",
  "B1, B2",
  "B1, B2, C1",
  "B2",
  "B2, C1",
  "C1",
] as const;

const COURSE_START_OPTIONS = [
  "04-05-2026",
  "01-06-2026",
  "06-07-2026",
  "03-08-2026",
  "07-09-2026",
  "05-10-2026",
  "02-11-2026",
  "07-12-2026",
] as const;

const COURSE_FORMAT_OPTIONS = [
  "Hybrid (16h/w)",
  "Hybrid (20h/w)",
  "Hybrid (25h/w)",
  "In-Person (16h/w)",
  "In-Person (20h/w)",
  "In-Person (25h/w)",
  "Online (16h/w)",
  "Online (20h/w)",
  "Online (25h/w)",
] as const;

const COURSE_WEEK_OPTIONS = ["4 Week", "6 Week", "8 Week", "12 Week", "16 Week", "20 Week", "24 Week", "32 Week", "40 Week"] as const;

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function CourseReservationEditorPage({ leadId }: { leadId: string }) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("Course_Reservation.pdf");
  const firstLoadDoneRef = useRef(false);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  async function callPreview(nextDraft?: Draft, flatten = true): Promise<ApiPayload | null> {
    const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/documents/course-reservation`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(nextDraft ? { draft: nextDraft } : {}), flatten }),
    });
    const payload = (await res.json().catch(() => null)) as ApiPayload | null;
    if (!payload) {
      window.alert("Sunucu yanıtı okunamadı.");
      return null;
    }
    if (!res.ok) {
      window.alert(payload.error ?? "Belge üretilemedi.");
      return null;
    }
    return payload;
  }

  async function refreshPreview(nextDraft?: Draft) {
    setBusy(true);
    try {
      const payload = await callPreview(nextDraft ?? draft ?? undefined, true);
      if (!payload?.pdfBase64 || !payload.draft) return;
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const blob = base64ToBlob(payload.pdfBase64, "application/pdf");
      setPdfUrl(URL.createObjectURL(blob));
      // Otomatik önizlemede draft'ı sunucudan tekrar setlemek döngü yaratıyordu.
      // İlk yükte (nextDraft yokken) sunucu normalize değerini al, sonrasında kullanıcı state'ini koru.
      if (!nextDraft) setDraft(payload.draft);
      setFilename(payload.filename ?? "Course_Reservation.pdf");
    } finally {
      setBusy(false);
    }
  }

  async function approveAndDownload() {
    if (!draft) return;
    setBusy(true);
    try {
      const payload = await callPreview(draft, true);
      if (!payload?.pdfBase64) return;
      const blob = base64ToBlob(payload.pdfBase64, "application/pdf");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (payload.filename ?? filename).replace(/[/\\?%*:|"<>]/g, "_");
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useEffect(() => {
    if (!draft) return;
    if (!firstLoadDoneRef.current) {
      firstLoadDoneRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      void refreshPreview(draft);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/kanban/lead/${encodeURIComponent(leadId)}`} className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-cg-cyan-dark">
            <ArrowLeft className="h-4 w-4" />
            Lead detayına dön
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshPreview()}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Önizlemeyi yenile
            </button>
            <button
              type="button"
              onClick={() => void approveAndDownload()}
              disabled={busy || !draft}
              className="rounded-lg bg-cg-cyan px-3 py-2 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-50"
            >
              Onayla ve indir
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 h-full flex-1 gap-0 md:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="overflow-y-auto border-r border-slate-200 bg-white p-4">
          {busy && !draft ? <p className="mb-3 text-sm text-slate-500">Taslak yükleniyor...</p> : null}
          {draft ? (
            <div className="space-y-3">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] font-semibold text-emerald-900">
                PDF alan kapsamı: 16 / 16 alan düzenlenebilir (Text 6 + Dropdown 4 + Payment 1 + Checkbox 5).
              </div>
              {(
                [
                  ["name", "Name (Course Participant)"],
                  ["residence", "Residence"],
                  ["courseFee", "Course Fees"],
                  ["extraFee", "Extra Fees"],
                  ["totalAmount", "Total Amount"],
                  ["amountDue", "Amount Due"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>
                  <input
                    value={draft[k]}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cg-cyan focus:outline-none focus:ring-2 focus:ring-cg-cyan/25"
                  />
                </label>
              ))}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Course Levels (dropdown)</span>
                <select
                  value={draft.courseLevel}
                  onChange={(e) => setDraft({ ...draft, courseLevel: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-cg-cyan focus:outline-none focus:ring-2 focus:ring-cg-cyan/25"
                >
                  {COURSE_LEVEL_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Course Start (dropdown)</span>
                <select
                  value={draft.courseStart}
                  onChange={(e) => setDraft({ ...draft, courseStart: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-cg-cyan focus:outline-none focus:ring-2 focus:ring-cg-cyan/25"
                >
                  {COURSE_START_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Course Format (dropdown)</span>
                <select
                  value={draft.courseFormat}
                  onChange={(e) => setDraft({ ...draft, courseFormat: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-cg-cyan focus:outline-none focus:ring-2 focus:ring-cg-cyan/25"
                >
                  {COURSE_FORMAT_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Course Week (dropdown)</span>
                <select
                  value={draft.courseWeek}
                  onChange={(e) => setDraft({ ...draft, courseWeek: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-cg-cyan focus:outline-none focus:ring-2 focus:ring-cg-cyan/25"
                >
                  {COURSE_WEEK_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="col-span-2 rounded-md border border-slate-200 px-2 py-2">
                  <p className="mb-1 text-[11px] font-semibold text-slate-700">Payment Method (radio)</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={draft.paymentMethod === "full"}
                        onChange={() => setDraft({ ...draft, paymentMethod: "full" })}
                      />
                      Full Payment
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={draft.paymentMethod === "partial"}
                        onChange={() => setDraft({ ...draft, paymentMethod: "partial" })}
                      />
                      Partial Payment
                    </label>
                  </div>
                </div>
                {(
                  [
                    ["onboarding", "Bremen Onboarding"],
                    ["housing", "Housing Service"],
                    ["welcomePackage", "Welcome Package"],
                    ["visaRefund", "Visa Refund Guarantee"],
                    ["speakClub", "Weekly SpeakClub +3h"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-2">
                    <input type="checkbox" checked={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 h-full bg-slate-100">
          {pdfUrl ? (
            <div className="relative h-full w-full">
              <iframe
                title="Course Reservation PDF Preview"
                src={`${pdfUrl}#zoom=85`}
                className="block h-full min-h-[650px] w-full border-0"
              />
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-3 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-cg-cyan-dark ring-1 ring-slate-200 hover:bg-white"
              >
                Yeni sekmede aç
              </a>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Önizleme hazırlanıyor…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
