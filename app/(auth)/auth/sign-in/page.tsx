import Link from "next/link"
import { Suspense } from "react"
import type { Metadata } from "next"

import { LegalNotice } from "@/components/auth/legal-notice"
import { AuthLayout } from "@/layouts/auth"
import { LoginForm } from "@/components/auth/sign-in-form"
import { LoadingScreen } from "@/features/shared/loading"

export const metadata: Metadata = {
  title: "Sign In",
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthLayout
        title="Sign in"
        description="Sign in to your Gorth account."
        footer={
          <div className="flex flex-col gap-3">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
            <LegalNotice action="signing in" />
          </div>
        }
      >
        <LoginForm />
      </AuthLayout>
    </Suspense>
  )
}
