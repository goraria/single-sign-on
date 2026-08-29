import type { Metadata } from "next"

import ConnectionsPageFeature from "@/features/settings/connections"

export const metadata: Metadata = {
  title: "Connections",
}

export default function ConnectionsPage() {
  return <ConnectionsPageFeature />
}
