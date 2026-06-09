'use client'
import { useState, useEffect, useCallback } from 'react'
import NavBar from '@/components/NavBar'
import WeekGrid, { getMondayOf } from '@/components/WeekGrid'
import EventEditor from '@/components/EventEditor'
import { CalendarEvent } from '@/lib/types'
import { loadEvents, saveEvents, loadCredentials, saveSyncState } from '@/lib/storage'
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '@/lib/caldav-client'
import { generateSeedEvents } from '@/lib/seed-events'

function weekTitle(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
  return `${monday.toLocaleDateString('ru', opts)} – ${sunday.toLocaleDateString('ru', opts)}`
}

export default function WeekPage() {
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>()
  const [newEventDate, setNewEventDate] = useState<Date | undefined>()
  const [showEditor, setShowEditor] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadEvents()
    if (stored.length === 0) {
      const seed = generateSeedEvents()
      setEvents(seed)
      saveEvents(seed)
    } else {
      setEvents(stored)
    }
    sync()
  }, [])

  useEffect(() => {
    const interval = setInterval(sync, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const sync = useCallback(async () => {
    const creds = loadCredentials()
    if (!creds) return
    try {
      const fetched = await fetchEvents(creds)
      setEvents(fetched)
      saveEvents(fetched)
      saveSyncState({ lastSynced: new Date().toISOString(), error: null })
      setSyncError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка синхронизации'
      setSyncError(msg)
      saveSyncState({ lastSynced: null, error: msg })
    }
  }, [])

  const handleSave = async (event: CalendarEvent) => {
    const creds = loadCredentials()
    setShowEditor(false)
    if (!creds) {
      const next = events.filter(e => e.id !== event.id).concat(event)
      setEvents(next)
      saveEvents(next)
      return
    }
    try {
      if (event.url) {
        await updateEvent(creds, event)
        const next = events.map(e => e.id === event.id ? event : e)
        setEvents(next)
        saveEvents(next)
      } else {
        const created = await createEvent(creds, event)
        const next = [...events, created]
        setEvents(next)
        saveEvents(next)
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  }

  const handleDelete = async (event: CalendarEvent) => {
    const creds = loadCredentials()
    setShowEditor(false)
    try {
      if (creds && event.url) await deleteEvent(creds, event)
      const next = events.filter(e => e.id !== event.id)
      setEvents(next)
      saveEvents(next)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {syncError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-700 flex justify-between">
          <span>⚠️ {syncError}</span>
          <button onClick={() => setSyncError(null)}>✕</button>
        </div>
      )}

      <NavBar
        title={weekTitle(weekStart)}
        onPrev={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
        onNext={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
        onAddClick={() => { setEditingEvent(undefined); setNewEventDate(undefined); setShowEditor(true) }}
      />

      <WeekGrid
        weekStart={weekStart}
        events={events}
        onEventClick={e => { setEditingEvent(e); setShowEditor(true) }}
        onSlotClick={d => { setEditingEvent(undefined); setNewEventDate(d); setShowEditor(true) }}
      />

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
