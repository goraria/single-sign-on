import { NextResponse } from "next/server"
import { getSsoMediaRegistration } from "@/services/media-registration"
import { mediaAssetIdSchema } from "@/schemas/media"

// Stable public avatar address. Media permits only ready, non-private assets;
// it signs a fresh read URL using the asset's registered storage profile.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsed = mediaAssetIdSchema.safeParse((await params).id)
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_asset" }, { status: 400 })
  const registration = await getSsoMediaRegistration().catch(() => null)
  if (!registration)
    return NextResponse.json(
      { error: "media_not_configured" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    )
  return NextResponse.redirect(
    new URL(`/media/public/${parsed.data}`, registration.identifier),
    {
      status: 307,
      headers: { "Cache-Control": "no-store" },
    }
  )
}
