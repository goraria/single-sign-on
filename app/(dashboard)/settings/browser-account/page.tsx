import { Suspense } from "react"
import type { Metadata } from "next"
import { BrowserAccounts } from "@/components/auth/browser-accounts"
import { LoadingScreen } from "@/features/shared/loading"
export const metadata: Metadata = { title: "Browser accounts" }
export default function Page() {
  return (
    <div className="grid max-w-xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Accounts on this browser
        </h1>
        <p className="text-muted-foreground">
          Switch accounts or sign out of a selected account.
        </p>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <BrowserAccounts />
      </Suspense>
    </div>
  )
}
