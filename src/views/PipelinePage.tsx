"use client";

import { PipelineBoard } from "@/components/PipelineBoard";
import { PortalShell } from "@/components/PortalShell";
import { useLeadsBoard } from "@/state/LeadsBoardContext";

/** Ürün ana ekranı — Pipeline Kanban */
export default function PipelinePage() {
  const { ready, loadError, reload } = useLeadsBoard();

  if (!ready) {
    return (
      <PortalShell>
        <div className="min-h-0 flex-1" aria-hidden />
      </PortalShell>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-zinc-900 px-6 text-center">
        <p className="text-zinc-100">API’ye bağlanılamadı</p>
        <p className="max-w-md text-sm text-zinc-500">{loadError}</p>
        <button
          type="button"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500"
          onClick={() => void reload()}
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  return <PipelineBoard design="opportunity" />;
}
