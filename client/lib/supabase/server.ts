import { createServerClient } from 'gorth-base/cores/supabase-ssr'
import { cookies } from 'next/headers'
import {
  supabaseUrl,
  supabasePublishableKey
} from "@/lib/environment"
import  { NextRequest, NextResponse } from "next/server"

export async function createServer(request?: NextRequest, response?: NextResponse) {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          if (request && response) {
            return request.cookies.getAll()
          } else {
            return cookieStore.getAll()
          }
        },
        setAll(cookiesToSet) {
          try {
            if (request && response) {
              const req = request
              const res = response

              cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
              response = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                res.cookies.set(name, value, options)
              )
            } else {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// import { createServerClient } from 'gorth-base/cores/supabase-ssr'
// import { cookies } from 'next/headers'
//
// /**
//  * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
//  * function when using it.
//  */
// export async function createClient() {
//   const cookieStore = await cookies()
//
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return cookieStore.getAll()
//         },
//         setAll(cookiesToSet) {
//           try {
//             cookiesToSet.forEach(({ name, value, options }) =>
//               cookieStore.set(name, value, options)
//             )
//           } catch {
//             // The `setAll` method was called from a Server Component.
//             // This can be ignored if you have middleware refreshing
//             // user sessions.
//           }
//         },
//       },
//     }
//   )
// }
