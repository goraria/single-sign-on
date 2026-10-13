import Link from "next/link"
import type { Metadata } from "next"

import { AuthLayout } from "@/layouts/auth"

export const metadata: Metadata = {
  title: "Authentication Error",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <AuthLayout
      title="Something went wrong"
      description="We could not complete your authentication request."
      footer={
        <Link
          href="/auth/sign-in"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Try signing in again
        </Link>
      }
    >
      <p className="text-muted-foreground text-center text-sm">
        {params?.error
          ? `Error code: ${params.error}`
          : "An unspecified authentication error occurred."}
      </p>
    </AuthLayout>
  )
}
