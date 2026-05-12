import { SignUpForm } from '@/components/sign-up-form'
import { redirect } from 'next/navigation'
import { createServer } from '@/lib/supabase/server'

type AuthPageProps = {
  searchParams: Promise<{
    redirect?: string | string[]
  }>
}

function getRedirectValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function Page({ searchParams }: AuthPageProps) {
  const supabase = await createServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const params = await searchParams
  const redirectTo = getRedirectValue(params.redirect)

  if (user) {
    if (redirectTo) {
      redirect(`/auth/issue?redirect=${encodeURIComponent(redirectTo)}`)
    }

    redirect('/')
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  )
}
