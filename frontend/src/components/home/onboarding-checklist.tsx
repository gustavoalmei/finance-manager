import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Circle, CircleCheck } from 'lucide-react'
import type { DashboardSummary } from '#/lib/dashboard'
import { cn } from '#/lib/utils'

type Step = {
  key: keyof DashboardSummary['onboarding']
  label: string
  to: LinkProps['to']
  optional?: boolean
}

const steps: Array<Step> = [
  { key: 'hasAccount', label: 'Criar uma conta', to: '/accounts' },
  { key: 'hasCategory', label: 'Criar categorias', to: '/categories' },
  {
    key: 'hasCard',
    label: 'Cadastrar um cartão',
    to: '/credit-card',
    optional: true,
  },
  {
    key: 'hasTransaction',
    label: 'Lançar a primeira transação',
    to: '/transactions',
  },
]

// Experimental: aparece só para quem ainda não lançou nenhuma transação
export const OnboardingChecklist = ({
  onboarding,
}: {
  onboarding: DashboardSummary['onboarding']
}) => (
  <section
    aria-labelledby="onboarding-title"
    className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
  >
    <div>
      <h2 id="onboarding-title" className="text-base font-semibold">
        Primeiros passos
      </h2>
      <p className="text-sm text-muted-foreground">
        Complete estes passos e os indicadores abaixo começam a ganhar vida.
      </p>
    </div>
    <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
      {steps.map((step) => {
        const done = onboarding[step.key]
        const Icon = done ? CircleCheck : Circle

        return (
          <li key={step.key}>
            <Link
              to={step.to}
              className={cn(
                'flex items-center gap-2 text-sm hover:underline',
                done && 'text-muted-foreground line-through',
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  'size-4',
                  done ? 'text-success' : 'text-muted-foreground',
                )}
              />
              {step.label}
              {step.optional && (
                <span className="text-xs text-muted-foreground">
                  (opcional)
                </span>
              )}
              <span className="sr-only">
                {done ? '(concluído)' : '(pendente)'}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  </section>
)
