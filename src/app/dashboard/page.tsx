import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "ADMIN") redirect("/dashboard/admin");
  if (session.role === "CONSULTANT") redirect("/dashboard/consultant");
  if (session.role === "STUDENT") redirect("/dashboard/student");

  redirect("/dashboard/admin");
}
