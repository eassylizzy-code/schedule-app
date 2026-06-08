'use client'
import { CalendarEvent } from '@/lib/types'
import { getCategoryMeta } from '@/lib/categories'

const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

interface MonthGridProps {
  month: Date                // any day in the target month
  events: CalendarEvent[]
  onDayClick: (date: Date) => void
}

function getDaysInMonth(month: Date): (Date | null)[] {
  const year = month.getFullYear()
  const m = month.getMonth()
  const firstDay = new Date(year, m, 1)
  const lastDay = new Date(year, m + 1, 0)

  // Monday-first grid
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const cells: (Date | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, m, d))
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter(e => {
    const s = new Date(e.startTime)
    return s.getFullYear() === day.getFullYear() &&
      s.getMonth() === day.getMonth() &&
      s.getDate() === day.getDate()
  })
}

export default function MonthGrid({ month, events, onDayClick }: MonthGridProps) {
  const cells = getDaysInMonth(month)
  const today = new Date()

  return (
    <div className="flex-1 overflow-auto p-2">
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dayEvents = eventsForDay(events, day)
          const isToday = day.toDateString() === today.toDateString()

          return (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              className="aspect-square flex flex-col items-center justify-start pt-1 rounded-lg hover:bg-orange-50 transition-colors relative"
            >
              <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? 'bg-orange-400 text-white' : 'text-gray-800'}`}>
                {day.getDate()}
              </span>
              <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <span
                    key={e.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getCategoryMeta(e.category).hex }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
