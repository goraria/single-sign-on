import Link from "next/link"
import type { Metadata } from "next"

import { AuthLayout } from "@/layouts/auth"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password",
}

export default function Page() {
  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email address and we will send you a six-digit reset code."
      footer={
        <Link
          href="/auth/sign-in"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
