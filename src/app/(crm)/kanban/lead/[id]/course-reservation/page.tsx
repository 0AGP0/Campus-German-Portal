"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { CourseReservationEditorPage } from "@/components/CourseReservationEditorPage";

function RouteBody() {
  const params = useParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || typeof id !== "string") return null;
  return <CourseReservationEditorPage leadId={id} />;
}

export default function CourseReservationPageRoute() {
  return (
    <Suspense fallback={null}>
      <RouteBody />
    </Suspense>
  );
}
