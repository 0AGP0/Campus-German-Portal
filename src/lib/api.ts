import { env } from "@/config/env";
import type { Lead } from "@/data/leads";
import type { KanbanColumnDef } from "@/lib/buildPipelineColumns";

function apiPath(path: string): string {
  const base = env.apiBaseUrl.replace(/\/$/, "");
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function fetchOpts(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

function loginHref(): string {
  const prefix = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  return prefix ? `${prefix}/login` : "/login";
}

/** 401 → giriş sayfasına yönlendir */
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(apiPath(path), fetchOpts(init));
  if (res.status === 401) {
    if (typeof globalThis.location !== "undefined") {
      globalThis.location.href = loginHref();
    }
    throw new Error("Oturum gerekli");
  }
  return res;
}

export type BootstrapPayload = {
  leads: Lead[];
  extraColumns: KanbanColumnDef[];
  /** Panoda gösterilmeyen yerleşik aşama id’leri */
  hiddenBuiltinStageIds: string[];
};

export async function apiBootstrap(): Promise<BootstrapPayload> {
  const res = await apiFetch("/api/bootstrap");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<BootstrapPayload>;
}

export async function apiPatchLead(
  id: string,
  patch: Partial<Pick<Lead, "stage" | "nextStep" | "priority" | "lost" | "starred">>,
): Promise<Lead> {
  const res = await apiFetch(`/api/leads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { lead: Lead };
  return j.lead;
}

export async function apiAddLeadNote(leadId: string, body: string, author?: string): Promise<Lead> {
  const res = await apiFetch(`/api/leads/${encodeURIComponent(leadId)}/notes`, {
    method: "POST",
    body: JSON.stringify({ body, ...(author ? { author } : {}) }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { lead: Lead };
  return j.lead;
}

export async function apiAddLeadTag(leadId: string, label: string): Promise<Lead> {
  const res = await apiFetch(`/api/leads/${encodeURIComponent(leadId)}/tags`, {
    method: "POST",
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { lead: Lead };
  return j.lead;
}

export async function apiRemoveLeadTag(leadId: string, tagId: string): Promise<Lead> {
  const res = await apiFetch(
    `/api/leads/${encodeURIComponent(leadId)}/tags/${encodeURIComponent(tagId)}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { lead: Lead };
  return j.lead;
}

export async function apiAddKanbanColumn(label: string): Promise<KanbanColumnDef> {
  const res = await apiFetch("/api/kanban/columns", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const j = (await res.json()) as { column: KanbanColumnDef };
  return j.column;
}

export async function apiRemoveKanbanColumn(columnId: string): Promise<void> {
  const res = await apiFetch(`/api/kanban/columns/${encodeURIComponent(columnId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

/** Yerleşik aşamayı panodan kaldır; o aşamadaki lead’ler başka görünür aşamaya taşınır */
export async function apiHideBuiltinStage(stageId: string): Promise<void> {
  const res = await apiFetch(`/api/kanban/builtin-stages/${encodeURIComponent(stageId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
}
