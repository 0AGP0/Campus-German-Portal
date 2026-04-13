"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

import KanbanLeadPage from "@/views/KanbanLeadPage";

function LeadRouteBody() {
  const params = useParams();
  const searchParams = useSearchParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || typeof id !== "string") {
    return null;
  }
  const from = searchParams.get("from") ?? undefined;
  return <KanbanLeadPage leadId={id} designFrom={from} />;
}

/** İstemci rotası: async RSC + Suspense tam ekran “Yükleniyor” üretmez; bağlam zaten yüklüyse detay anında gelir. */
export default function KanbanLeadDetailPage() {
  return (
    <Suspense fallback={null}>
      <LeadRouteBody />
    </Suspense>
  );
}
