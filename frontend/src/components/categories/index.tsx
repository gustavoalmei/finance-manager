import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { RowActions } from '#/components/shared/row-actions'
import { Button } from '#/components/ui/button'
import { TableCustom } from '#/components/ui/table'
import type { TableColumn } from '#/components/ui/table'
import { useDialogState } from '#/hooks/use-dialog-state'
import type { Category } from '#/lib/categories'
import { categoriesQueryOptions } from '#/lib/categories/queries'
import { formatDate } from '#/lib/format'
import { CategoryFormDialog } from './category-form-dialog'
import { DeleteCategoryDialog } from './delete-category-dialog'

type CategoryRow = {
  id: string
  name: string
  description: string
  createdAt: string
  actions: ReactNode
}

const columns: Array<TableColumn<CategoryRow>> = [
  { label: 'Nome', value: 'name' },
  { label: 'Descrição', value: 'description' },
  { label: 'Criada em', value: 'createdAt' },
  { label: 'Ações', value: 'actions' },
]

const pluralize = (count: number) =>
  `${count} ${count === 1 ? 'categoria' : 'categorias'}`

export const Categories = () => {
  const { data: categories = [], isPending } = useQuery(categoriesQueryOptions())
  const [createOpen, setCreateOpen] = useState(false)
  const editDialog = useDialogState<Category>()
  const deleteDialog = useDialogState<Category>()

  const toRow = (category: Category): CategoryRow => ({
    id: category.id,
    name: category.name,
    description: category.description || '—',
    createdAt: formatDate(category.createdAt),
    actions: (
      <RowActions
        label={`categoria ${category.name}`}
        onEdit={() => editDialog.show(category)}
        onDelete={() => deleteDialog.show(category)}
      />
    ),
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex sm:items-center justify-between gap-2 sm:flex-row flex-col">
        <div>
          <h1 className="text-2xl font-semibold">Minhas categorias</h1>
          <small className="text-muted-foreground">
            {pluralize(categories.length)}
          </small>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> Nova categoria
        </Button>
      </div>

      <TableCustom
        label=""
        columns={columns}
        items={categories.map(toRow)}
        isLoading={isPending}
        getRowKey={(row) => row.id}
        searchable
        searchPlaceholder="Buscar categoria..."
        emptyState={{
          title: 'Nenhuma categoria cadastrada',
          description: 'Crie a primeira categoria para organizar seus lançamentos.',
          action: (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Nova categoria
            </Button>
          ),
        }}
      />

      <CategoryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setCreateOpen(false)}
      />
      <CategoryFormDialog
        {...editDialog.rootProps}
        category={editDialog.target}
        onSuccess={editDialog.close}
      />
      <DeleteCategoryDialog
        {...deleteDialog.rootProps}
        category={deleteDialog.target}
        onSuccess={deleteDialog.close}
      />
    </div>
  )
}
