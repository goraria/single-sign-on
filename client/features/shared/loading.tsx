import { cn } from "@gorth/primitive/lib/utils"
import { Spinner } from "@gorth/primitive/pattern/spinner"

export function LoadingScreen({ className }: { className?: string }) {
  return (
    <div
      aria-label="Loading"
      aria-live="polite"
      className={cn(
        className,
        "fixed inset-0 z-[9999] flex h-[100vh] min-h-[100vh] w-screen items-center justify-center overflow-hidden bg-transparent"
      )}
      role="status"
      style={{ height: "100vh", minHeight: "100vh" }}
    >
      <Spinner aria-hidden="true" size={32} variant="infinite" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
