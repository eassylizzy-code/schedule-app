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
