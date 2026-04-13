import { useCallback, useState, type ReactNode } from "react";

import { PipelineSidebar } from "@/components/PipelineSidebar";

const SIDEBAR_COLLAPSED_KEY = "crm-sidebar-collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(v: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

type PortalShellProps = {
  children: ReactNode;
  /** Sol menü alt başlığı */
  sidebarSubtitle?: string;
};

/**
 * CRM portal kabuğu — Pipeline ve detay sayfaları aynı sidebar + ana alan düzenini kullanır.
 */
export function PortalShell({ children, sidebarSubtitle = "Pipeline" }: PortalShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      writeCollapsed(next);
      return next;
    });
  }, []);

  return (
    <div className="relative flex h-[100dvh] min-h-0 overflow-hidden bg-[#d8e4e8] text-slate-900">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_88%_52%_at_12%_-8%,rgba(12,192,223,0.16),transparent_54%),radial-gradient(ellipse_58%_44%_at_92%_8%,rgba(255,210,31,0.14),transparent_50%),radial-gradient(ellipse_75%_48%_at_48%_102%,rgba(255,58,58,0.11),transparent_55%),linear-gradient(180deg,#dde8ec_0%,#ebe2dc_38%,#e5e8ec_100%)]"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <PipelineSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} subtitle={sidebarSubtitle} />
        {/*
          backdrop-blur, fixed konumlu DragOverlay ile uyumsuz: içeren blok oluşturur,
          dnd-kit viewport rect kullandığı için kart imleçten kayar. Bulanıklık yerine opaklık kullan.
        */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l border-cg-red/10 bg-gradient-to-br from-white/80 via-white/75 to-slate-100/85 shadow-[inset_1px_0_0_rgba(12,192,223,0.1)]">{children}</div>
      </div>
    </div>
  );
}
