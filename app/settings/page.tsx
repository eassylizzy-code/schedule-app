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
