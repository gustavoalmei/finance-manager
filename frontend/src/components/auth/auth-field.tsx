import type { ComponentProps } from 'react'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { PasswordInput } from '#/components/ui/password-input'

type AuthFieldProps = ComponentProps<'input'> & {
  id: string
  label: string
}

const textClasses = 'text-base placeholder:text-placeholder md:text-base'
const boxClasses = 'h-13 border-2 bg-input-bg dark:bg-input-bg'

export const AuthField = ({ id, label, type, ...props }: AuthFieldProps) => (
  <div className="flex flex-col gap-2.5">
    <Label htmlFor={id} className="text-base font-bold">
      {label}
    </Label>

    {type === 'password' ? (
      <PasswordInput
        id={id}
        name={id}
        groupClassName={`${boxClasses} px-3 py-0`}
        className={textClasses}
        {...props}
      />
    ) : (
      <Input
        id={id}
        name={id}
        type={type}
        className={`${boxClasses} ${textClasses} rounded-lg px-5`}
        {...props}
      />
    )}
  </div>
)
