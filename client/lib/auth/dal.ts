// client/lib/dal.ts
import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'

export const verifySession = cache(async () => {
  const response = await fetch(
    'http://localhost:8080/auth/get-session',
    {
      headers: {
        cookie: (await headers()).get('cookie') || '',
      },
    }
  )

  if (!response.ok) {
    return null
  }

  return response.json()
})

export const getUser = cache(async () => {
  const session = await verifySession()
  if (!session?.user) return null
  return session.user
})
