'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Button } from 'gorth-ui/default/button'

export function LogoutButton() {
  const router = useRouter()

  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') as string

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(redirect ? redirect : '/')
  }

  return <Button onClick={logout}>Logout</Button>
}
