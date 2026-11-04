import { useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { FaPlus } from 'react-icons/fa6'
import { FaCheckCircle } from 'react-icons/fa'
import { IoIosArrowDown } from 'react-icons/io'
import { Button, buttonVariants } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHandle, SheetTitle, SheetTrigger } from '#/components/ui/sheet'
import { formatCurrency } from '#/lib/format'
import { useBreakpointChange } from '#/hooks/use-breakpoint-change'
import { cn } from '#/lib/utils'

export type EntityOption = {
  id: string
  label: string
  description: string | null
  amountInCents: number
  brand?: string
  lastFourDigits?: string | null
}

export type EntityDropdownLabels = {
  caption: string
  placeholder: string
  list: string
  amount: string
  empty: string
  create: string
  manage: string
}

type EntityDropdownProps<T> = {
  items: Array<T>
  value: T | null
  onChange: (item: T) => void
  toOption: (item: T) => EntityOption
  icon: ComponentType<{ className?: string }>
  labels: EntityDropdownLabels
  // só o conteúdo do item: sem <button>/<a>, o wrapper do item já é o elemento clicável
  renderItem?: (item: T, option: EntityOption, selected: boolean) => ReactNode
  // aplicado ao botão que abre a lista
  className?: string
  fnCreate: () => void
  fnManage: () => void
}

type EntityIcon = EntityDropdownProps<unknown>['icon']

export const EntityAvatar = ({ icon: Icon }: { icon: EntityIcon }) => (
  <span
    aria-hidden="true"
    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-nav-active text-white"
  >
    <Icon className="size-4" />
  </span>
)

const DefaultItem = ({ option, icon, selected }: { option: EntityOption; icon: EntityIcon; selected: boolean }) => (
  <>
    <span className="flex min-w-0 gap-2">
      <EntityAvatar icon={icon} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex gap-2 truncate text-sm font-medium leading-none">
          {option.label}
          {selected && <FaCheckCircle aria-label="Selecionado" className="size-3.5 shrink-0" />}
        </span>
        <span className="truncate text-xs text-muted-foreground">{option.description}</span>
      </span>
    </span>
    <span className="sensitive shrink-0 font-bold">{formatCurrency(option.amountInCents / 100)}</span>
  </>
)

const triggerClasses =
  'cursor-pointer select-none items-center gap-3 rounded-2xl border-2 border-border px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const itemClasses = (selected: boolean) =>
  cn(
    'cursor-pointer justify-between gap-2 rounded-md border px-2 py-3 hover:bg-muted',
    selected ? 'border-border-strong' : 'border-border',
  )

// desktop: menu posicionado · mobile: painel que sobe do rodapé.
// Troca só por CSS (md:), sem divergência entre SSR e cliente.
export const EntityDropdown = <T,>({
  items,
  value,
  onChange,
  toOption,
  icon,
  labels,
  renderItem,
  className,
  fnCreate,
  fnManage,
}: EntityDropdownProps<T>) => {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // cada layout tem o seu overlay (menu no desktop, painel no mobile):
  // ao cruzar o breakpoint, o do layout que sumiu não pode ficar aberto
  useBreakpointChange(() => {
    setSheetOpen(false)
    setMenuOpen(false)
  })
  const selectedId = value ? toOption(value).id : null

  const options = items.map((item) => {
    const option = toOption(item)
    const selected = option.id === selectedId
    const content = renderItem ? (
      renderItem(item, option, selected)
    ) : (
      <DefaultItem option={option} icon={icon} selected={selected} />
    )
    return { item, option, selected, content }
  })

  const triggerContent = (
    <>
      <EntityAvatar icon={icon} />
      {/* min-w-0 + truncate: no mobile os dois dropdowns dividem a largura */}
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <small>{labels.caption}</small>
        <span className="truncate text-[13px] font-bold">
          {value ? toOption(value).label : labels.placeholder}
        </span>
      </span>
      <IoIosArrowDown className="shrink-0" />
    </>
  )

  const listHeader = (
    <>
      <span className="text-sm font-medium text-foreground">{labels.list}</span>
      <span className="text-xs text-muted-foreground">{labels.amount}</span>
    </>
  )

  const emptyMessage = items.length === 0 && (
    <p className="px-2 py-3 text-sm text-muted-foreground">{labels.empty}</p>
  )

  // fecha o painel antes da ação (ex.: abrir o modal de criação)
  const closeSheetThen = (action: () => void) => () => {
    setSheetOpen(false)
    action()
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger className={cn(triggerClasses, 'hidden md:flex', className)}>
          {triggerContent}
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-full" align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex justify-between p-2">{listHeader}</DropdownMenuLabel>

            <div className="flex flex-col gap-1 px-2">
              {emptyMessage}
              {options.map(({ item, option, selected, content }) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => onChange(item)}
                  className={itemClasses(selected)}
                >
                  {content}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuGroup>

          <div className="flex gap-2 p-2">
            <DropdownMenuItem className={cn(buttonVariants(), 'flex-1 cursor-pointer')} onClick={fnCreate}>
              <FaPlus />
              {labels.create}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 cursor-pointer')}
              onClick={fnManage}
            >
              {labels.manage}
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger className={cn(triggerClasses, 'flex md:hidden', className)}>
          {triggerContent}
        </SheetTrigger>

        <SheetContent side="bottom" className="gap-4 px-4 pt-4">
          <SheetHandle />

          <SheetTitle className="not-sr-only flex items-center justify-between px-2">
            {listHeader}
          </SheetTitle>

          {emptyMessage}
          <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
            {options.map(({ item, option, selected, content }) => (
              <li key={option.id}>
                <button
                  type="button"
                  aria-current={selected}
                  onClick={closeSheetThen(() => onChange(item))}
                  className={cn(itemClasses(selected), 'flex w-full items-center text-left')}
                >
                  {content}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={closeSheetThen(fnCreate)}>
              <FaPlus />
              {labels.create}
            </Button>
            <Button variant="outline" className="flex-1" onClick={closeSheetThen(fnManage)}>
              {labels.manage}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
