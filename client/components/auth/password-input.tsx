"use client"

import { useState, type ComponentProps } from "react"
import { Eye, EyeOff } from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import { Input } from "@gorth/primitive/default/input"
import { cn } from "@gorth/primitive/lib/utils"

export interface PasswordInputProps extends ComponentProps<"input"> {
  showPasswordLabel?: string
  hidePasswordLabel?: string
}

export function PasswordInput({
  className,
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute inset-y-0 right-0"
        aria-label={visible ? hidePasswordLabel : showPasswordLabel}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  )
}
