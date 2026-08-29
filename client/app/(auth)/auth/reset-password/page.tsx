import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { LoadingScreen } from "@/features/shared/loading"
import { AuthLayout } from "@/layouts/auth"

export const metadata: Metadata = {
  title: "Reset Password",
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthLayout
        title="Reset your password"
        description="Choose a new password for your Gorth account."
        footer={
          <Link
            href="/auth/sign-in"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <ResetPasswordForm />
      </AuthLayout>
    </Suspense>
  )
}
