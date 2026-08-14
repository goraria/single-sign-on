import { LogoutButton } from '@/components/auth/sign-out-element'
import { Suspense } from 'react'

export default function ProtectedPage() {
  return (
    <Suspense>
      <div className="flex h-svh w-full items-center justify-center gap-2">
        <p>Signed in</p>
        <LogoutButton />
      </div>
    </Suspense>
  )
}
