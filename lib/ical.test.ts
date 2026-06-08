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
