import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Star } from "lucide-react";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
  onSubmitTag: (label: string) => void;
  onMarkLost: () => void;
  /** true ise «Kayba çek» gösterilmez (zaten kayıp) */
  hideMarkLost?: boolean;
  /** Kayıp kartta: panoya geri al */
  onRestoreFromLost?: () => void;
  onToggleStar: () => void;
  starred: boolean;
};

/** Sağ tık: yıldız, kayba çek / geri al, etiket */
export function LeadCardContextMenu({
  x,
  y,
  onClose,
  onSubmitTag,
  onMarkLost,
  hideMarkLost,
  onRestoreFromLost,
  onToggleStar,
  starred,
}: Props) {
  const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const left =
    typeof window !== "undefined" ? Math.max(8, Math.min(x, window.innerWidth - 268)) : x;
  const top =
    typeof window !== "undefined" ? Math.max(8, Math.min(y, window.innerHeight - 340)) : y;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] cursor-default bg-slate-900/20"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div
        className="fixed z-[201] w-[260px] rounded-xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/15 ring-1 ring-cg-cyan/15"
        style={{ left, top }}
        role="dialog"
        aria-label="Kart işlemleri"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="mb-2 flex w-full items-center gap-2 rounded-lg border border-cg-yellow/40 bg-cg-yellow/15 px-3 py-2 text-left text-[13px] font-semibold text-slate-900 transition hover:bg-cg-yellow/25"
          onClick={() => {
            onToggleStar();
            onClose();
          }}
        >
          <Star
            className={starred ? "h-4 w-4 fill-cg-yellow text-cg-yellow" : "h-4 w-4 text-cg-cyan-dark"}
            strokeWidth={starred ? 0 : 2}
            aria-hidden
          />
          {starred ? "Yıldızı kaldır" : "Yıldızla (üstte tut)"}
        </button>

        {hideMarkLost && onRestoreFromLost ? (
          <>
            <button
              type="button"
              className="mb-3 w-full rounded-lg border border-cg-cyan/45 bg-cg-cyan/12 px-3 py-2 text-left text-[13px] font-semibold text-cg-cyan-dark transition hover:bg-cg-cyan/20"
              onClick={() => {
                onRestoreFromLost();
                onClose();
              }}
            >
              Kayıptan geri al
            </button>
            <div className="mb-2 h-px bg-slate-100" />
          </>
        ) : null}

        {!hideMarkLost ? (
          <>
            <button
              type="button"
              className="mb-3 w-full rounded-lg border border-cg-yellow/50 bg-cg-yellow/15 px-3 py-2 text-left text-[13px] font-semibold text-slate-900 transition hover:bg-cg-yellow/25"
              onClick={() => {
                onMarkLost();
                onClose();
              }}
            >
              Kayba çek
            </button>
            <div className="mb-2 h-px bg-slate-100" />
          </>
        ) : null}

        <p className="text-xs font-semibold text-cg-cyan-dark">Etiket oluştur</p>
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const t = label.trim();
              if (t) onSubmitTag(t);
              onClose();
            }
          }}
          placeholder="Etiket adı…"
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cg-cyan focus:outline-none focus:ring-1 focus:ring-cg-cyan/30"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
          >
            İptal
          </button>
          <button
            type="button"
            className="rounded-lg bg-cg-cyan px-3 py-1.5 text-xs font-semibold text-white hover:brightness-105"
            onClick={() => {
              const t = label.trim();
              if (t) onSubmitTag(t);
              onClose();
            }}
          >
            Etiket ekle
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
