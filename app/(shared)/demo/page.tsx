import type { Metadata } from "next"

import DemoPageFeature from "@/features/demo"

export const metadata: Metadata = {
  title: "Demo",
}

export default function DemoPage() {
  return <DemoPageFeature />
}
