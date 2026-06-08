'use client'
import { CalendarEvent } from '@/lib/types'
import EventBlock from './EventBlock'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 8:00–22:00
const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

interface WeekGridProps {
  weekStart: Date            // Monday of the week to show
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onSlotClick: (date: Date) => void
}

function getMondayOf(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function eventsForDayAndHour(events: CalendarEvent[], day: Date, hour: number): CalendarEvent[] {
  return events.filter(e => {
    const start = new Date(e.startTime)
    return sameDay(start, day) && start.getHours() === hour
  })
}

export { getMondayOf }

export default function WeekGrid({ weekStart, events, onEventClick, onSlotClick }: WeekGridProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  return (
    <div className="overflow-auto flex-1">
      {/* Day headers */}
      <div className="grid sticky top-0 bg-white border-b border-gray-100 z-10"
           style={{ gridTemplateColumns: '44px repeat(7, 1fr)' }}>
        <div />
        {days.map((day, i) => (
          <div key={i} className="text-center py-1.5">
            <div className="text-[10px] font-semibold text-gray-400">{DAY_LABELS[i]}</div>
            <div className="text-sm font-bold text-gray-900">{day.getDate()}</div>
          </div>
        ))}
      </div>

      {/* Time rows */}
      {HOURS.map(hour => (
        <div key={hour} className="grid border-t border-gray-50"
             style={{ gridTemplateColumns: '44px repeat(7, 1fr)', minHeight: '48px' }}>
          <div className="text-[10px] text-gray-300 text-right pr-2 pt-1">
            {hour}:00
          </div>
          {days.map((day, i) => {
            const slotEvents = eventsForDayAndHour(events, day, hour)
            const slotDate = new Date(day)
            slotDate.setHours(hour)
            return (
              <div
                key={i}
                className="border-l border-gray-50 p-0.5 cursor-pointer hover:bg-orange-50 transition-colors"
                onClick={() => slotEvents.length === 0 && onSlotClick(slotDate)}
              >
                {slotEvents.map(e => (
                  <EventBlock key={e.id} event={e} onClick={onEventClick} compact />
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
