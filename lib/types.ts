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
