export const KANBAN_DESIGN_IDS = [
  "swiss",
  "glass",
  "brutal",
  "ledger",
  "zen",
  "aurora",
  "linear",
  "bento",
  "midnight",
  "paper",
  "opportunity",
] as const;

export type KanbanDesignId = (typeof KANBAN_DESIGN_IDS)[number];

export const KANBAN_DESIGN_META: Record<
  KanbanDesignId,
  { title: string; desc: string; tag: string }
> = {
  swiss: {
    title: "Swiss grid",
    desc: "Siyah çizgi, tipografi odaklı — dört aşama yan yana sütun.",
    tag: "Grid",
  },
  glass: {
    title: "Cam panel",
    desc: "Bulanık cam sütunlar, renkli zemin üzerinde şeffaf katmanlar.",
    tag: "Glass",
  },
  brutal: {
    title: "Brutal",
    desc: "Kalın siyah çerçeve, sarı zemin — aşamalar yan yana.",
    tag: "Bold",
  },
  ledger: {
    title: "Defter",
    desc: "Yeşil ızgara, monospace — yan yana sütunlar, numaralı satırlar.",
    tag: "Mono",
  },
  zen: {
    title: "Zen",
    desc: "Geniş boşluk, taş/kırmızı vurgu — dört sütun yatay kaydırma.",
    tag: "Sakin",
  },
  aurora: {
    title: "Aurora",
    desc: "Koyu zeminde yumuşak ışık lekeleri, kartlar önde yüzüyor.",
    tag: "Gece",
  },
  linear: {
    title: "Linear",
    desc: "İnce çizgiler, nötr gri — klasik yan yana Kanban sütunları.",
    tag: "Minimal",
  },
  bento: {
    title: "Bento",
    desc: "Pastel bento blokları, yumuşak gölgeler — yan yana sütunlar.",
    tag: "Pastel",
  },
  midnight: {
    title: "Midnight",
    desc: "Lacivert derinlik, gökyüzü mavisi vurgu — yan yana CRM sütunları.",
    tag: "Navy",
  },
  paper: {
    title: "Paper",
    desc: "Sıcak krem zemin, editoryal — yan yana aşama sütunları.",
    tag: "Kağıt",
  },
  opportunity: {
    title: "Pipeline (üretim)",
    desc: "Ana uygulama ile aynı ekran. Forma göre renkli kartlar; koyu pano.",
    tag: "CRM",
  },
};

export function isKanbanDesignId(id: string | undefined): id is KanbanDesignId {
  return !!id && (KANBAN_DESIGN_IDS as readonly string[]).includes(id);
}
