import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { getAllowedOrigins, resolveRedirect } from '@/lib/formatter'

function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin')

  if (!origin || !getAllowedOrigins().includes(origin)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createServer()
  await supabase.auth.signOut()

  const returnTo = resolveRedirect(new URL(request.url).searchParams.get('returnTo'))

  return NextResponse.redirect(returnTo ?? new URL('/auth/sign-in', request.url).toString())
}

export async function POST(request: NextRequest) {
  const supabase = await createServer()
  await supabase.auth.signOut()

  return NextResponse.json(
    { ok: true },
    { headers: getCorsHeaders(request) }
  )
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  })
}


// import { NextRequest, NextResponse } from 'next/server'
// import { createServer } from '@/lib/supabase/server'
//
// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url)
//   const supabase = await createServer()
//   await supabase.auth.signOut()
//
//   const url = searchParams.get('return') as string
//
//   return NextResponse.redirect(url) //  ?? new URL('/sign-in', request.url).toString()
// }
