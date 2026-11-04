import {
  Briefcase,
  Car,
  Dumbbell,
  Film,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  PawPrint,
  PiggyBank,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tag,
  Utensils,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import api from '../api'

// Mesma ordem e chaves do back (category/schema.ts). A cor real vem do token
// --chart-<chave> em styles.css, que muda com o tema.
export const categoryColors = {
  blue: 'Azul',
  orange: 'Laranja',
  aqua: 'Verde-água',
  yellow: 'Amarelo',
  magenta: 'Rosa',
  green: 'Verde',
  violet: 'Violeta',
  red: 'Vermelho',
} as const

export type CategoryColor = keyof typeof categoryColors

export const categoryColorVar = (color: string) => `var(--chart-${color})`

// nome salvo no banco (kebab-case do lucide) → componente
export const categoryIcons: Record<string, LucideIcon> = {
  tag: Tag,
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  house: House,
  car: Car,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  plane: Plane,
  'gamepad-2': Gamepad2,
  shirt: Shirt,
  zap: Zap,
  gift: Gift,
  briefcase: Briefcase,
  'piggy-bank': PiggyBank,
  smartphone: Smartphone,
  film: Film,
  dumbbell: Dumbbell,
  'paw-print': PawPrint,
}

export const getCategoryIcon = (icon: string) => categoryIcons[icon] ?? Tag

export type Category = {
  id: string
  userId: string
  name: string
  description: string | null
  color: CategoryColor
  icon: string
  createdAt: string
  updatedAt: string
}

export type CategoryInput = {
  name: string
  description?: string
  color: CategoryColor
  icon: string
}

export const categories = {
  list: async (): Promise<Category[]> => {
    const { data } = await api.get('/categories')
    return data
  },
  create: async (input: CategoryInput) => {
    const { data } = await api.post('/category', input)
    return data
  },
  update: async (id: string, input: CategoryInput) => {
    const { data } = await api.put(`/category/${id}`, input)
    return data
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/category/${id}`)
    return data
  },
}
