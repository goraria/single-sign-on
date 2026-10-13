"use client"

// SSO owns the authentication session itself. Unlike relying applications,
// it has no external OAuth token refresh route to call before retrying.
export async function withAuthRetry<T>(
  request: () => Promise<T>,
  _getStatus: (error: unknown) => number | undefined,
  _enabled = true
) {
  void _getStatus
  void _enabled
  return request()
}
