'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { Button } from '@gorth/primitive/default/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@gorth/primitive/default/card'

export function SocialForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('redirect') ?? '/'
  const oauthQuery = new URLSearchParams(searchParams.toString())
  const isOAuthFlow = Boolean(
    oauthQuery.get("client_id") &&
    oauthQuery.get("redirect_uri") &&
    oauthQuery.get("response_type")
  )
  const isExternalRedirect = () => {
    try {
      const target = new URL(next)
      return ["http:", "https:"].includes(target.protocol)
    } catch {
      return false
    }
  }
  const getCallbackURL = () => {
    if (isOAuthFlow) {
      return `${window.location.origin}/auth/oauth?${oauthQuery.toString()}`
    }

    if (isExternalRedirect()) {
      return `${window.location.origin}/auth/error?error=legacy_sso_issue_disabled`
    }

    return `${window.location.origin}/auth/oauth?next=${encodeURIComponent(next)}`
  }

  const handleSocialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await auth.signIn.social({
        provider: 'google',
        callbackURL: getCallbackURL(),
        errorCallbackURL: `${window.location.origin}/auth/error`,
      })

      if (error) {
        setError(error.message ?? 'Google sign in failed')
        setIsLoading(false)
        return
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Continue with Google</CardTitle>
          <CardDescription>Use your Google account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSocialLogin}>
            <div className="flex flex-col gap-6">
              {error && <p className="text-sm text-destructive-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Redirecting...' : 'Sign in with Google'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
