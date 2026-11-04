import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

type SettingsSectionProps = {
  id: string
  title: string
  description: string
  children: ReactNode
}

// Bloco de uma seção da tela: cada um salva sozinho (ações de risco diferente
// não dividem o mesmo botão "Salvar")
export const SettingsSection = ({
  id,
  title,
  description,
  children,
}: SettingsSectionProps) => (
  <Card
    role="region"
    aria-labelledby={`${id}-title`}
    className="gap-5 border border-border bg-background"
  >
    <CardHeader>
      <CardTitle id={`${id}-title`} className="text-lg font-semibold">
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">{children}</CardContent>
  </Card>
)
