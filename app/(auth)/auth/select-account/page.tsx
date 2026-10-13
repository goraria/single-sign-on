import { Suspense } from "react"
import type { Metadata } from "next"
import { AuthLayout } from "@/layouts/auth"
import { BrowserAccounts } from "@/components/auth/browser-accounts"
import { LoadingScreen } from "@/features/shared/loading"
export const metadata: Metadata = { title: "Choose an account" }
export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthLayout
        className=""
        title="Choose an account"
        description="Continue with an account or add another Gorth account."
      >
        <BrowserAccounts />
      </AuthLayout>
    </Suspense>
  )
}
