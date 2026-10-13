import { ServiceOverview } from "@/features/admin/services"

export const metadata = { title: "Notifications" }
export default function Page() {
  return <ServiceOverview slug="notification" />
}
