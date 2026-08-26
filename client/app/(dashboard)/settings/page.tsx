import { DashboardOverview } from "@/components/dashboard-overview";
import { getSession } from "@/services/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  return <DashboardOverview />;
}
