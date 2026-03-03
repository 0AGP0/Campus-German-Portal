"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalHeader } from "@/components/portal-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Giriş başarısız.");
        setLoading(false);
        return;
      }
      router.push(data.redirect ?? from);
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortalHeader />
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="rounded-xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-10">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold text-slate-900">
                Campus German Portal
              </h1>
              <p className="text-base text-slate-500">
                E-posta ve şifre ile giriş yapın
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  E-posta
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@campus.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Şifre
                  </Label>
                  <a href="#" className="text-xs font-semibold text-primary hover:underline">
                    Şifremi unuttum
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="remember" className="ml-2 text-sm text-slate-600">
                  Oturumumu açık tut
                </Label>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                className="h-12 w-full rounded-lg text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? "Giriş yapılıyor…" : "Giriş yap"}
              </Button>
            </form>
            <div className="mt-8 border-t border-slate-100 pt-8 text-center">
              <p className="text-sm text-slate-500">
                Hesabınız yok mu?{" "}
                <a href="mailto:admin@campusgerman.com" className="font-bold text-primary hover:underline">
                  Yönetici ile iletişime geçin
                </a>
              </p>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-6 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-slate-600">Gizlilik</a>
            <a href="#" className="hover:text-slate-600">Kullanım koşulları</a>
            <a href="#" className="hover:text-slate-600">İletişim</a>
          </div>
        </div>
      </main>
    </div>
  );
}
