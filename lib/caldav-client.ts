import { CalendarEvent, Category, ICloudCredentials } from './types'
import { icalToEvent, eventToIcal } from './ical'
import { v4 as uuidv4 } from 'uuid'

// Map iCal category hint (stored in CATEGORIES field) to our Category type
const CATEGORY_HINT_PREFIX = 'schedule-app-category-'

// Validate category values to prevent data corruption from malformed iCal
const VALID_CATEGORIES = new Set<string>(['work', 'gym', 'dog', 'blog', 'learning', 'personal', 'chores'])

function withCredHeaders(creds: ICloudCredentials): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-apple-id': creds.appleId,
    'x-app-password': creds.appPassword,
  }
}

export async function listCalendars(
  creds: ICloudCredentials
): Promise<Array<{ url: string; displayName: string }>> {
  const res = await fetch('/api/caldav?action=list-calendars', {
    headers: withCredHeaders(creds),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchEvents(creds: ICloudCredentials): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({ action: 'list', calendarUrl: creds.calendarUrl })
  const res = await fetch(`/api/caldav?${params}`, { headers: withCredHeaders(creds) })
  if (!res.ok) throw new Error(await res.text())

  const objects: Array<{ url: string; etag: string; data: string }> = await res.json()
  return objects
    .filter(obj => obj.data)
    .flatMap(obj => {
      try {
        // Extract category hint from iCal CATEGORIES field
        const catMatch = obj.data.match(new RegExp(`CATEGORIES:${CATEGORY_HINT_PREFIX}(\\w+)`))
        const hint = catMatch?.[1]
        const category: Category = (hint && VALID_CATEGORIES.has(hint) ? hint : 'personal') as Category
        return [icalToEvent(obj.data, category, obj.url, obj.etag)]
      } catch {
        // Skip malformed iCal events instead of crashing entire fetch
        return []
      }
    })
}

export async function createEvent(
  creds: ICloudCredentials,
  event: Omit<CalendarEvent, 'id' | 'url' | 'etag'>
): Promise<CalendarEvent> {
  const uid = uuidv4()
  const full: CalendarEvent = { ...event, id: uid }
  const icalData = eventToIcal(full).replace(
    'END:VEVENT',
    `CATEGORIES:${CATEGORY_HINT_PREFIX}${event.category}\r\nEND:VEVENT`
  )

  const res = await fetch('/api/caldav', {
    method: 'POST',
    headers: withCredHeaders(creds),
    body: JSON.stringify({ calendarUrl: creds.calendarUrl, uid, icalData }),
  })
  if (!res.ok) throw new Error(await res.text())
  const { url } = await res.json()
  return { ...full, url }
}

export async function updateEvent(
  creds: ICloudCredentials,
  event: CalendarEvent
): Promise<void> {
  const icalData = eventToIcal(event).replace(
    'END:VEVENT',
    `CATEGORIES:${CATEGORY_HINT_PREFIX}${event.category}\r\nEND:VEVENT`
  )
  const res = await fetch('/api/caldav', {
    method: 'PUT',
    headers: withCredHeaders(creds),
    body: JSON.stringify({ objectUrl: event.url, etag: event.etag, icalData }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function deleteEvent(
  creds: ICloudCredentials,
  event: CalendarEvent
): Promise<void> {
  const res = await fetch('/api/caldav', {
    method: 'DELETE',
    headers: withCredHeaders(creds),
    body: JSON.stringify({ objectUrl: event.url, etag: event.etag }),
  })
  if (!res.ok) throw new Error(await res.text())
}
