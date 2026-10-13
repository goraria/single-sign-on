import "server-only"
import AppModule from "@/app/api"

let application: ReturnType<typeof AppModule> | undefined

// Reuse middleware/router composition per worker; retry a failed initialization.
export async function fetchApi(request: Request): Promise<Response> {
  try {
    application ??= AppModule()
    const app = await application
    return await app.fetch(request)
  } catch {
    application = undefined
    return Response.json(
      { error: "sso_unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    )
  }
}
