import { NextResponse } from "next/server"
import { createServer } from "@/lib/supabase/server"
import { resolveRedirect } from "@/lib/formatter"

export const runtime = "nodejs"

function buildAppExchangeUrl(
  redirect: string,
  tokens: { access_token: string; refresh_token?: string }
) {
  const target = new URL(redirect)
  const next = `${target.pathname}${target.search}${target.hash}` || "/"

  target.pathname = "/auth/exchange"
  target.search = ""
  target.hash = ""
  target.searchParams.set("token", tokens.access_token)
  if (tokens.refresh_token) {
    target.searchParams.set("refresh_token", tokens.refresh_token)
  }
  target.searchParams.set("next", next)

  return target.toString()
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createServer()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user?.email && data.session?.access_token) {
      const externalTarget = resolveRedirect(redirectTo) ?? resolveRedirect(next)

      if (externalTarget) {
        return NextResponse.redirect(
          buildAppExchangeUrl(externalTarget, {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })
        )
      }

      const relativeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/'
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${relativeNext}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${relativeNext}`)
      } else {
        return NextResponse.redirect(`${origin}${relativeNext}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
