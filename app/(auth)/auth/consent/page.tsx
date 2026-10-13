import { Suspense } from "react"
import type { Metadata } from "next"

import { LoadingScreen } from "@/features/shared/loading"
import ConsentPage from "./"

export const metadata: Metadata = {
  title: "Consent",
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ConsentPage />
    </Suspense>
  )
}
