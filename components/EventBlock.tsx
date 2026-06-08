'use client'
import { CalendarEvent } from '@/lib/types'
import { getCategoryMeta } from '@/lib/categories'

interface EventBlockProps {
  event: CalendarEvent
  onClick: (event: CalendarEvent) => void
  compact?: boolean
}

export default function EventBlock({ event, onClick, compact = false }: EventBlockProps) {
  const meta = getCategoryMeta(event.category)

  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  const durationMin = Math.round((end.getTime() - start.getTime()) / 60000)
  const durationLabel = durationMin >= 60
    ? `${(durationMin / 60).toFixed(1).replace('.0', '')} ч`
    : `${durationMin} мин`

  const timeLabel = start.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

  return (
    <button
      onClick={() => onClick(event)}
      className={`w-full text-left rounded border-l-[3px] ${meta.color} ${meta.borderColor} px-1.5 py-1 ${compact ? 'text-[10px]' : 'text-xs'}`}
    >
      <div className={`font-medium ${meta.textColor} truncate`}>
        {meta.icon} {event.title}
      </div>
      {!compact && (
        <div className="text-gray-400 text-[10px]">{timeLabel} · {durationLabel}</div>
      )}
    </button>
  )
}
