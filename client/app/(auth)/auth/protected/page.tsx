import { LogoutButton } from "@/components/auth/sign-out-element"
import { LoadingScreen } from "@/features/shared/loading"
import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Protected",
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="flex h-svh w-full items-center justify-center gap-2">
        <p>Signed in</p>
        <LogoutButton />
      </div>
    </Suspense>
  )
}
