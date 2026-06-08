import { Category } from './types'

export interface CategoryMeta {
  label: string
  icon: string
  color: string        // Tailwind bg class
  borderColor: string  // Tailwind border class
  textColor: string    // Tailwind text class
  hex: string          // raw hex for non-Tailwind use
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  work: {
    label: 'Работа',
    icon: '👶',
    color: 'bg-blue-100',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-900',
    hex: '#3b82f6',
  },
  gym: {
    label: 'Зал',
    icon: '💪',
    color: 'bg-green-100',
    borderColor: 'border-green-500',
    textColor: 'text-green-900',
    hex: '#22c55e',
  },
  dog: {
    label: 'Собака',
    icon: '🐕',
    color: 'bg-pink-100',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-900',
    hex: '#ec4899',
  },
  blog: {
    label: 'Блог',
    icon: '📝',
    color: 'bg-orange-100',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-900',
    hex: '#fb923c',
  },
  learning: {
    label: 'Учёба',
    icon: '📚',
    color: 'bg-indigo-100',
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-900',
    hex: '#6366f1',
  },
  personal: {
    label: 'Личное',
    icon: '🎨',
    color: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-900',
    hex: '#eab308',
  },
  chores: {
    label: 'Быт',
    icon: '🧹',
    color: 'bg-slate-100',
    borderColor: 'border-slate-400',
    textColor: 'text-slate-700',
    hex: '#94a3b8',
  },
}

export function getCategoryMeta(category: Category): CategoryMeta {
  return CATEGORIES[category]
}
