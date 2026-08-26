'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { auth } from '@/lib/auth'
import { Button } from '@gorth/primitive/custom/button'

export function LogoutButton() {
  const router = useRouter()

  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') as string

  const logout = async () => {
    await auth.signOut()
    router.push(redirect ? redirect : '/')
  }

  return <Button onClick={logout}>Logout</Button>
}
