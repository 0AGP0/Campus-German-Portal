"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LeadsBoardProvider } from "@/state/LeadsBoardContext";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="h-[100dvh] min-h-0 bg-[#d8e4e8]" aria-hidden />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <LeadsBoardProvider>{children}</LeadsBoardProvider>;
}
