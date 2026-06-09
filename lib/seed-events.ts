import { CalendarEvent, Category } from './types'
import { v4 as uuidv4 } from 'uuid'

function thisMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function iso(monday: Date, dayOffset: number, h: number, m: number): string {
  const d = new Date(monday)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function generateSeedEvents(): CalendarEvent[] {
  const mon = thisMonday()

  const e = (
    dayOffset: number,
    startH: number, startM: number,
    endH: number, endM: number,
    title: string,
    category: Category,
    repeat: 'weekly' | 'daily' | 'none' = 'weekly'
  ): CalendarEvent => ({
    id: uuidv4(),
    title,
    category,
    startTime: iso(mon, dayOffset, startH, startM),
    endTime: iso(mon, dayOffset, endH, endM),
    repeat,
    reminder: 0,
  })

  return [
    // === КАЖДЫЙ ДЕНЬ: прогулки с собакой ===
    e(0, 8, 30, 9, 0, 'Прогулка утром', 'dog', 'daily'),
    e(0, 20, 0, 20, 30, 'Прогулка вечером', 'dog', 'daily'),

    // === ПОНЕДЕЛЬНИК ===
    e(0, 9, 45, 10, 0, 'Подготовка', 'chores'),
    e(0, 10, 0, 12, 30, 'Занятие (ребёнок)', 'work'),
    e(0, 12, 45, 13, 0, 'Подготовка к учёбе', 'chores'),
    e(0, 13, 0, 15, 0, 'Учёба', 'learning'),
    e(0, 16, 45, 17, 0, 'Подготовка', 'chores'),
    e(0, 17, 0, 19, 30, 'Занятие (ребёнок)', 'work'),

    // === ВТОРНИК ===
    e(1, 10, 30, 12, 0, 'Зал', 'gym'),
    e(1, 14, 45, 15, 0, 'Подготовка к блогу', 'chores'),
    e(1, 15, 0, 17, 0, 'Блог', 'blog'),
    e(1, 17, 15, 17, 30, 'Подготовка к учёбе', 'chores'),
    e(1, 17, 30, 19, 0, 'Учёба', 'learning'),
    e(1, 19, 0, 20, 30, 'Готовка', 'chores'),

    // === СРЕДА ===
    e(2, 9, 45, 10, 0, 'Подготовка', 'chores'),
    e(2, 10, 0, 12, 30, 'Занятие (ребёнок)', 'work'),
    e(2, 12, 45, 13, 0, 'Подготовка к учёбе', 'chores'),
    e(2, 13, 0, 15, 0, 'Учёба', 'learning'),
    e(2, 16, 45, 17, 0, 'Подготовка', 'chores'),
    e(2, 17, 0, 19, 30, 'Занятие (ребёнок)', 'work'),

    // === ЧЕТВЕРГ ===
    e(3, 9, 45, 10, 0, 'Подготовка', 'chores'),
    e(3, 10, 0, 12, 30, 'Занятие (ребёнок)', 'work'),
    e(3, 12, 45, 13, 0, 'Подготовка к учёбе', 'chores'),
    e(3, 13, 0, 14, 0, 'Учёба', 'learning'),
    e(3, 14, 0, 15, 30, 'Клиентка', 'work'),
    e(3, 15, 45, 16, 0, 'Подготовка к учёбе', 'chores'),
    e(3, 16, 0, 17, 0, 'Учёба', 'learning'),
    e(3, 17, 30, 19, 0, 'Готовка', 'chores'),

    // === ПЯТНИЦА ===
    e(4, 10, 30, 12, 0, 'Зал', 'gym'),
    e(4, 12, 45, 13, 0, 'Подготовка к учёбе', 'chores'),
    e(4, 13, 0, 15, 0, 'Учёба', 'learning'),
    e(4, 16, 45, 17, 0, 'Подготовка', 'chores'),
    e(4, 17, 0, 19, 30, 'Занятие (ребёнок)', 'work'),

    // === СУББОТА ===
    e(5, 10, 0, 12, 0, 'Уборка', 'chores'),
    e(5, 12, 15, 12, 30, 'Подготовка к учёбе', 'chores'),
    e(5, 12, 30, 15, 0, 'Учёба', 'learning'),
    e(5, 15, 15, 15, 30, 'Подготовка к учёбе', 'chores'),
    e(5, 15, 30, 17, 30, 'Учёба', 'learning'),

    // === ВОСКРЕСЕНЬЕ ===
    e(6, 10, 30, 12, 0, 'Зал', 'gym'),
    e(6, 12, 45, 13, 0, 'Подготовка к учёбе', 'chores'),
    e(6, 13, 0, 15, 0, 'Учёба', 'learning'),
    e(6, 15, 30, 17, 30, 'Готовка', 'chores'),
  ]
}
