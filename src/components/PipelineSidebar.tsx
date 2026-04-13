"use client";

import { LogOut, PanelLeftClose, PanelRightOpen } from "lucide-react";
import { signOut } from "next-auth/react";
import { SidebarWithSubmenu } from "@/components/ui/sidebar-with-submenu";
import { cn } from "@/lib/utils";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  subtitle?: string;
};

/** Daraltılabilir sol şerit — çıkış sol alt köşede */
export function PipelineSidebar({ collapsed, onToggle, subtitle = "Pipeline" }: Props) {
  return (
    <aside
      className={cn(
        "flex h-full shrink-0 border-r border-cg-red/10 bg-gradient-to-b from-cg-red/[0.05] via-white/88 to-cg-cyan/[0.07] shadow-sm transition-[width] duration-200 ease-out",
        collapsed ? "w-[52px] min-w-[52px]" : "w-[min(100vw,20rem)] min-w-0 sm:w-80",
      )}
    >
      <div className="flex h-full min-h-0 w-[52px] min-w-[52px] shrink-0 flex-col border-r border-slate-200/80 bg-slate-100/90 py-2">
        <div className="flex shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-cg-cyan/10 hover:text-cg-cyan-dark"
            title={collapsed ? "Sidebar'ı aç" : "Sidebar'ı gizle"}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <PanelRightOpen className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            ) : (
              <PanelLeftClose className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            )}
          </button>
        </div>
        <div className="min-h-0 flex-1" />
        <div className="flex shrink-0 flex-col items-center pb-1">
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-cg-red/10 hover:text-cg-red"
            title="Çıkış"
            aria-label="Çıkış"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      {!collapsed ? (
        <div className="min-w-0 flex-1 overflow-hidden">
          <SidebarWithSubmenu subtitle={subtitle} className="border-0" />
        </div>
      ) : null}
    </aside>
  );
}
