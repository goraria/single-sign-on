import Link from "next/link"

export function LegalNotice({ action }: { action: string }) {
  return (
    <p className="text-center text-sm leading-5 text-muted-foreground">
      <span className="block">By {action}, you agree to our</span>
      <span className="block">
        <Link
          href="/term"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </span>
    </p>
  )
}
