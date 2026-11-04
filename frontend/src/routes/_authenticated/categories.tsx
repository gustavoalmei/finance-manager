import { Categories } from '#/components/categories'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/categories')({
  staticData: { title: 'Categorias' },
  component: Categories,
})
