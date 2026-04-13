import { Calendar, Mail, MapPin, Phone, Star } from "lucide-react";
import {
  FORM_TYPE_LABEL_TR,
  getKanbanCardFieldSections,
  kanbanCardDisplaysFormDate,
} from "../data/leadFormFields";
import { leadLatestNoteBody, type Lead } from "../data/leads";
import type { KanbanDesignId } from "../kanban/kanbanDesigns";
import { useLeadsBoard } from "@/state/LeadsBoardContext";
import { cn } from "@/lib/utils";

function formatLeadCardDate(iso: string): string {
  const t = Date.parse(iso.includes("T") ? iso : `${iso}T12:00:00.000Z`);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Tone = Record<
  | "avatar"
  | "title"
  | "course"
  | "value"
  | "contact"
  | "icon"
  | "meta"
  | "notes"
  | "tag"
  | "tagMuted"
  | "next"
  | "divider",
  string
>;

export const TONES: Record<KanbanDesignId, Tone> = {
  swiss: {
    avatar:
      "flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black text-[11px] font-black group-hover:border-white group-hover:bg-white group-hover:text-black",
    title: "text-sm font-black leading-tight group-hover:text-white",
    course: "mt-1 text-[11px] font-bold uppercase tracking-wide text-black/80 group-hover:text-white/90",
    value: "shrink-0 border-2 border-black px-2 py-0.5 text-xs font-black tabular-nums group-hover:border-white group-hover:text-white",
    contact: "mt-3 space-y-1 text-[10px] font-medium leading-relaxed text-black/85 group-hover:text-white/90",
    icon: "inline h-3 w-3 opacity-70 group-hover:opacity-100",
    meta: "mt-2 flex flex-wrap items-center gap-x-1.5 text-[10px] font-bold uppercase tracking-wide text-black/70 group-hover:text-white/80",
    notes: "mt-2 line-clamp-2 text-[11px] font-medium leading-snug text-black/80 group-hover:text-white/95",
    tag: "rounded-sm border border-black px-1.5 py-0.5 text-[9px] font-black uppercase group-hover:border-white group-hover:text-white",
    tagMuted: "text-[9px] font-bold uppercase text-black/60 group-hover:text-white/75",
    next: "mt-2 border-t-2 border-black pt-2 text-[10px] font-black uppercase leading-tight group-hover:border-white group-hover:text-white",
    divider: "mt-2 h-px w-full bg-black group-hover:bg-white/40",
  },
  glass: {
    avatar: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/60 text-xs font-bold text-indigo-950 shadow-sm",
    title: "text-sm font-bold leading-tight text-slate-900",
    course: "mt-0.5 text-xs font-medium leading-snug text-slate-700",
    value: "shrink-0 rounded-lg bg-indigo-600/90 px-2 py-1 text-[11px] font-bold tabular-nums text-white shadow-sm",
    contact: "mt-3 space-y-1.5 text-[11px] leading-relaxed text-slate-800",
    icon: "mr-1 inline h-3.5 w-3.5 shrink-0 text-indigo-600",
    meta: "mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-medium text-slate-600",
    notes: "mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-700",
    tag: "rounded-md bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-indigo-900 ring-1 ring-indigo-200/60",
    tagMuted: "rounded-md bg-slate-500/15 px-2 py-0.5 text-[10px] font-medium text-slate-700",
    next: "mt-2 rounded-lg bg-white/40 px-2 py-1.5 text-[10px] font-semibold leading-snug text-slate-900 ring-1 ring-white/50",
    divider: "mt-2 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent",
  },
  brutal: {
    avatar:
      "flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white text-xs font-black",
    title: "text-sm font-black leading-tight text-black",
    course: "mt-1 text-[11px] font-black uppercase leading-snug text-black",
    value: "shrink-0 border-2 border-black bg-[#ff4081] px-2 py-0.5 text-xs font-black text-white",
    contact: "mt-2 space-y-1 font-mono text-[10px] font-bold leading-tight text-black",
    icon: "mr-1 inline h-3 w-3",
    meta: "mt-2 flex flex-wrap gap-2 text-[9px] font-black uppercase text-black",
    notes: "mt-2 line-clamp-3 border-l-4 border-black pl-2 text-[11px] font-bold leading-snug text-black",
    tag: "border-2 border-black bg-white px-1.5 py-0.5 text-[9px] font-black",
    tagMuted: "border-2 border-black bg-[#00e5ff] px-1.5 py-0.5 text-[9px] font-black",
    next: "mt-2 border-2 border-dashed border-black bg-black px-2 py-1.5 text-[10px] font-black uppercase leading-tight text-[#ffeb3b]",
    divider: "mt-2 h-0.5 bg-black",
  },
  ledger: {
    avatar: "hidden",
    title: "font-semibold leading-tight text-green-950",
    course: "mt-1 font-mono text-[11px] leading-snug text-green-900",
    value: "shrink-0 font-mono text-xs font-bold text-green-800",
    contact: "mt-2 space-y-0.5 font-mono text-[10px] text-green-900",
    icon: "mr-1 inline h-2.5 w-2.5 opacity-70",
    meta: "mt-2 font-mono text-[9px] text-green-800/90",
    notes: "mt-2 line-clamp-2 font-mono text-[10px] leading-snug text-green-950",
    tag: "font-mono text-[9px] font-bold text-green-800",
    tagMuted: "font-mono text-[9px] text-green-700/80",
    next: "mt-2 border-t border-green-600/40 pt-1.5 font-mono text-[10px] font-semibold text-green-950",
    divider: "my-2 h-px bg-green-600/30",
  },
  zen: {
    avatar:
      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-xs font-semibold text-stone-700",
    title: "font-zen text-lg leading-tight text-stone-900 group-hover:text-stone-800",
    course: "mt-2 text-sm leading-relaxed text-stone-700",
    value: "shrink-0 rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-800",
    contact: "mt-4 space-y-2 text-sm text-stone-600",
    icon: "mr-2 inline h-4 w-4 text-stone-400",
    meta: "mt-3 flex flex-wrap gap-3 text-xs text-stone-500",
    notes: "mt-4 border-l-2 border-red-700/40 pl-3 text-sm italic leading-relaxed text-stone-700",
    tag: "rounded-full bg-stone-200/80 px-2.5 py-0.5 text-xs text-stone-800",
    tagMuted: "text-xs text-stone-500",
    next: "mt-4 text-sm font-medium text-stone-800",
    divider: "mt-4 h-px w-12 bg-stone-300",
  },
  aurora: {
    avatar:
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cg-cyan/20 text-xs font-bold text-cg-cyan-dark",
    title: "text-sm font-bold leading-tight text-slate-900",
    course: "mt-1 text-xs font-medium leading-snug text-slate-600",
    value:
      "shrink-0 rounded-md bg-cg-cyan px-2 py-0.5 text-[11px] font-bold tabular-nums text-white shadow-sm",
    contact: "mt-2 space-y-1 text-[12px] font-medium text-slate-800",
    icon: "mr-1.5 inline h-3 w-3 text-cg-cyan-dark",
    meta: "mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600",
    notes: "mt-2 line-clamp-2 text-[12px] leading-relaxed text-slate-700",
    tag: "rounded-md bg-cg-yellow/25 px-2 py-0.5 text-[10px] font-bold text-slate-800 ring-1 ring-cg-yellow/40",
    tagMuted: "rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600",
    next: "mt-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold leading-snug text-slate-800",
    divider: "mt-2 h-px bg-slate-200",
  },
  linear: {
    avatar:
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-200/80 text-[11px] font-medium text-zinc-600",
    title: "text-sm font-medium leading-tight text-zinc-900",
    course: "mt-0.5 text-xs leading-snug text-zinc-500",
    value:
      "shrink-0 rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white",
    contact: "mt-3 space-y-1.5 text-[11px] leading-relaxed text-zinc-600",
    icon: "mr-1 inline h-3.5 w-3.5 shrink-0 text-zinc-400",
    meta: "mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-zinc-400",
    notes: "mt-2 line-clamp-2 text-[11px] leading-relaxed text-zinc-600",
    tag: "rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700",
    tagMuted: "text-[10px] font-medium text-zinc-500",
    next: "mt-2 border-l-2 border-zinc-300 pl-2 text-[10px] font-medium leading-snug text-zinc-800",
    divider: "mt-2 h-px w-full bg-zinc-200",
  },
  /** Pipeline kartları açık tema ile hizalı (linear ile aynı tonlar) */
  opportunity: {
    avatar:
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cg-cyan/20 text-[12px] font-bold text-cg-cyan-dark",
    title: "text-[15px] font-bold leading-tight text-slate-900",
    course: "mt-0.5 text-[13px] font-medium leading-snug text-slate-600",
    value:
      "shrink-0 rounded-md bg-cg-cyan px-2 py-0.5 text-[12px] font-bold tabular-nums text-white shadow-sm",
    contact: "mt-3 space-y-1.5 text-[13px] font-medium leading-relaxed text-slate-800",
    icon: "mr-1 inline h-3.5 w-3.5 shrink-0 text-cg-cyan-dark",
    meta: "mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-600",
    notes: "mt-2 line-clamp-2 text-[12px] font-medium leading-relaxed text-slate-800",
    tag: "rounded-md bg-cg-yellow/30 px-2 py-0.5 text-[11px] font-bold text-slate-900 ring-1 ring-cg-yellow/50",
    tagMuted: "text-[11px] font-semibold text-slate-600",
    next: "mt-2 border-l-[3px] border-cg-cyan pl-2 text-[11px] font-semibold leading-snug text-slate-900",
    divider: "mt-2 h-px w-full bg-slate-200",
  },
  bento: {
    avatar:
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 text-xs font-bold text-rose-900 shadow-sm",
    title: "text-sm font-semibold leading-tight text-stone-900",
    course: "mt-0.5 text-xs leading-snug text-stone-600",
    value:
      "shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-900 ring-1 ring-amber-200/60",
    contact: "mt-3 space-y-1.5 text-[11px] leading-relaxed text-stone-700",
    icon: "mr-1 inline h-3.5 w-3.5 shrink-0 text-rose-500",
    meta: "mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-stone-500",
    notes: "mt-2 line-clamp-2 text-[11px] leading-relaxed text-stone-600",
    tag: "rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-900 ring-1 ring-rose-200/60",
    tagMuted: "rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600",
    next: "mt-2 rounded-xl bg-stone-50 px-2 py-1.5 text-[10px] font-medium leading-snug text-stone-800 ring-1 ring-stone-200/80",
    divider: "mt-2 h-px bg-gradient-to-r from-rose-200/40 via-amber-200/50 to-transparent",
  },
  midnight: {
    avatar:
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-xs font-semibold text-sky-100",
    title: "text-sm font-medium leading-tight text-white",
    course: "mt-1 text-xs leading-snug text-slate-400",
    value: "shrink-0 rounded-md bg-sky-500/25 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-sky-100",
    contact: "mt-2 space-y-1 text-[11px] text-slate-400",
    icon: "mr-1.5 inline h-3 w-3 text-sky-500/80",
    meta: "mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500",
    notes: "mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-400",
    tag: "rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] font-medium text-sky-200",
    tagMuted: "rounded-md bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-400",
    next: "mt-2 rounded-lg border border-sky-500/25 bg-slate-950/60 px-2 py-1.5 text-[10px] leading-snug text-slate-200",
    divider: "mt-2 h-px bg-slate-700/70",
  },
  paper: {
    avatar:
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-amber-900/15 bg-amber-50 text-xs font-semibold text-amber-950",
    title: "text-sm font-semibold leading-tight text-amber-950",
    course: "mt-1 text-xs leading-snug text-amber-900/75",
    value:
      "shrink-0 border border-amber-900/20 bg-white px-2 py-0.5 text-[11px] font-medium tabular-nums text-amber-950 shadow-sm",
    contact: "mt-3 space-y-1.5 text-[11px] leading-relaxed text-amber-950/90",
    icon: "mr-1 inline h-3.5 w-3.5 shrink-0 text-amber-800/60",
    meta: "mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-amber-900/65",
    notes: "mt-2 line-clamp-2 text-[11px] italic leading-relaxed text-amber-950/85",
    tag: "rounded-sm border border-amber-900/20 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-amber-950",
    tagMuted: "text-[10px] font-medium text-amber-900/70",
    next: "mt-2 border-t border-amber-900/15 pt-2 text-[10px] font-medium leading-snug text-amber-950",
    divider: "mt-2 h-px bg-amber-900/12",
  },
};

function LedgerBody({ lead }: { lead: Lead }) {
  const t = TONES.ledger;
  const notePreview = leadLatestNoteBody(lead);
  return (
    <div className="text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={t.title}>{lead.name}</p>
          <p className={t.course}>{lead.course}</p>
        </div>
        {lead.value !== "—" ? <span className={t.value}>{lead.value}</span> : null}
      </div>
      <div className={t.divider} />
      <div className={t.contact}>
        <p className="flex items-start gap-1">
          <Mail className={t.icon} strokeWidth={1.75} />
          <span className="min-w-0 break-all">{lead.email}</span>
        </p>
        <p className="flex items-center gap-1">
          <Phone className={t.icon} strokeWidth={1.75} />
          {lead.phone}
        </p>
      </div>
      <p className={t.meta}>
        {lead.city} | {lead.source} | {lead.createdAt}
      </p>
      {notePreview ? <p className={t.notes}>{notePreview}</p> : null}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] text-green-900">
        <span>
          PR:{lead.priority} · LANG:{lead.language}
        </span>
      </div>
      <p className={t.next}>NEXT: {lead.nextStep}</p>
    </div>
  );
}

