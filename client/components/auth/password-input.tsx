"use client"

import { useState, type ComponentProps } from "react"
import { Eye, EyeOff } from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import { ButtonGroup } from "@gorth/primitive/default/button-group"
import { Input } from "@gorth/primitive/default/input"

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
    <ButtonGroup className="w-full">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={className}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        tabIndex={-1}
        aria-label={visible ? hidePasswordLabel : showPasswordLabel}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </ButtonGroup>
  )
}
