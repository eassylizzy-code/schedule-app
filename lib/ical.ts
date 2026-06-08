import { CalendarEvent, Category, RepeatType, ReminderMinutes } from './types'

function formatIcalDate(iso: string): string {
  // Convert ISO 8601 to iCal datetime format: 20260609T100000
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
