import { redirect } from "next/navigation";
import { AppsView } from "@/components/apps-view";
import { getSession } from "@/services/auth";

export default async function AppsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (session.user.role !== "administrator") {
    return <div>Access Denied</div>;
  }
  return <AppsView />;
}
