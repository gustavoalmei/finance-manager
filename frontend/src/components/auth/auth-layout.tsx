import type { ReactNode, SubmitEvent } from 'react'
import { ModeToggle } from '#/components/mode-toggle'
import { Card, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Carousel } from './carousel'

type AuthLayoutProps = {
  title: string
  description: string
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void
  children: ReactNode
}

export const AuthLayout = ({ title, description, onSubmit, children }: AuthLayoutProps) => (
  <div className="grid min-h-full w-full grid-flow-col grid-cols-1 grid-rows-1 gap-5 p-7.5 lg:grid-cols-[.75fr_1fr]">
    <Card className="relative w-full gap-0 rounded-panel border border-border p-0 ring-0">
      <div className="absolute top-4 left-4 z-10">
        <ModeToggle />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center-safe px-6 pt-16 pb-10 md:px-25">
        <form onSubmit={onSubmit} className="flex w-full max-w-137.75 flex-col gap-5">
          <CardHeader className="justify-items-center gap-2.5 px-0 text-center">
            <CardTitle className="text-4xl font-bold">{title}</CardTitle>
            <CardDescription className="text-xl">{description}</CardDescription>
          </CardHeader>

          {children}
        </form>
      </div>
    </Card>

    <div className="relative overflow-hidden rounded-panel not-lg:hidden">
      <div className="absolute inset-0">
        <Carousel />
      </div>
    </div>
  </div>
)
