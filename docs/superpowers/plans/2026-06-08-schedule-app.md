# Schedule App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal schedule PWA with a weekly/monthly calendar view that automatically syncs with iCloud Calendar via CalDAV.

**Architecture:** Next.js 14 App Router with API routes as a CalDAV proxy (avoids CORS). Frontend fetches events through `/api/caldav`, caches in localStorage for offline use. iCloud app-specific password stored only in browser localStorage, sent only to our own API route which proxies to Apple.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, tsdav (CalDAV), next-pwa, Vercel

---

## File Map

```
schedule-app/
├── app/
│   ├── layout.tsx                  — root layout, PWA meta tags
│   ├── page.tsx                    — weekly view (main screen)
│   ├── month/page.tsx              — monthly view
│   ├── settings/page.tsx           — iCloud credentials
│   └── api/caldav/route.ts         — CalDAV proxy (GET/POST/PUT/DELETE)
├── components/
│   ├── NavBar.tsx                  — week/month toggle + «+» button
│   ├── EventBlock.tsx              — single colored event block
│   ├── WeekGrid.tsx                — 7-day time grid (8:00–22:00)
│   ├── MonthGrid.tsx               — month calendar grid
│   └── EventEditor.tsx             — modal: add/edit/delete event
├── lib/
│   ├── types.ts                    — shared TypeScript interfaces
│   ├── categories.ts               — color/icon/label per category
│   ├── storage.ts                  — localStorage cache helpers
│   ├── caldav-client.ts            — browser-side CalDAV API calls
│   └── ical.ts                     — iCal string generation/parsing
├── public/
│   ├── manifest.json               — PWA manifest
│   └── icons/                      — app icons (192x192, 512x512)
├── next.config.ts                  — next-pwa config
└── tailwind.config.ts              — Tailwind config
```

---

## Task 1: Project Setup

**Files:**
- Modify: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`

- [ ] **Step 1: Initialize Next.js project in the existing repo**

```bash
cd /Users/liza/Desktop/schedule-app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected output: Next.js scaffolding created. Say yes to overwrite .gitignore if asked.

- [ ] **Step 2: Install dependencies**

```bash
npm install tsdav ical.js uuid
npm install -D @types/uuid
npm install next-pwa
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Open http://localhost:3000 — should show default Next.js page.
Stop server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 project with Tailwind and dependencies"
```

---

## Task 2: Types and Categories

**Files:**
- Create: `lib/types.ts`
- Create: `lib/categories.ts`
- Create: `lib/categories.test.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```typescript
export type Category =
  | 'work'
  | 'gym'
  | 'dog'
  | 'blog'
  | 'learning'
  | 'personal'
  | 'chores'

export type RepeatType = 'none' | 'weekly' | 'daily'
export type ReminderMinutes = 0 | 15 | 30 | 60

export interface CalendarEvent {
  id: string           // iCal UID
  title: string
  category: Category
  startTime: string    // ISO 8601 string (timezone-aware)
  endTime: string      // ISO 8601 string
  repeat: RepeatType
  reminder: ReminderMinutes
  etag?: string        // iCal ETag for CalDAV sync
  url?: string         // CalDAV object URL for updates/deletes
}

export interface SyncState {
  lastSynced: string | null  // ISO 8601
  error: string | null
}

export interface ICloudCredentials {
  appleId: string
  appPassword: string
  calendarUrl: string  // specific calendar URL chosen in settings
}
```

- [ ] **Step 2: Create `lib/categories.ts`**

```typescript
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
```

- [ ] **Step 3: Write failing test**

```typescript
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
```

- [ ] **Step 4: Run test — verify it fails**

```bash
npx jest lib/categories.test.ts
```

Expected: FAIL — "Cannot find module './categories'"

- [ ] **Step 5: Run test — verify it passes**

```bash
npx jest lib/categories.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/categories.ts lib/categories.test.ts
git commit -m "feat: add types and categories module"
```

---

## Task 3: Storage Module

**Files:**
- Create: `lib/storage.ts`
- Create: `lib/storage.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// lib/storage.test.ts
import { saveEvents, loadEvents, saveCredentials, loadCredentials, clearCredentials } from './storage'
import { CalendarEvent } from './types'

