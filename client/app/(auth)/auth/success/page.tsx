import Link from "next/link"
import type { Metadata } from "next"

import { AuthLayout } from "@/layouts/auth"

export const metadata: Metadata = {
  title: "Account Created",
}

export default function Page() {
  return (
    <AuthLayout
      title="Check your email"
      description="Your account has been created successfully."
      footer={
        <Link
          href="/auth/sign-in"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <p className="text-muted-foreground text-center text-sm leading-6">
        We sent a confirmation message to your email address. Confirm your
        account before signing in.
      </p>
    </AuthLayout>
  )
}
