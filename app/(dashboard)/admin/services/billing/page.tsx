import { ServiceOverview } from "@/features/admin/services"

export const metadata = { title: "Billing" }
export default function Page() {
  return <ServiceOverview slug="billing" />
}
