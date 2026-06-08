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
