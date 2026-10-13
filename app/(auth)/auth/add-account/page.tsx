import { Suspense } from "react"
import type { Metadata } from "next"
import { AuthLayout } from "@/layouts/auth"
import { LoginForm } from "@/components/auth/sign-in-form"
import { LegalNotice } from "@/components/auth/legal-notice"
import { LoadingScreen } from "@/features/shared/loading"
export const metadata: Metadata = { title: "Add an account" }
export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthLayout
        title="Add account"
        description="Sign in without signing out of your other accounts."
        footer={<LegalNotice action="signing in" />}
      >
        <LoginForm addAccount />
      </AuthLayout>
    </Suspense>
  )
}
