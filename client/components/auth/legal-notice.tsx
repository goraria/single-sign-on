import Link from "next/link"

export function LegalNotice({ action }: { action: string }) {
  return (
    <p className="text-muted-foreground text-center text-sm leading-5">
      <span className="block">By {action}, you agree to our</span>
      <span className="block">
        <Link
          href="/terms"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </span>
    </p>
  )
}
