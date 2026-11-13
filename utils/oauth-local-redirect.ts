/** Local web callbacks only. Native Better Auth still requires exact registration matching. */
export function allowLocalAppRedirect(url: URL) {
  return url.protocol === "http:" && url.hostname === "localhost" &&
    /^303[0-6]$/.test(url.port) && !url.username && !url.password &&
    !url.search && !url.hash &&
    ["/auth/callback/gorth", "/"].includes(url.pathname)
}
