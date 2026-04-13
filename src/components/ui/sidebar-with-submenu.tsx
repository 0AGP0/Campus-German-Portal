import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";

export type SidebarWithSubmenuProps = {
  subtitle?: string;
  className?: string;
};

/**
 * Minimal sol şerit — yalnızca mevcut sayfa (Pipeline).
 * Profil / olmayan rotalar kaldırıldı.
 */
export function SidebarWithSubmenu({
  subtitle = "Pipeline",
  className,
}: SidebarWithSubmenuProps) {
  return (
    <nav
      className={cn(
        "flex h-full min-h-0 flex-col border-slate-100 bg-white px-3 py-4 text-slate-800",
        className,
      )}
    >
      <div className="mb-6 shrink-0 border-b border-slate-100 pb-4">
        <Link href="/" className="block outline-none ring-offset-2 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-cg-cyan/40">
          <Image
            src="/campus-german-logo.png"
            alt="Campus German"
            width={220}
            height={56}
            priority
            unoptimized
            className="h-12 w-auto max-w-[min(100%,13rem)] object-contain object-left"
          />
        </Link>
        <span className="mt-2 block text-xs font-semibold text-slate-600">{subtitle}</span>
      </div>

      <ul className="text-sm font-medium">
        <li>
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg bg-cg-cyan/12 px-2.5 py-2.5 text-cg-cyan-dark ring-1 ring-cg-cyan/25 transition hover:bg-cg-cyan/18"
          >
            <LayoutDashboard className="h-5 w-5 shrink-0 text-cg-cyan-dark" strokeWidth={1.5} />
            Pipeline
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default function Sidebar() {
  return <SidebarWithSubmenu />;
}
