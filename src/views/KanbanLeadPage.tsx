"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LeadDetailByDesign } from "../components/LeadDetailByDesign";
import { PortalShell } from "../components/PortalShell";
import { isKanbanDesignId, KANBAN_DESIGN_META } from "../kanban/kanbanDesigns";
import { useLeadsBoard } from "../state/LeadsBoardContext";

type Props = {
  leadId: string;
  designFrom?: string;
};

/** Kanban kart detayı — Next.js `app/(crm)/kanban/lead/[id]` üzerinden */
export default function KanbanLeadPage({ leadId, designFrom }: Props) {
  const { getLeadById, ready, loadError } = useLeadsBoard();
  const from = designFrom ?? "opportunity";
  const variant = isKanbanDesignId(from) ? from : "opportunity";
  const backTo = "/";

  if (!ready) {
    return (
      <PortalShell>
        <div className="min-h-0 flex-1" aria-hidden />
      </PortalShell>
    );
  }

  if (loadError) {
    return (
      <PortalShell>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-zinc-300">{loadError}</p>
          <Link href="/" className="text-sm text-violet-400 hover:text-violet-300">
            Ana sayfaya dön
          </Link>
        </div>
      </PortalShell>
    );
  }

  const lead = getLeadById(leadId);

  if (!lead) {
    return (
      <PortalShell>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            Kanban’a dön
          </Link>
          <p className="mt-8 text-lg text-zinc-300">Kayıt bulunamadı.</p>
          <p className="mt-2 text-center text-sm text-zinc-500">ID geçersiz veya silinmiş olabilir.</p>
        </div>
      </PortalShell>
    );
  }

  const designTitle = KANBAN_DESIGN_META[variant].title;

  return (
    <PortalShell>
      <LeadDetailByDesign lead={lead} backTo={backTo} pipelineLabel={designTitle} />
    </PortalShell>
  );
}