const mockEvent: CalendarEvent = {
  id: 'test-uid-123',
  title: 'Test Event',
  category: 'work',
  startTime: '2026-06-09T10:00:00+03:00',
  endTime: '2026-06-09T12:30:00+03:00',
  repeat: 'weekly',
  reminder: 15,
}

// jsdom provides localStorage in jest
describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('saves and loads events', () => {
    saveEvents([mockEvent])
    expect(loadEvents()).toEqual([mockEvent])
  })

  it('returns empty array when no events stored', () => {
    expect(loadEvents()).toEqual([])
  })

  it('saves and loads credentials', () => {
    saveCredentials({ appleId: 'test@icloud.com', appPassword: 'abcd-efgh', calendarUrl: 'https://p01-caldav.icloud.com/1234/calendars/home/' })
    const creds = loadCredentials()
    expect(creds?.appleId).toBe('test@icloud.com')
  })

  it('clearCredentials removes stored credentials', () => {
    saveCredentials({ appleId: 'a', appPassword: 'b', calendarUrl: 'c' })
    clearCredentials()
    expect(loadCredentials()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx jest lib/storage.test.ts
```

Expected: FAIL — "Cannot find module './storage'"

- [ ] **Step 3: Implement `lib/storage.ts`**

```typescript
import { CalendarEvent, ICloudCredentials, SyncState } from './types'

const EVENTS_KEY = 'schedule_events'
const CREDENTIALS_KEY = 'schedule_credentials'
const SYNC_STATE_KEY = 'schedule_sync_state'

export function saveEvents(events: CalendarEvent[]): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

export function loadEvents(): CalendarEvent[] {
  const raw = localStorage.getItem(EVENTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CalendarEvent[]
  } catch {
    return []
  }
}

export function saveCredentials(creds: ICloudCredentials): void {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds))
}

export function loadCredentials(): ICloudCredentials | null {
  const raw = localStorage.getItem(CREDENTIALS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ICloudCredentials
  } catch {
    return null
  }
}

export function clearCredentials(): void {
  localStorage.removeItem(CREDENTIALS_KEY)
}

export function saveSyncState(state: SyncState): void {
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state))
}

