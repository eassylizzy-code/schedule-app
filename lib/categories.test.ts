// lib/categories.test.ts
import { getCategoryMeta, CATEGORIES } from './categories'
import { Category } from './types'

describe('getCategoryMeta', () => {
  it('returns correct label for work category', () => {
    expect(getCategoryMeta('work').label).toBe('Работа')
  })

  it('returns correct hex color for gym', () => {
    expect(getCategoryMeta('gym').hex).toBe('#22c55e')
  })

  it('returns meta for all 7 categories', () => {
    const categories: Category[] = ['work', 'gym', 'dog', 'blog', 'learning', 'personal', 'chores']
    categories.forEach(cat => {
      const meta = getCategoryMeta(cat)
      expect(meta.label).toBeTruthy()
      expect(meta.hex).toMatch(/^#[0-9a-f]{6}$/)
    })
  })
})
