import { LogoutButton } from "@/components/auth/sign-out-element"
import { LoadingScreen } from "@/features/shared/loading"
import { Suspense } from "react"
import type { Metadata } from "next"
import { AuthLayout } from "@/layouts/auth"

export const metadata: Metadata = {
  title: "Protected",
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthLayout title="Signed in" description="You are signed in to your Gorth account.">
        <LogoutButton />
      </AuthLayout>
    </Suspense>
  )
}
