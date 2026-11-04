"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "#/lib/utils"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group"
import { Skeleton } from "./skeleton"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export type TableColumn<T> = {
  label: string
  // chave do item exibida nesta coluna
  value: keyof T & string
}

export type TableEmptyState = {
  title: string
  description?: string
  // ex.: botão de criar o primeiro item
  action?: React.ReactNode
}

type TableCustomProps<T> = {
  label: string
  items: Array<T>
  columns: Array<TableColumn<T>>
  isLoading?: boolean
  getRowKey?: (item: T, index: number) => React.Key
  // mostra o campo de busca acima da tabela
  searchable?: boolean
  searchPlaceholder?: string
  // slot para filtros customizados (selects, datas...), ao lado da busca
  filters?: React.ReactNode
  // exibido no corpo da tabela quando items está vazio
  emptyState?: TableEmptyState
}

const SKELETON_ROWS = 10

// ignora maiúsculas e acentos: "alimentacao" encontra "Alimentação"
const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

// busca só em células de texto/número; ReactNode (ex.: botões de ação) fica de fora
const matchesSearch = <T extends Record<string, React.ReactNode>>(
  item: T,
  columns: Array<TableColumn<T>>,
  query: string
) =>
  columns.some((column) => {
    const value = item[column.value]
    return (
      (typeof value === "string" || typeof value === "number") &&
      normalize(String(value)).includes(query)
    )
  })

const alignClass = (index: number, total: number) =>
  index === total - 1 ? "text-right" : "text-left"

// Mobile (< md): cada linha vira um card. O display muda via CSS, então os
// role explícitos mantêm a semântica de tabela para leitores de tela
const mobile = {
  table: "max-md:flex max-md:flex-col",
  caption: "max-md:order-last",
  // some da tela, mas continua anunciando os cabeçalhos
  header: "max-md:sr-only",
  body: "max-md:flex max-md:flex-col max-md:gap-3 max-md:[&_tr:last-child]:border",
  // grade de 2 colunas: título no topo, campos em pares embaixo
  row: "max-md:relative max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:rounded-xl max-md:border max-md:border-border max-md:bg-card max-md:p-4 max-md:hover:bg-card",
  cell: "max-md:min-w-0 max-md:border-0 max-md:p-0 max-md:text-left max-md:whitespace-normal",
  // 1ª coluna é o título; o pr reserva o espaço das ações no canto
  title: "max-md:col-span-2 max-md:pr-24 max-md:text-base max-md:font-semibold",
  // demais colunas: rótulo pequeno em cima, valor embaixo
  labeled: "max-md:flex max-md:flex-col max-md:gap-0.5 max-md:before:text-xs max-md:before:text-muted-foreground max-md:before:content-[attr(data-label)]",
  // ações no canto superior direito, com alvo de toque de 40px e 8px entre eles
  footer: "max-md:absolute max-md:top-2 max-md:right-2 max-md:min-w-16 max-md:[&_button]:size-10 max-md:[&>div]:gap-2",
}

const mobileCellClass = (index: number, total: number) => {
  if (index === 0) return mobile.title
  if (index === total - 1) return mobile.footer
  return mobile.labeled
}

export const TableCustom = <T extends Record<string, React.ReactNode>>({
  items,
  columns,
  label,
  isLoading = false,
  getRowKey = (_item, index) => index,
  searchable = false,
  searchPlaceholder = "Buscar...",
  filters,
  emptyState,
}: TableCustomProps<T>) => {
  const [search, setSearch] = React.useState("")
  const query = normalize(search.trim())
  const visibleItems =
    searchable && query
      ? items.filter((item) => matchesSearch(item, columns, query))
      : items

  const cellClass = (index: number) =>
    cn(
      alignClass(index, columns.length),
      "border-b border-border",
      mobile.cell,
      mobileCellClass(index, columns.length)
    )

  const renderCell = (column: TableColumn<T>, index: number, content: React.ReactNode) => (
    <TableCell key={column.value} role="cell" data-label={column.label} className={cellClass(index)}>
      {content}
    </TableCell>
  )

  const renderRows = () => {
    if (isLoading) {
      return Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
        <TableRow key={rowIndex} role="row" className={mobile.row}>
          {columns.map((column, index) =>
            renderCell(
              column,
              index,
              // ml-auto acompanha o alinhamento à direita da última coluna
              <Skeleton className={cn("h-4 w-3/4", index === columns.length - 1 && "ml-auto")} />
            )
          )}
        </TableRow>
      ))
    }

    if (items.length === 0 && emptyState) {
      return (
        // sem hover: a linha não é um item clicável
        <TableRow role="row" className={cn(mobile.row, "hover:bg-transparent max-md:hover:bg-card")}>
          <TableCell role="cell" className="border-b border-border py-12 max-md:col-span-2 max-md:border-0 max-md:py-8" colSpan={columns.length}>
            <div className="flex flex-col items-center gap-1 text-center whitespace-normal">
              <p className="font-semibold">{emptyState.title}</p>
              {emptyState.description && (
                <p className="text-sm text-muted-foreground">{emptyState.description}</p>
              )}
              {emptyState.action && <div className="mt-3">{emptyState.action}</div>}
            </div>
          </TableCell>
        </TableRow>
      )
    }

    if (visibleItems.length === 0) {
      return (
        <TableRow role="row" className={mobile.row}>
          <TableCell role="cell" className="border-b border-border max-md:col-span-2 max-md:border-0 max-md:p-0 max-md:whitespace-normal" colSpan={columns.length}>
            {items.length > 0 ? `Nenhum resultado para "${search.trim()}"` : "Nenhum dado encontrado"}
          </TableCell>
        </TableRow>
      )
    }

    return visibleItems.map((item, rowIndex) => (
      <TableRow key={getRowKey(item, rowIndex)} role="row" className={mobile.row}>
        {columns.map((column, index) => renderCell(column, index, item[column.value]))}
      </TableRow>
    ))
  }

  const renderToolbar = () => {
    if (!searchable && !filters) return null

    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
        {/* ml-auto: a busca fica no fim da linha, separada dos filtros */}
        {searchable && (
          <InputGroup className="sm:ml-auto sm:max-w-xs rounded-2xl">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </InputGroup>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {renderToolbar()}
      <Table role="table" className={mobile.table}>
        <TableCaption className={mobile.caption}>{label}</TableCaption>
        <TableHeader role="rowgroup" className={mobile.header}>
          <TableRow role="row">
            {columns.map((column, index) => (
              <TableHead
                key={column.value}
                role="columnheader"
                className={cn(alignClass(index, columns.length), "border-b border-border font-bold")}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody role="rowgroup" aria-busy={isLoading} className={mobile.body}>{renderRows()}</TableBody>
      </Table>
    </div>
  )
}
