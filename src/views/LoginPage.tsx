"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(from.startsWith("/") ? from : "/");
    }
  }, [status, session, router, from]);

  if (status === "authenticated") {
    return (
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[#d8e4e8]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_88%_52%_at_12%_-8%,rgba(12,192,223,0.16),transparent_54%),radial-gradient(ellipse_58%_44%_at_92%_8%,rgba(255,210,31,0.14),transparent_50%),linear-gradient(180deg,#dde8ec_0%,#ebe2dc_38%,#e5e8ec_100%)]"
          aria-hidden
        />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Geçersiz bilgiler");
        return;
      }
      router.replace(from.startsWith("/") ? from : "/");
      router.refresh();
    } catch {
      setError("Hata");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#d8e4e8] px-4 py-12 text-slate-900">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_88%_52%_at_12%_-8%,rgba(12,192,223,0.16),transparent_54%),radial-gradient(ellipse_58%_44%_at_92%_8%,rgba(255,210,31,0.14),transparent_50%),radial-gradient(ellipse_75%_48%_at_48%_102%,rgba(255,58,58,0.08),transparent_55%),linear-gradient(180deg,#dde8ec_0%,#ebe2dc_38%,#e5e8ec_100%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 shadow-lg shadow-slate-900/10 ring-1 ring-cg-cyan/25">
            {/* next/image SVG bazen prod’da boş kalır; statik dosya için <img> güvenilir */}
            <img
              src="/campus-german-logo.svg"
              alt="Campus German"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              decoding="async"
              fetchPriority="high"
            />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cg-cyan-dark">Campus German</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">CRM</h1>
          <p className="mt-1.5 text-sm text-slate-600">Pipeline ve kayıtlar için giriş yapın</p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-gradient-to-br from-white/95 via-white/90 to-slate-50/95 p-8 shadow-xl shadow-slate-900/10 ring-1 ring-cg-red/10">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">E-posta</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-cg-cyan focus:outline-none focus:ring-2 focus:ring-cg-cyan/25"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Şifre</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-cg-cyan focus:outline-none focus:ring-2 focus:ring-cg-cyan/25"
                required
              />
            </label>
            {error ? <p className="text-sm font-medium text-cg-red">{error}</p> : null}
            <button
              type="submit"
              disabled={pending || status === "loading"}
              className="w-full rounded-xl bg-gradient-to-r from-cg-cyan to-cg-cyan-dark py-3 text-sm font-semibold text-white shadow-md shadow-cg-cyan/30 transition hover:brightness-105 disabled:opacity-50"
            >
              {pending ? "Giriş yapılıyor…" : "Giriş yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
