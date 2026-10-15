import { Suspense } from "react"
import { LoadingScreen } from "@/features/shared/loading"
import { DashboardRedirect } from "@/features/role-dashboard/redirect"

export default function Page() {
  return (
    <>
      <LoadingScreen />
      <Suspense fallback={null}>
        <DashboardRedirect />
      </Suspense>
    </>
  )
}
