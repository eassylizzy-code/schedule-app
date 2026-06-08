'use client'
import { useState } from 'react'
import { CalendarEvent, Category, RepeatType, ReminderMinutes } from '@/lib/types'
import { CATEGORIES } from '@/lib/categories'
import { v4 as uuidv4 } from 'uuid'

interface EventEditorProps {
  event?: CalendarEvent        // undefined = new event
  initialDate?: Date           // pre-fill date for new event
  onSave: (event: CalendarEvent) => void
  onDelete?: (event: CalendarEvent) => void
  onClose: () => void
}

const CATEGORIES_LIST = Object.keys(CATEGORIES) as Category[]

const defaultForm = (date?: Date): Omit<CalendarEvent, 'id'> => {
  const start = date ?? new Date()
  start.setMinutes(0, 0, 0)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)
  return {
    title: '',
    category: 'personal',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    repeat: 'none',
    reminder: 0,
  }
}

function toInputDatetime(iso: string): string {
  return iso.slice(0, 16) // "YYYY-MM-DDTHH:mm"
}

function fromInputDatetime(val: string): string {
  return new Date(val).toISOString()
}

export default function EventEditor({ event, initialDate, onSave, onDelete, onClose }: EventEditorProps) {
  const [form, setForm] = useState<Omit<CalendarEvent, 'id'>>(
    event ? { ...event } : defaultForm(initialDate)
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave({
      ...form,
      id: event?.id ?? uuidv4(),
      url: event?.url,
      etag: event?.etag,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center"
         onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold">{event ? 'Редактировать' : 'Новое событие'}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        {/* Title */}
        <input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Название"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
        />

        {/* Category */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Категория</label>
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES_LIST.map(cat => {
              const meta = CATEGORIES[cat]
              return (
                <button
                  key={cat}
                  onClick={() => set('category', cat)}
                  className={`rounded-lg py-1.5 text-xs text-center border-2 transition-all
                    ${form.category === cat
                      ? `${meta.color} ${meta.borderColor} ${meta.textColor} font-semibold`
                      : 'bg-gray-50 border-transparent text-gray-500'
                    }`}
                >
                  {meta.icon}<br />{meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Start / End time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Начало</label>
            <input
              type="datetime-local"
              value={toInputDatetime(form.startTime)}
              onChange={e => set('startTime', fromInputDatetime(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Конец</label>
            <input
              type="datetime-local"
              value={toInputDatetime(form.endTime)}
              onChange={e => set('endTime', fromInputDatetime(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>

        {/* Repeat */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Повтор</label>
          <select
            value={form.repeat}
            onChange={e => set('repeat', e.target.value as RepeatType)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          >
            <option value="none">Не повторять</option>
            <option value="weekly">Каждую неделю</option>
            <option value="daily">Каждый день</option>
          </select>
        </div>

        {/* Reminder */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Напоминание</label>
          <select
            value={form.reminder}
            onChange={e => set('reminder', Number(e.target.value) as ReminderMinutes)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          >
            <option value={0}>Без напоминания</option>
            <option value={15}>За 15 минут</option>
            <option value={30}>За 30 минут</option>
            <option value={60}>За 1 час</option>
          </select>
        </div>

        {/* Actions */}
        <button
          onClick={handleSave}
          disabled={!form.title.trim()}
          className="w-full bg-orange-400 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
        >
          Сохранить
        </button>

        {event && onDelete && (
          confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(event)}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold"
              >
                Удалить
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full border border-red-200 text-red-500 rounded-xl py-2.5 text-sm"
            >
              Удалить событие
            </button>
          )
        )}
      </div>
    </div>
  )
}
