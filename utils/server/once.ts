export function onceAsync<T>(initialize: () => Promise<T>) {
  let pending: Promise<T> | undefined
  return () => {
    pending ??= initialize().catch((error: unknown) => {
      pending = undefined
      throw error
    })
    return pending
  }
}
