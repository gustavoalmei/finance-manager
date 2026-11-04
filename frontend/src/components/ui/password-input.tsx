"use client"

import * as React from "react"
import { useState } from "react"
import { FaEyeSlash } from "react-icons/fa"
import { IoEyeSharp } from "react-icons/io5"
import { cn } from "#/lib/utils"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

type PasswordInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "type"
> & {
  groupClassName?: string
}

function PasswordInput({ groupClassName, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <InputGroup className={cn("pr-1", groupClassName)}>
      <InputGroupInput type={showPassword ? "text" : "password"} {...props} />
      <InputGroupAddon align="inline-end">
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          className="cursor-pointer"
        >
          {showPassword ? <IoEyeSharp /> : <FaEyeSlash />}
        </button>
      </InputGroupAddon>
    </InputGroup>
  )
}

export { PasswordInput }
