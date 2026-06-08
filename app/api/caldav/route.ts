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