function AuroraKanbanLeadBody({ lead }: { lead: Lead }) {
  const t = TONES.aurora;
  const sections = getKanbanCardFieldSections(lead);
  const { getTagsForLead, removeTag } = useLeadsBoard();
  const tags = getTagsForLead(lead.id);
  const message = (lead.formData.message ?? "").trim();

  return (
    <div className="relative text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 gap-2">
          <div
            className={cn(
              t.avatar,
              "h-8 w-8 shrink-0 text-[11px] ring-1 ring-cg-cyan/25 shadow-sm",
            )}
          >
            {initials(lead.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn(t.title, "line-clamp-2 text-[14px] leading-tight tracking-tight")}>{lead.name}</p>
            <span className="mt-0.5 inline-flex max-w-full rounded bg-cg-yellow/25 px-1.5 py-px text-[10px] font-bold text-slate-800 ring-1 ring-cg-yellow/40">
              {FORM_TYPE_LABEL_TR[lead.formType]}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {lead.starred ? (
            <Star className="h-3.5 w-3.5 shrink-0 fill-cg-yellow text-cg-yellow" strokeWidth={0} aria-hidden />
          ) : null}
          {lead.value !== "—" ? (
            <span className={cn(t.value, "max-w-[5rem] truncate text-[11px]")}>{lead.value}</span>
          ) : null}
        </div>
      </div>

      <div className={cn(t.divider, "my-1.5")} />

      {sections.length > 0 ? (
        <div className="space-y-2">
          {sections.map((sec) => (
            <div
              key={sec.title}
              className="overflow-hidden rounded-lg border border-cg-red/12 bg-gradient-to-br from-white via-cg-red/[0.03] to-cg-cyan/[0.04] shadow-sm shadow-slate-900/[0.04] ring-1 ring-cg-cyan/10"
            >
              <div className="flex items-center gap-2 border-b border-cg-red/10 bg-gradient-to-r from-cg-red/[0.08] via-white to-cg-cyan/[0.08] px-2 py-1">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cg-red/80 ring-1 ring-cg-red/30" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-wide text-cg-cyan-dark">{sec.title}</p>
              </div>
              <ul className="divide-y divide-slate-100/90 px-2 py-1">
                {sec.rows.map((row, idx) => (
                  <li key={`${sec.title}-${idx}-${row.label}`} className="py-1.5 first:pt-1 last:pb-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
                    <p className="mt-0.5 text-[12px] font-semibold leading-snug text-slate-950" title={row.value}>
                      {row.value}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="group/tag inline-flex max-w-full items-center gap-0.5 rounded bg-cg-cyan/12 pl-1 pr-0.5 text-[9px] font-bold text-cg-cyan-dark ring-1 ring-cg-cyan/25"
            >
              <span className="truncate">{tag.label}</span>
              <button
                type="button"
                className="shrink-0 rounded p-px text-cg-red hover:bg-cg-red/10"
                aria-label="Etiketi kaldır"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeTag(lead.id, tag.id);
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {message ? (
        <div className="mt-1.5 rounded-lg border border-cg-red/15 bg-gradient-to-br from-cg-red/[0.04] to-slate-50/80 px-2 py-1.5 ring-1 ring-slate-100">
          <p className="text-[9px] font-bold uppercase tracking-wide text-cg-red">Mesaj</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-800">{message}</p>
        </div>
      ) : null}

      {!kanbanCardDisplaysFormDate(lead) ? (
        <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-500">
          <Calendar className="h-3 w-3 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
          <span>Oluşturulma: {formatLeadCardDate(lead.createdAt)}</span>
        </p>
      ) : null}
    </div>
  );
}

export function KanbanDenseCard({ lead, variant }: { lead: Lead; variant: KanbanDesignId }) {
  if (variant === "ledger") {
    return <LedgerBody lead={lead} />;
  }

  if (variant === "aurora") {
    return <AuroraKanbanLeadBody lead={lead} />;
  }

  const t = TONES[variant];
  const showAvatar = true;
  const notePreview = leadLatestNoteBody(lead);

  return (
    <div className="text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 gap-2.5">
          {showAvatar ? (
            <div className={t.avatar}>{initials(lead.name)}</div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className={t.title}>{lead.name}</p>
            <p className={t.course}>{lead.course}</p>
          </div>
        </div>
        {lead.value !== "—" ? <span className={t.value}>{lead.value}</span> : null}
      </div>

      <div className={t.divider} />

      <div className={t.contact}>
        <p className="flex items-start gap-1">
          <Mail className={t.icon} strokeWidth={1.75} />
          <span className="min-w-0 break-all">{lead.email}</span>
        </p>
        <p className="flex items-center gap-1">
          <Phone className={t.icon} strokeWidth={1.75} />
          {lead.phone}
        </p>
      </div>

      <div className={t.meta}>
        <span className="inline-flex items-center gap-1">
          <MapPin className="inline h-3 w-3 shrink-0 opacity-70" strokeWidth={1.75} />
          {lead.city}
        </span>
        <span>·</span>
        <span>{lead.source}</span>
        <span>·</span>
        <span className="inline-flex items-center gap-0.5">
          <Calendar className="inline h-3 w-3" strokeWidth={1.75} />
          {lead.createdAt}
        </span>
      </div>

      {notePreview ? <p className={t.notes}>{notePreview}</p> : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={t.tag}>Öncelik {lead.priority}</span>
        <span className={t.tag}>{lead.language}</span>
      </div>

      {variant === "zen" ? <div className={t.divider} /> : null}

      <p className={t.next}>
        {variant === "zen" ? <span className="text-stone-500">Sonraki adım · </span> : null}
        {lead.nextStep}
      </p>
    </div>
  );
}
