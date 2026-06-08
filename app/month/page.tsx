'use client'
import { useState, useEffect } from 'react'
import NavBar from '@/components/NavBar'
import MonthGrid from '@/components/MonthGrid'
import EventEditor from '@/components/EventEditor'
import { CalendarEvent } from '@/lib/types'
import { loadEvents, saveEvents, loadCredentials } from '@/lib/storage'
import { createEvent, updateEvent, deleteEvent } from '@/lib/caldav-client'

function monthTitle(date: Date): string {
  return date.toLocaleDateString('ru', { month: 'long', year: 'numeric' })
}

export default function MonthPage() {
  const [month, setMonth] = useState(() => new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>()
  const [newEventDate, setNewEventDate] = useState<Date | undefined>()
  const [showEditor, setShowEditor] = useState(false)
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | undefined>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setEvents(loadEvents()) }, [])

  const handleDayClick = (day: Date) => {
    const evs = events.filter(e => {
      const s = new Date(e.startTime)
      return s.toDateString() === day.toDateString()
    })
    setSelectedDay(day)
    setDayEvents(evs)
  }

  const handleSave = async (event: CalendarEvent) => {
    const creds = loadCredentials()
    setShowEditor(false)
    try {
      let next: CalendarEvent[]
      if (creds && event.url) {
        await updateEvent(creds, event)
        next = events.map(e => e.id === event.id ? event : e)
      } else if (creds) {
        const created = await createEvent(creds, event)
        next = [...events, created]
      } else {
        next = events.filter(e => e.id !== event.id).concat(event)
      }
      setEvents(next)
      saveEvents(next)
      // Re-sync dayEvents for the currently selected day
      if (selectedDay) {
        setDayEvents(next.filter(e => {
          const s = new Date(e.startTime)
          return s.toDateString() === selectedDay.toDateString()
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  }

  const handleDelete = async (event: CalendarEvent) => {
    const creds = loadCredentials()
    setShowEditor(false)
    try {
      if (creds && event.url) await deleteEvent(creds, event)
      const next = events.filter(e => e.id !== event.id)
      setEvents(next); saveEvents(next)
      setDayEvents(prev => prev.filter(e => e.id !== event.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-700 flex justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      <NavBar
        title={monthTitle(month)}
        onPrev={() => setMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        onAddClick={() => { setEditingEvent(undefined); setNewEventDate(selectedDay); setShowEditor(true) }}
      />

      <MonthGrid
        month={month}
        events={events}
        onDayClick={handleDayClick}
      />

      {selectedDay && dayEvents.length > 0 && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500">
            {selectedDay.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          {dayEvents.map(e => (
            <button
              key={e.id}
              onClick={() => { setEditingEvent(e); setShowEditor(true) }}
              className="w-full text-left text-sm py-1.5 px-3 rounded-lg bg-gray-50 hover:bg-orange-50 transition-colors"
            >
              {e.title}
            </button>
          ))}
        </div>
      )}

      {showEditor && (
        <EventEditor
          event={editingEvent}
          initialDate={newEventDate}
          onSave={handleSave}
          onDelete={editingEvent ? handleDelete : undefined}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}
