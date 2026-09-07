import { Button } from "@gorth/primitive/custom/button"
import {
  AtSign,
  CodeXml,
  LinkIcon,
  MessageCircle,
  Play,
} from "@gorth/primitive/cores/lucide"
import { appGlobal } from "@/lib/utils/constant"

export function Copyright() {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="sm:text-sm">
        © {new Date().getFullYear()} Gorth, Inc. All rights reserved.
      </span>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          nativeButton={false}
          render={
            <a
              href={appGlobal.twitter}
              target="_blank"
              rel="noreferrer"
              aria-label="Gorth on X"
            />
          }
          variant="ghost"
          size="icon"
        >
          <AtSign className="size-4" />
        </Button>
        <Button
          nativeButton={false}
          render={
            <a
              href="https://www.linkedin.com/company/gorth"
              target="_blank"
              rel="noreferrer"
              aria-label="Gorth on LinkedIn"
            />
          }
          variant="ghost"
          size="icon"
        >
          <LinkIcon className="size-4" />
        </Button>
        <Button
          nativeButton={false}
          render={
            <a
              href="https://discord.gg/gorth"
              target="_blank"
              rel="noreferrer"
              aria-label="Gorth on Discord"
            />
          }
          variant="ghost"
          size="icon"
        >
          <MessageCircle className="size-4" />
        </Button>
        <Button
          nativeButton={false}
          render={
            <a
              href={appGlobal.github}
              target="_blank"
              rel="noreferrer"
              aria-label="Gorth on GitHub"
            />
          }
          variant="ghost"
          size="icon"
        >
          <CodeXml className="size-4" />
        </Button>
        <Button
          nativeButton={false}
          render={
            <a
              href={appGlobal.youtube}
              target="_blank"
              rel="noreferrer"
              aria-label="Gorth on YouTube"
            />
          }
          variant="ghost"
          size="icon"
        >
          <Play className="size-4" />
        </Button>
      </div>
    </div>
  )
}
