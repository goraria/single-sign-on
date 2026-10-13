export interface OAuthTimeout {
  url: string
  expiresAt: number
}

// The server has already verified the signed query and exact client callback.
// Prepare while it is valid; expiry must not depend on a later network request.
export function scheduleOAuthTimeout(
  timeout: OAuthTimeout,
  navigate: (url: string) => void,
  clock: () => number = Date.now
) {
  let stopped = false
  let timer: ReturnType<typeof setTimeout>
  const check = () => {
    if (stopped) return
    clearTimeout(timer)
    const remaining = timeout.expiresAt - clock()
    if (remaining <= 0) {
      stopped = true
      navigate(timeout.url)
    } else timer = setTimeout(check, remaining)
  }
  check()
  return {
    check,
    stop() {
      stopped = true
      clearTimeout(timer)
    },
  }
}
