import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, ArrowRight } from "lucide-react";

export default function ConsultantDashboardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900">
          Danışman Paneli
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-slate-600">
          Size atanmış öğrencileri görüntüleyin, aşamalarını güncelleyin ve belge yükleyin.
        </p>
      </div>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
            <Users className="size-5 text-primary" />
            Öğrenciler
          </CardTitle>
          <CardDescription className="text-slate-600">
            Atanmış öğrenci listesi ve detayları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="gap-2">
            <Link href="/dashboard/consultant/students">
              Öğrenci listesine git
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
            <FileText className="size-5 text-primary" />
            Belgeler
          </CardTitle>
          <CardDescription className="text-slate-600">
            Öğrenci belgelerini yükleme ve yönetme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="gap-2 border-slate-200">
            <Link href="/dashboard/consultant/documents">
              Belgeler sayfasına git
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
