import Link from "next/link";
import { PortalHeader } from "@/components/portal-header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortalHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Campus German CRM Portal</h1>
        <p className="text-center text-slate-600">
          Giriş yaparak panele erişebilirsiniz.
        </p>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          Giriş yap
        </Link>
      </main>
    </div>
  );
}
