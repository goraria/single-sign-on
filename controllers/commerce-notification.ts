import { HTTPException } from "hono/http-exception"
import { isInsufficientScopeError } from "better-auth/oauth2"
import { commerceRecipientQuery } from "@/schemas/commerce-notification"
import { requireCommerceNotificationClient } from "@/lib/auth/server/commerce-notification"
import { getCommerceNotificationRecipients as getCommerceNotificationRecipientsServices } from "@/services/commerce-notification"

export async function getCommerceNotificationRecipients(request: Request) {
  const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache", "X-Content-Type-Options": "nosniff" }
  try {
    const input = commerceRecipientQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams))
    if (!input.success) return Response.json({ error: "invalid_recipient_query" }, { status: 400, headers })
    await requireCommerceNotificationClient(request, input.data.application)
    return Response.json(await getCommerceNotificationRecipientsServices(input.data), { headers })
  } catch (error) {
    const status = error instanceof HTTPException ? error.status :
      isInsufficientScopeError(error) ? 403 :
      /^(ERR_JWT|ERR_JWS|ERR_JOSE)/.test((error as { code?: string })?.code ?? "") ? 401 : 503
    return Response.json({ error: status === 401 ? "unauthorized" : status === 403 ? "forbidden" : "commerce_recipients_unavailable" }, { status, headers })
  }
}
