"use client";

import Link from "next/link";
import { GraduationCap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Tüm portal sayfalarında kullanılan tek header.
 * Login sayfasında ve dashboard'da aynı görünüm (logo + sağ aksiyon).
 */
export function PortalHeader({
  rightAction = "support",
}: {
  rightAction?: "support" | "user";
}) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 md:px-10">
      <Link href="/" className="flex items-center gap-3 text-primary">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
          <GraduationCap className="size-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Campus German Portal
        </span>
      </Link>
      {rightAction === "support" && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:bg-primary/10 hover:text-primary"
          asChild
        >
          <a href="mailto:support@campusgerman.com">
            <HelpCircle className="mr-2 size-4" />
            Destek
          </a>
        </Button>
      )}
    </header>
  );
}
