import Link from "next/link";

import { cn } from "@/lib/utils";

type PageBackProps = {
  to?: string;
  label?: string;
  className?: string;
};

/** Kanban ana sayfasına dönüş */
export function PageBack({ to = "/", label = "Ana sayfa", className }: PageBackProps) {
  return (
    <Link
      href={to}
      className={cn(
        "inline-flex text-sm font-medium text-zinc-500 transition hover:text-zinc-900",
        className,
      )}
    >
      ← {label}
    </Link>
  );
}
