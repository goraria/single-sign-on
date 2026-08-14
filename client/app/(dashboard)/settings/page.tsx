import { DashboardOverview } from "@/components/dashboard-overview";
import { getSession } from "@/services/auth";
import { redirect } from "next/navigation";
import NotAuthorizedPage from "@gorth/primitive/pages/not-authorized"

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "administrator") {
    return <NotAuthorizedPage/>;
  }

  return <DashboardOverview />;
}
