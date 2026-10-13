"use client"

import NotFoundPage from "@gorth/primitive/pages/not-found"

export default function GlobalError({
  error: _error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  void _error
  void _reset
  return (
    <html>
      <body>
        <NotFoundPage />
      </body>
    </html>
  )
}
