import Link from "next/link"
import { Suspense } from "react"
import type { Metadata } from "next"

import { OtpForm } from "@/components/auth/one-time-password-form"
import { LoadingScreen } from "@/features/shared/loading"
import { AuthLayout } from "@/layouts/auth"

export const metadata: Metadata = {
  title: "Verify Email",
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthLayout
        title="Check your email"
        description="Enter the six-digit verification code sent to your email address."
        footer={
          <Link
            href="/auth/sign-in"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <OtpForm />
      </AuthLayout>
    </Suspense>
  )
}
