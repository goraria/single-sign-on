import { redirect } from "next/navigation";
import { TasksView } from "@/components/tasks-view";
import { getSession } from "@/services/auth";

export default async function TasksPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (session.user.role !== "administrator") {
    return <div>Access Denied</div>;
  }
  return <TasksView />;
}
