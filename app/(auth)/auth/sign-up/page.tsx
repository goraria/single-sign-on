import Link from "next/link"
import { Suspense } from "react"
import type { Metadata } from "next"

import { LegalNotice } from "@/components/auth/legal-notice"
import { AuthLayout } from "@/layouts/auth"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { LoadingScreen } from "@/features/shared/loading"

export const metadata: Metadata = {
  title: "Sign Up",
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthLayout
        title="Create an account"
        description="Create your Gorth account with your email address."
        footer={
          <div className="flex flex-col gap-3">
            <p>
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
            <LegalNotice action="creating an account" />
          </div>
        }
      >
        <SignUpForm />
      </AuthLayout>
    </Suspense>
  )
}
