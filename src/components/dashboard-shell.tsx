"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  UserCircle,
  LogOut,
  GraduationCap,
  ChevronRight,
  Bell,
  UserCog,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  CONSULTANT: "Danışman",
  STUDENT: "Öğrenci",
};

const pathToLabel: Record<string, string> = {
  admin: "Ana sayfa",
  users: "Kullanıcılar",
  assignments: "Öğrenci atamaları",
  "crm-fields": "CRM Alanları",
  "doc-fields": "Belge Alanları",
  templates: "Belge Şablonları",
  consultant: "Ana sayfa",
  students: "Öğrenciler",
  documents: "Belgeler",
  student: "Ana sayfa",
  profile: "Profilim",
};

function getBreadcrumb(pathname: string, role: string): { role: string; page: string } {
  const parts = pathname.replace("/dashboard", "").split("/").filter(Boolean);
  const rolePart = parts[0] ?? "";
  const pagePart = parts[1] ?? "";
  const roleLabel = roleLabels[role] ?? rolePart;
  const pageLabel = pathToLabel[pagePart] ?? pathToLabel[rolePart] ?? "Ana sayfa";
  return { role: roleLabel, page: pageLabel };
}

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, page } = getBreadcrumb(pathname, user.role);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-slate-200 bg-white">
        <SidebarHeader className="border-b border-slate-200 px-4 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="h-auto gap-3 px-0 hover:bg-transparent">
                <Link href="/dashboard" className="text-primary">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
                    <GraduationCap className="size-5" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-slate-900">
                    Campus German CRM
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="px-3">
          <SidebarGroup>
            <SidebarGroupLabel className="mb-1 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Panel
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={getDashboardHome(user.role)}>
                      <LayoutDashboard className="size-4" />
                      <span>Ana sayfa</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user.role === "ADMIN" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/admin/users">
                          <Users className="size-4" />
                          <span>Kullanıcılar</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/admin/assignments">
                          <UserCog className="size-4" />
                          <span>Öğrenci atamaları</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/admin/crm-fields">
                          <FileText className="size-4" />
                          <span>CRM Alanları</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/admin/doc-fields">
                          <FileText className="size-4" />
                          <span>Belge Alanları</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/admin/templates">
                          <FileText className="size-4" />
                          <span>Belge Şablonları</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                {user.role === "CONSULTANT" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/consultant/students">
                          <Users className="size-4" />
                          <span>Öğrenciler</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/consultant/documents">
                          <FileText className="size-4" />
                          <span>Belgeler</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                {user.role === "STUDENT" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/student/profile">
                          <UserCircle className="size-4" />
                          <span>Profilim</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/student/documents">
                          <FileText className="size-4" />
                          <span>Belgeler</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-slate-200 p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="h-auto gap-3 px-3 py-2.5 data-[state=open]:bg-primary/10">
                    <Avatar className="size-9 rounded-full border border-primary/20 bg-primary/10">
                      <AvatarFallback className="rounded-full text-sm font-bold text-primary">
                        {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-slate-900">
                        {user.name ?? user.email}
                      </span>
                      <span className="truncate text-xs text-slate-500">
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    Çıkış yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <SidebarTrigger className="-ml-1 size-9 rounded-lg hover:bg-slate-100" />
            <ChevronRight className="size-4" />
            <span className="font-medium text-slate-900">{role}</span>
            <ChevronRight className="size-4" />
            <span className="text-slate-700">{page}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-9 rounded-full text-slate-500 hover:bg-slate-100">
              <Bell className="size-5" />
            </Button>
            <Avatar className="size-9 rounded-full border border-primary/20 bg-primary/10">
              <AvatarFallback className="text-xs font-bold text-primary">
                {(user.name ?? user.email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-background p-6 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function getDashboardHome(role: string): string {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "CONSULTANT") return "/dashboard/consultant";
  if (role === "STUDENT") return "/dashboard/student";
  return "/dashboard";
}
