"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  FileText,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";

import { DETAIL_FORM_CATEGORIES, FORM_TYPE_LABEL_TR, getCategorizedDetailFormRows } from "@/data/leadFormFields";
import type { Lead, LeadNoteEntry } from "@/data/leads";
import { STAGE_LABEL } from "@/data/leads";
import { useLeadsBoard } from "@/state/LeadsBoardContext";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** API’nin döndürdüğü base64 — ham ikili yanıtın bozulmasını önler */
function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function formatNoteTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-cg-cyan-dark">{children}</h2>
  );
}

function TagsBlock({ leadId }: { leadId: string }) {
  const { getTagsForLead, removeTag } = useLeadsBoard();
  const tags = getTagsForLead(leadId);
  if (tags.length === 0) {
    return <p className="text-[13px] text-slate-600">Henüz etiket eklenmemiş.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-md bg-cg-cyan/12 px-2 py-1 text-[12px] font-semibold text-cg-cyan-dark ring-1 ring-cg-cyan/25"
        >
          {tag.label}
          <button
            type="button"
            className="rounded px-1 text-cg-red hover:bg-cg-red/10"
            onClick={() => void removeTag(leadId, tag.id).catch(() => undefined)}
            aria-label="Etiketi kaldır"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function ConsultantNoteLog({ leadId, noteLog }: { leadId: string; noteLog: LeadNoteEntry[] }) {
  const { addLeadNote } = useLeadsBoard();
  const [body, setBody] = useState("");

  const chronological = useMemo(
    () => [...noteLog].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [noteLog],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = body.trim();
    if (!t) return;
    try {
      await addLeadNote(leadId, t);
      setBody("");
    } catch {
      /* ağ hatası — sessiz; ileride toast */
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-cg-cyan/10">
      <form onSubmit={handleSubmit} className="space-y-3 px-4 pt-4">
        <label className="block">
          <span className="sr-only">Yeni not</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Danışman notu yazın…"
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-cg-cyan focus:outline-none focus:ring-2 focus:ring-cg-cyan/25"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!body.trim()}
            className="shrink-0 rounded-lg bg-cg-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Not ekle
          </button>
        </div>
      </form>

      <div className="scrollbar-kanban-filter-sm max-h-[min(42vh,380px)] overflow-y-auto overflow-x-hidden rounded-b-2xl bg-slate-50/80 px-4 pb-4 pr-1 pt-4">
        {chronological.length === 0 ? (
          <p className="text-[13px] text-slate-600">Henüz not yok. Yukarıdan ilk notu ekleyebilirsiniz.</p>
        ) : (
          <ol className="relative space-y-0 border-l border-slate-200 pl-6">
            {chronological.map((entry) => (
              <li key={entry.id} className="relative pb-8 last:pb-0">
                <span
                  className="absolute -left-[calc(0.25rem+1px)] top-1.5 h-2 w-2 rounded-full bg-cg-cyan ring-4 ring-white"
                  aria-hidden
                />
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <time className="text-[11px] font-medium tabular-nums text-slate-500" dateTime={entry.createdAt}>
                    {formatNoteTimestamp(entry.createdAt)}
                  </time>
                  <span className="text-[11px] text-slate-400">·</span>
                  <span className="text-[11px] font-semibold text-cg-cyan-dark">{entry.author ?? "Danışman"}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-800">{entry.body}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

type Props = {
  lead: Lead;
  backTo: string;
  /** Sol menüdeki pipeline adı — geri linkinde gösterilir */
  pipelineLabel: string;
};

/**
 * Lead detayı — PortalShell içinde: üst bağlam, sol özet, sağda kategorili form + not günlüğü.
 */
export function LeadDetailByDesign({ lead, backTo, pipelineLabel }: Props) {
  const [pdfPending, setPdfPending] = useState(false);
  const { setLeadLost } = useLeadsBoard();

  async function downloadBookingOfficialPdf() {
    setPdfPending(true);
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(lead.id)}/documents/booking-official`, {
        credentials: "include",
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => null)) as
        | { error?: string; pdfBase64?: string; filename?: string }
        | null;
      if (!payload) {
        window.alert("Sunucu yanıtı okunamadı.");
        return;
      }
      if (!res.ok) {
        window.alert(payload.error ?? "Belge indirilemedi");
        return;
      }
      if (!payload.pdfBase64) {
        window.alert(payload.error ?? "Sunucu PDF verisi göndermedi.");
        return;
      }
      const blob = base64ToBlob(payload.pdfBase64, "application/pdf");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        payload.filename?.replace(/[/\\?%*:|"<>]/g, "_") ??
        `CampusGerman_Booking_${lead.id.slice(0, 12)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfPending(false);
    }
  }

  const formSections = useMemo(() => {
    const rows = getCategorizedDetailFormRows(lead);
    const defs = DETAIL_FORM_CATEGORIES[lead.formType];
    return defs.map((def) => ({
      id: def.id,
      title: def.title,
      rows: rows.filter((r) => r.categoryId === def.id),
    }));
  }, [lead]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Üst: breadcrumb + kimlik */}
      <div className="shrink-0 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600" aria-label="Sayfa yolu">
          <Link href={backTo} className="inline-flex items-center gap-1.5 text-slate-600 transition hover:text-cg-cyan-dark">
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            {pipelineLabel}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
          <span className="font-medium text-slate-900">Kayıt detayı</span>
        </nav>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600">
              <Hash className="h-3 w-3" strokeWidth={2} aria-hidden />
              {lead.id}
            </span>
            <span className="rounded-full bg-cg-cyan/15 px-3 py-1 text-[11px] font-semibold text-cg-cyan-dark ring-1 ring-cg-cyan/30">
              {STAGE_LABEL[lead.stage] ?? lead.stage}
            </span>
            {lead.lost ? (
              <span className="rounded-full bg-cg-yellow/25 px-3 py-1 text-[11px] font-semibold text-slate-900 ring-1 ring-cg-yellow/50">
                Kayıp
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lead.lost ? (
              <button
                type="button"
                onClick={() => void setLeadLost(lead.id, false)}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                Kaydı geri al
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Bu kaydı kayıp olarak işaretlemek istediğinize emin misiniz? Kanbanda varsayılan görünümden kalkar.")) {
                    void setLeadLost(lead.id, true);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Kayba çek
              </button>
            )}
            {lead.formType === "booking" ? (
              <button
                type="button"
                disabled={pdfPending}
                onClick={() => void downloadBookingOfficialPdf()}
                className="inline-flex items-center gap-2 rounded-lg border border-cg-cyan/40 bg-cg-cyan/10 px-3 py-2 text-[13px] font-semibold text-cg-cyan-dark transition hover:bg-cg-cyan/18 disabled:opacity-50"
              >
                {pdfPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <FileText className="h-4 w-4" aria-hidden />
                )}
                Teklif belgesi
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          {lead.lost ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950 ring-1 ring-amber-100">
              Bu kayıt <strong>kayıp</strong> olarak işaretlendi; kanbanda yalnızca «Kayıp» filtresiyle listelenir.
            </div>
          ) : null}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start lg:gap-10">
            {/* Sol: profil kartı */}
            <aside className="space-y-4 lg:sticky lg:top-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-md ring-1 ring-cg-cyan/15">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cg-cyan/30 to-cg-yellow/25 text-lg font-bold tracking-tight text-slate-900 ring-2 ring-cg-cyan/20"
                    aria-hidden
                  >
                    {initialsFromName(lead.name)}
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-cg-cyan-dark">
                    {FORM_TYPE_LABEL_TR[lead.formType]}
                  </p>
                  <h1 className="mt-2 text-lg font-bold leading-snug text-slate-900">{lead.name}</h1>
                  <p className="mt-1 text-sm font-medium text-slate-600">{lead.course}</p>
                  {lead.value !== "—" ? (
                    <p className="mt-4 text-2xl font-bold tabular-nums text-cg-cyan-dark">{lead.value}</p>
                  ) : null}
                </div>
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-left text-[13px]">
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-cg-cyan-dark" strokeWidth={2} aria-hidden />
                    <span className="min-w-0 truncate">{lead.email}</span>
                  </a>
                  <a
                    href={`tel:${lead.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-cg-cyan-dark" strokeWidth={2} aria-hidden />
                    <span>{lead.phone}</span>
                  </a>
                  <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-slate-700">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} aria-hidden />
                    {lead.city}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <SectionTitle>Kayıt özeti</SectionTitle>
                <ul className="space-y-3 text-[13px]">
                  <li className="flex justify-between gap-3">
                    <span className="font-semibold text-cg-cyan-dark">Kaynak</span>
                    <span className="min-w-0 text-right font-medium text-slate-900">{lead.source}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="font-semibold text-cg-cyan-dark">Tarih</span>
                    <span className="inline-flex items-center gap-1.5 text-right font-medium text-slate-900">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.75} aria-hidden />
                      {lead.createdAt}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="font-semibold text-cg-cyan-dark">Öncelik</span>
                    <span className="font-medium text-slate-900">{lead.priority}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="font-semibold text-cg-cyan-dark">Dil</span>
                    <span className="font-medium text-slate-900">{lead.language}</span>
                  </li>
                </ul>
              </div>
            </aside>

            {/* Sağ: form alanları + etiket + adımlar + notlar */}
            <div className="min-w-0 space-y-10">
              <section>
                <SectionTitle>Başvuru formu</SectionTitle>
                <div className="space-y-6">
                  {formSections.map((section) => (
                    <div
                      key={section.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-cg-cyan/10"
                    >
                      <h3 className="border-b border-slate-100 bg-cg-cyan/8 px-4 py-3 text-[13px] font-bold tracking-tight text-slate-900">
                        {section.title}
                      </h3>
                      <dl className="divide-y divide-slate-100 px-4 py-1">
                        {section.rows.map((row) => (
                          <div
                            key={row.key}
                            className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)] sm:gap-8 sm:py-3.5"
                          >
                            <dt className="text-[13px] font-bold leading-snug text-cg-cyan-dark">{row.label}</dt>
                            <dd className="min-w-0 text-[15px] font-medium leading-relaxed text-slate-900">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <SectionTitle>Etiketler</SectionTitle>
                <TagsBlock leadId={lead.id} />
              </section>

              <section>
                <SectionTitle>Danışman notları</SectionTitle>
                <ConsultantNoteLog leadId={lead.id} noteLog={lead.noteLog} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