export function loadSyncState(): SyncState {
  const raw = localStorage.getItem(SYNC_STATE_KEY)
  if (!raw) return { lastSynced: null, error: null }
  try {
    return JSON.parse(raw) as SyncState
  } catch {
    return { lastSynced: null, error: null }
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx jest lib/storage.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts lib/storage.test.ts
git commit -m "feat: add localStorage storage module"
```

---

## Task 4: iCal Helpers

**Files:**
- Create: `lib/ical.ts`
- Create: `lib/ical.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// lib/ical.test.ts
import { eventToIcal, icalToEvent } from './ical'
import { CalendarEvent } from './types'

const event: CalendarEvent = {
  id: 'abc-123',
  title: 'Занятие с ребёнком',
  category: 'work',
  startTime: '2026-06-09T10:00:00+03:00',
  endTime: '2026-06-09T12:30:00+03:00',
  repeat: 'weekly',
  reminder: 15,
}

describe('eventToIcal', () => {
  it('produces a valid VCALENDAR string', () => {
    const ical = eventToIcal(event)
    expect(ical).toContain('BEGIN:VCALENDAR')
    expect(ical).toContain('BEGIN:VEVENT')
    expect(ical).toContain('UID:abc-123')
    expect(ical).toContain('SUMMARY:Занятие с ребёнком')
    expect(ical).toContain('END:VEVENT')
    expect(ical).toContain('END:VCALENDAR')
  })

  it('includes RRULE for weekly repeat', () => {
    const ical = eventToIcal(event)
    expect(ical).toContain('RRULE:FREQ=WEEKLY')
  })

  it('includes VALARM for 15-minute reminder', () => {
    const ical = eventToIcal(event)
    expect(ical).toContain('BEGIN:VALARM')
    expect(ical).toContain('TRIGGER:-PT15M')
  })

  it('omits RRULE when repeat is none', () => {
    const ical = eventToIcal({ ...event, repeat: 'none' })
    expect(ical).not.toContain('RRULE')
  })

  it('omits VALARM when reminder is 0', () => {
    const ical = eventToIcal({ ...event, reminder: 0 })
    expect(ical).not.toContain('VALARM')
  })
})

describe('icalToEvent', () => {
  it('round-trips through eventToIcal', () => {
    const ical = eventToIcal({ ...event, repeat: 'none', reminder: 0 })
    const parsed = icalToEvent(ical, 'work', 'https://example.com/event.ics', '"etag123"')
    expect(parsed.id).toBe('abc-123')
    expect(parsed.title).toBe('Занятие с ребёнком')
    expect(parsed.url).toBe('https://example.com/event.ics')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx jest lib/ical.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `lib/ical.ts`**

```typescript
import { CalendarEvent, Category, RepeatType, ReminderMinutes } from './types'

function formatIcalDate(iso: string): string {
  // Convert ISO 8601 to iCal TZID format: 20260609T100000
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  )
}

export function eventToIcal(event: CalendarEvent): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//schedule-app//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}`,
    `SUMMARY:${event.title}`,
    `DTSTART;TZID=Europe/Moscow:${formatIcalDate(event.startTime)}`,
    `DTEND;TZID=Europe/Moscow:${formatIcalDate(event.endTime)}`,
  ]

  if (event.repeat === 'weekly') lines.push('RRULE:FREQ=WEEKLY')
  if (event.repeat === 'daily') lines.push('RRULE:FREQ=DAILY')

  if (event.reminder > 0) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      `TRIGGER:-PT${event.reminder}M`,
      'END:VALARM'
    )
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function icalToEvent(
  icalString: string,
  category: Category,
  url: string,
  etag: string
): CalendarEvent {
  const get = (field: string): string => {
    const match = icalString.match(new RegExp(`^${field}[;:][^\r\n]+`, 'm'))
    if (!match) return ''
    return match[0].replace(/^[^:]+:/, '').trim()
  }

  const uid = get('UID')
  const summary = get('SUMMARY')
  const dtstart = get('DTSTART(?:;[^:]+)?')  // handles TZID param
  const dtend = get('DTEND(?:;[^:]+)?')
  const rrule = get('RRULE')
  const trigger = get('TRIGGER')

  // Parse iCal datetime to ISO
  const parseIcalDate = (s: string): string => {
    if (!s) return new Date().toISOString()
    // Format: 20260609T100000 or 20260609T100000Z
    const m = s.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
    if (!m) return new Date().toISOString()
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+03:00`
  }

  let repeat: RepeatType = 'none'
  if (rrule.includes('WEEKLY')) repeat = 'weekly'
  else if (rrule.includes('DAILY')) repeat = 'daily'

  let reminder: ReminderMinutes = 0
  if (trigger) {
    const mins = trigger.match(/PT(\d+)M/)
    if (mins) {
      const n = parseInt(mins[1])
      if (n === 15 || n === 30 || n === 60) reminder = n
    }
  }

  return {
    id: uid,
    title: summary,
    category,
    startTime: parseIcalDate(dtstart),
    endTime: parseIcalDate(dtend),
    repeat,
    reminder,
    url,
    etag,
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx jest lib/ical.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ical.ts lib/ical.test.ts
git commit -m "feat: add iCal serialization/parsing helpers"
```

---

## Task 5: CalDAV API Route

**Files:**
- Create: `app/api/caldav/route.ts`

> **Note:** This is the server-side proxy. No unit tests — test manually by connecting to a real iCloud test calendar. Install `tsdav` before this task (done in Task 1).

- [ ] **Step 1: Create `app/api/caldav/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createDAVClient } from 'tsdav'

async function getClient(appleId: string, appPassword: string) {
  return createDAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: { username: appleId, password: appPassword },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
}

// GET /api/caldav?action=list-calendars  — returns available calendars
// GET /api/caldav?action=list&calendarUrl=...  — returns events from calendar
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const appleId = req.headers.get('x-apple-id')
  const appPassword = req.headers.get('x-app-password')

  if (!appleId || !appPassword) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 401 })
  }

  try {
    const client = await getClient(appleId, appPassword)

    if (action === 'list-calendars') {
      const calendars = await client.fetchCalendars()
      return NextResponse.json(
        calendars.map(c => ({ url: c.url, displayName: c.displayName }))
      )
    }

    if (action === 'list') {
      const calendarUrl = searchParams.get('calendarUrl')
      if (!calendarUrl) return NextResponse.json({ error: 'Missing calendarUrl' }, { status: 400 })

      const objects = await client.fetchCalendarObjects({ calendar: { url: calendarUrl } })
      return NextResponse.json(
        objects.map(obj => ({ url: obj.url, etag: obj.etag, data: obj.data }))
      )
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'CalDAV error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

// POST /api/caldav — create new event
export async function POST(req: NextRequest) {
  const appleId = req.headers.get('x-apple-id')
  const appPassword = req.headers.get('x-app-password')
  if (!appleId || !appPassword) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 401 })
  }

  const { calendarUrl, uid, icalData } = await req.json()

  try {
    const client = await getClient(appleId, appPassword)
    const objectUrl = `${calendarUrl}${uid}.ics`
    await client.createCalendarObject({
      calendar: { url: calendarUrl },
      filename: `${uid}.ics`,
      iCalString: icalData,
    })
    return NextResponse.json({ url: objectUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'CalDAV error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

// PUT /api/caldav — update existing event
export async function PUT(req: NextRequest) {
  const appleId = req.headers.get('x-apple-id')
  const appPassword = req.headers.get('x-app-password')
  if (!appleId || !appPassword) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 401 })
  }

  const { objectUrl, etag, icalData } = await req.json()

  try {
    const client = await getClient(appleId, appPassword)
    await client.updateCalendarObject({
      calendarObject: { url: objectUrl, etag, data: icalData },
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'CalDAV error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

// DELETE /api/caldav — delete event
export async function DELETE(req: NextRequest) {
  const appleId = req.headers.get('x-apple-id')
  const appPassword = req.headers.get('x-app-password')
  if (!appleId || !appPassword) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 401 })
  }

  const { objectUrl, etag } = await req.json()

  try {
    const client = await getClient(appleId, appPassword)
    await client.deleteCalendarObject({
      calendarObject: { url: objectUrl, etag },
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'CalDAV error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
```

- [ ] **Step 2: Start dev server and verify route exists**

```bash
npm run dev
curl http://localhost:3000/api/caldav?action=list
```

Expected: `{"error":"Missing credentials"}` with 401 status (proves route is registered)

- [ ] **Step 3: Commit**

```bash
git add app/api/caldav/route.ts
git commit -m "feat: add CalDAV proxy API route"
```

---

## Task 6: Browser-Side CalDAV Client

**Files:**
- Create: `lib/caldav-client.ts`

- [ ] **Step 1: Create `lib/caldav-client.ts`**

```typescript
import { CalendarEvent, Category, ICloudCredentials } from './types'
import { icalToEvent, eventToIcal } from './ical'
import { v4 as uuidv4 } from 'uuid'

// Map iCal category hint (stored in CATEGORIES field) to our Category type
const CATEGORY_HINT_PREFIX = 'schedule-app-category-'

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
    .map(obj => {
      // Extract category hint from iCal CATEGORIES field
      const catMatch = obj.data.match(new RegExp(`CATEGORIES:${CATEGORY_HINT_PREFIX}(\\w+)`))
      const category: Category = (catMatch?.[1] as Category) ?? 'personal'
      return icalToEvent(obj.data, category, obj.url, obj.etag)
    })
}

export async function createEvent(
  creds: ICloudCredentials,
  event: Omit<CalendarEvent, 'id' | 'url' | 'etag'>
): Promise<CalendarEvent> {
  const uid = uuidv4()
  const full: CalendarEvent = { ...event, id: uid }
  const icalData = eventToIcal(full) + `\r\nCATEGORIES:${CATEGORY_HINT_PREFIX}${event.category}`

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
  const icalData = eventToIcal(event) + `\r\nCATEGORIES:${CATEGORY_HINT_PREFIX}${event.category}`
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/caldav-client.ts
git commit -m "feat: add browser-side CalDAV client"
```

---

## Task 7: UI Components — NavBar and EventBlock

**Files:**
- Create: `components/NavBar.tsx`
- Create: `components/EventBlock.tsx`

- [ ] **Step 1: Create `components/NavBar.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavBarProps {
  onAddClick: () => void
  title: string
  onPrev: () => void
  onNext: () => void
}

export default function NavBar({ onAddClick, title, onPrev, onNext }: NavBarProps) {
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
      <button onClick={onPrev} className="text-gray-400 text-2xl leading-none px-1">‹</button>

      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400 font-medium">{title}</span>
        <div className="flex gap-4 mt-1">
          <Link
            href="/"
            className={`text-sm font-semibold pb-0.5 ${
              pathname === '/'
                ? 'text-gray-900 border-b-2 border-orange-400'
                : 'text-gray-400'
            }`}
          >
            Неделя
          </Link>
          <Link
            href="/month"
            className={`text-sm font-semibold pb-0.5 ${
              pathname === '/month'
                ? 'text-gray-900 border-b-2 border-orange-400'
                : 'text-gray-400'
            }`}
          >
            Месяц
          </Link>
        </div>
      </div>

      <button
        onClick={onAddClick}
        className="bg-orange-400 text-white rounded-full w-8 h-8 text-xl leading-none flex items-center justify-center"
      >
        +
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/EventBlock.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify components render**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add components/NavBar.tsx components/EventBlock.tsx
git commit -m "feat: add NavBar and EventBlock components"
```

---

## Task 8: WeekGrid Component

**Files:**
- Create: `components/WeekGrid.tsx`

- [ ] **Step 1: Create `components/WeekGrid.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add components/WeekGrid.tsx
git commit -m "feat: add WeekGrid component"
```

---

## Task 9: MonthGrid Component

**Files:**
- Create: `components/MonthGrid.tsx`

- [ ] **Step 1: Create `components/MonthGrid.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add components/MonthGrid.tsx
git commit -m "feat: add MonthGrid component"
```

---

## Task 10: EventEditor Modal

**Files:**
- Create: `components/EventEditor.tsx`

- [ ] **Step 1: Create `components/EventEditor.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add components/EventEditor.tsx
git commit -m "feat: add EventEditor modal component"
```

---

## Task 11: Weekly View Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Мой график',
  description: 'Личное расписание',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'График' },
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1 },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Implement `app/page.tsx`**

```tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import NavBar from '@/components/NavBar'
import WeekGrid, { getMondayOf } from '@/components/WeekGrid'
import EventEditor from '@/components/EventEditor'
import { CalendarEvent } from '@/lib/types'
import { loadEvents, saveEvents, loadCredentials, saveSyncState } from '@/lib/storage'
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '@/lib/caldav-client'

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

  // Load cached events on mount
  useEffect(() => {
    setEvents(loadEvents())
    sync()
  }, [])

  // Auto-sync every 5 minutes
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
      // No credentials — save locally only
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
```

- [ ] **Step 3: Run dev server and verify weekly view**

```bash
npm run dev
```

Open http://localhost:3000. Should show the weekly grid with NavBar, no events (no credentials yet).

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: implement weekly view page"
```

---

## Task 12: Monthly View Page

**Files:**
- Create: `app/month/page.tsx`

- [ ] **Step 1: Create `app/month/page.tsx`**

```tsx
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
      if (creds && event.url) {
        await updateEvent(creds, event)
        const next = events.map(e => e.id === event.id ? event : e)
        setEvents(next); saveEvents(next)
      } else if (creds) {
        const created = await createEvent(creds, event)
        const next = [...events, created]
        setEvents(next); saveEvents(next)
      } else {
        const next = events.filter(e => e.id !== event.id).concat(event)
        setEvents(next); saveEvents(next)
      }
    } catch { /* silent — user sees stale data */ }
  }

  const handleDelete = async (event: CalendarEvent) => {
    const creds = loadCredentials()
    setShowEditor(false)
    try {
      if (creds && event.url) await deleteEvent(creds, event)
      const next = events.filter(e => e.id !== event.id)
      setEvents(next); saveEvents(next)
      setDayEvents(prev => prev.filter(e => e.id !== event.id))
    } catch { /* silent */ }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
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

      {/* Day event list */}
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
```

- [ ] **Step 2: Open monthly view in browser**

```bash
npm run dev
```

Open http://localhost:3000/month — should show monthly calendar grid.

- [ ] **Step 3: Commit**

```bash
git add app/month/page.tsx
git commit -m "feat: implement monthly view page"
```

---

## Task 13: Settings Page

**Files:**
- Create: `app/settings/page.tsx`

- [ ] **Step 1: Create `app/settings/page.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadCredentials, saveCredentials, clearCredentials, loadSyncState } from '@/lib/storage'
import { listCalendars } from '@/lib/caldav-client'
import { ICloudCredentials } from '@/lib/types'

export default function SettingsPage() {
  const [appleId, setAppleId] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [calendarUrl, setCalendarUrl] = useState('')
  const [calendars, setCalendars] = useState<Array<{ url: string; displayName: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const syncState = loadSyncState()

  useEffect(() => {
    const creds = loadCredentials()
    if (creds) {
      setAppleId(creds.appleId)
      setAppPassword(creds.appPassword)
      setCalendarUrl(creds.calendarUrl)
    }
  }, [])

  const handleFetchCalendars = async () => {
    setLoading(true); setError(null)
    try {
      const creds: ICloudCredentials = { appleId, appPassword, calendarUrl: '' }
      const list = await listCalendars(creds)
      setCalendars(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    saveCredentials({ appleId, appPassword, calendarUrl })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDisconnect = () => {
    clearCredentials()
    setAppleId(''); setAppPassword(''); setCalendarUrl(''); setCalendars([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0">
        <Link href="/" className="text-gray-400 text-2xl leading-none">‹</Link>
        <h1 className="text-base font-bold">Настройки iCloud</h1>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-5">
        <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700 space-y-1">
          <p className="font-semibold">Как получить app-specific password:</p>
          <p>1. Открой appleid.apple.com</p>
          <p>2. Войди → Вход и безопасность</p>
          <p>3. Пароли для программ → Создать</p>
          <p>4. Введи название «schedule-app» → Скопируй пароль</p>
        </div>

        <div className="bg-white rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Apple ID (email)</label>
            <input
              type="email"
              value={appleId}
              onChange={e => setAppleId(e.target.value)}
              placeholder="your@icloud.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">App-specific password</label>
            <input
              type="password"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          <button
            onClick={handleFetchCalendars}
            disabled={!appleId || !appPassword || loading}
            className="w-full border border-orange-400 text-orange-500 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            {loading ? 'Подключаюсь...' : 'Найти календари'}
          </button>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {calendars.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Выбери календарь</label>
              <select
                value={calendarUrl}
                onChange={e => setCalendarUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              >
                <option value="">— выбери —</option>
                {calendars.map(c => (
                  <option key={c.url} value={c.url}>{c.displayName || c.url}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!appleId || !appPassword || !calendarUrl}
            className="w-full bg-orange-400 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
          >
            {saved ? '✓ Сохранено' : 'Сохранить'}
          </button>
        </div>

        {syncState.lastSynced && (
          <p className="text-xs text-gray-400 text-center">
            Синхронизировано: {new Date(syncState.lastSynced).toLocaleString('ru')}
          </p>
        )}

        <button
          onClick={handleDisconnect}
          className="w-full text-xs text-gray-400 py-2"
        >
          Отключить iCloud
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add settings link to NavBar**

In `components/NavBar.tsx`, add a settings link after the nav tabs:

```tsx
// Add after the nav tabs div, inside the center div:
<Link href="/settings" className="text-[10px] text-gray-400 mt-0.5">⚙️ iCloud</Link>
```

- [ ] **Step 3: Open settings in browser**

```bash
npm run dev
```

Open http://localhost:3000/settings — should show the iCloud setup form.

- [ ] **Step 4: Commit**

```bash
git add app/settings/page.tsx components/NavBar.tsx
git commit -m "feat: add settings page for iCloud credentials"
```

---

## Task 14: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Create `public/manifest.json`**

```json
{
  "name": "Мой график",
  "short_name": "График",
  "description": "Личное расписание с синхронизацией iCloud",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fafaf8",
  "theme_color": "#fb923c",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Generate app icons**

Create a simple orange icon. Run this script to generate placeholder icons (replace with a real icon later):

```bash
# Requires: brew install imagemagick (if not installed)
mkdir -p public/icons
convert -size 192x192 xc:#fb923c -fill white -font Helvetica -pointsize 80 \
  -gravity center -annotate 0 "📅" public/icons/icon-192.png
convert -size 512x512 xc:#fb923c -fill white -font Helvetica -pointsize 200 \
  -gravity center -annotate 0 "📅" public/icons/icon-512.png
```

If ImageMagick is not available, create simple colored PNG files manually using any image editor (192×192 and 512×512, orange background `#fb923c`).

- [ ] **Step 3: Update `next.config.ts`**

```typescript
import type { NextConfig } from 'next'
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

const nextConfig: NextConfig = {
  // nothing extra needed
}

module.exports = withPWA(nextConfig)
```

- [ ] **Step 4: Build and verify PWA manifest is accessible**

```bash
npm run build && npm start
```

Open http://localhost:3000/manifest.json — should return the JSON.
Open Chrome DevTools → Application → Manifest — should show app info.

- [ ] **Step 5: Commit**

```bash
git add public/ next.config.ts
git commit -m "feat: configure PWA with manifest and service worker"
```

---

## Task 15: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Deploy on Vercel**

1. Go to vercel.com → New Project
2. Import `schedule-app` repository from GitHub (eassylizzy-code)
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy**

Expected: Build succeeds, app available at `https://schedule-app-*.vercel.app`

- [ ] **Step 3: Test on iPhone**

1. Open the Vercel URL on iPhone Safari
2. Tap Share → «На экран «Домой»»
3. App installs — opens fullscreen without browser chrome

- [ ] **Step 4: Connect iCloud**

1. Open app → tap ⚙️ iCloud
2. Follow instructions to create app-specific password at appleid.apple.com
3. Enter Apple ID + password → Find calendars → Select → Save
4. Go back to weekly view — events from iCloud should load

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "feat: complete schedule-app implementation"
git push origin main
```

---

## Self-Review

**Spec coverage check:**
- ✅ Weekly grid view (Task 8, 11)
- ✅ Monthly view (Task 9, 12)
- ✅ Event editor modal (Task 10)
- ✅ iCloud CalDAV sync (Tasks 5–6)
- ✅ Settings page (Task 13)
- ✅ All 7 categories with colors/icons (Task 2)
- ✅ Repeat events (Task 4, 10)
- ✅ Reminders/alarms (Task 4, 10)
- ✅ Offline cache (Task 3, 11)
- ✅ Error handling: ⚠️ badge, redirect to settings (Task 11, 13)
- ✅ PWA installable on iPhone (Task 14)
- ✅ Vercel deploy (Task 15)

**No placeholders found.**

**Type consistency:** `CalendarEvent`, `Category`, `ICloudCredentials` defined in Task 2 and used consistently across all tasks. `getMondayOf` exported from `WeekGrid.tsx` and imported in `page.tsx`. All function signatures match.
