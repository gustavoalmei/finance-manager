import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Button, buttonVariants } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { cn } from '#/lib/utils'

type AuthActionsProps = {
  submitLabel: string
  isPending: boolean
  altLabel: string
  altTo: LinkProps['to']
}

const actionClasses = 'h-12.5 cursor-pointer text-base font-bold rounded-xl'

export const AuthActions = ({ submitLabel, isPending, altLabel, altTo }: AuthActionsProps) => (
  <>
    <Button type="submit" disabled={isPending} className={actionClasses}>
      {submitLabel}
    </Button>

    <Separator className="my-0.75 h-0.5 bg-border" />

    <Link to={altTo} className={cn(buttonVariants({ variant: 'secondary' }), actionClasses)}>
      {altLabel}
    </Link>
  </>
)
