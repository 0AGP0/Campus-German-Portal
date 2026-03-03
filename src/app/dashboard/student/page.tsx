import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, FileText, ArrowRight } from "lucide-react";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900">
          Öğrenci Paneli
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-slate-600">
          Profil bilgilerinizi güncelleyin, belgelerinizi yükleyin ve talep edilen belgeleri görüntüleyin.
        </p>
      </div>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
            <UserCircle className="size-5 text-primary" />
            Profilim
          </CardTitle>
          <CardDescription className="text-slate-600">
            CRM alanlarını doldurun ve kişisel bilgilerinizi güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="gap-2">
            <Link href="/dashboard/student/profile">
              Profil sayfasına git
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
            Yüklenen belgeleri görüntüleyin ve kendi belgelerinizi yükleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="gap-2 border-slate-200">
            <Link href="/dashboard/student/documents">
              Belgeler sayfasına git
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
