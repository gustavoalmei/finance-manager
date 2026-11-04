import type { SubmitEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { useFormFields } from '#/hooks/use-form-fields'
import {
  categories,
  categoryColorVar,
  categoryColors,
  categoryIcons,
} from '#/lib/categories'
import type { Category, CategoryColor, CategoryInput } from '#/lib/categories'
import { categoriesQueryOptions } from '#/lib/categories/queries'
import { toaster } from '#/lib/toaster'
import { cn } from '#/lib/utils'

const colorKeys = Object.keys(categoryColors) as Array<CategoryColor>
const iconEntries = Object.entries(categoryIcons)

// opção selecionável (cor ou ícone): mesmo destaque do filtro de período
const optionClass = (selected: boolean) =>
  cn(
    'flex size-9 cursor-pointer items-center justify-center rounded-lg border border-transparent transition-colors hover:bg-muted',
    selected && 'border-ring bg-muted',
  )

const texts = {
  create: {
    title: 'Nova categoria',
    description: 'Informe os dados da nova categoria.',
    submit: 'Criar categoria',
    pending: 'Criando...',
    success: 'Categoria criada!',
  },
  edit: {
    title: 'Editar categoria',
    description: 'Altere os dados da categoria e salve.',
    submit: 'Salvar',
    pending: 'Salvando...',
    success: 'Categoria atualizada!',
  },
}

type CategoryFormProps = {
  category?: Category
  onSuccess: () => void
}

// Montado só com o modal aberto: os campos começam sempre com os dados atuais
const CategoryForm = ({ category, onSuccess }: CategoryFormProps) => {
  const queryClient = useQueryClient()
  const text = category ? texts.edit : texts.create
  // nova categoria: próxima cor da paleta, para não repetir a das anteriores
  const { data: existing = [] } = useQuery(categoriesQueryOptions())
  const { values, field, setValue } = useFormFields({
    name: category?.name ?? '',
    description: category?.description ?? '',
    color: category?.color ?? colorKeys[existing.length % colorKeys.length],
    icon: category?.icon ?? 'tag',
  })

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      category ? categories.update(category.id, input) : categories.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryOptions().queryKey,
      })
      toaster.success(text.success)
      onSuccess()
    },
    onError: (error) => toaster.error(error),
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveMutation.mutate({
      name: values.name,
      description: values.description || undefined,
      color: values.color,
      icon: values.icon,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField htmlFor="name" label="Nome">
        <Input
          {...field('name')}
          placeholder="Ex.: Alimentação"
          required
          autoFocus
        />
      </FormField>

      <FormField htmlFor="description" label="Descrição (opcional)">
        <Input
          {...field('description')}
          maxLength={255}
          placeholder="Ex.: Mercado e restaurantes"
        />
      </FormField>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Cor</legend>
        <div className="flex flex-wrap gap-1">
          {colorKeys.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={categoryColors[color]}
              aria-pressed={values.color === color}
              onClick={() => setValue('color', color)}
              className={optionClass(values.color === color)}
            >
              <span
                className="size-5 rounded-full"
                style={{ background: categoryColorVar(color) }}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Ícone</legend>
        <div className="flex flex-wrap gap-1">
          {iconEntries.map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              aria-label={name}
              aria-pressed={values.icon === name}
              onClick={() => setValue('icon', name)}
              className={optionClass(values.icon === name)}
            >
              <Icon
                className="size-4"
                style={{ color: categoryColorVar(values.color) }}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="bg-nav-active text-nav-active-foreground"
        >
          {saveMutation.isPending ? text.pending : text.submit}
        </Button>
      </DialogFooter>
    </form>
  )
}

type CategoryFormDialogProps = DialogRootProps & {
  // sem categoria: criação · com categoria: edição
  category?: Category | null
  onSuccess: () => void
}

export const CategoryFormDialog = ({
  category,
  onSuccess,
  ...rootProps
}: CategoryFormDialogProps) => {
  const text = category ? texts.edit : texts.create

  return (
    <Dialog {...rootProps}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <CategoryForm category={category ?? undefined} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}
