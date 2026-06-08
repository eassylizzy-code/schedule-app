# Schedule App — Design Spec
Date: 2026-06-08

## Overview

A personal schedule PWA for Liza — weekly template + monthly calendar, synced automatically with iCloud Calendar. Mobile-first, installable on iPhone, also works on laptop.

---

## User Context

Weekly recurring schedule:
- **Monday / Wednesday:** child lessons 10:00–12:30 and 17:00–19:30
- **Thursday:** child lesson 10:00–12:30, adult client 14:00–15:30 (1.5h)
- **Friday:** child lesson 17:00–19:30
- **Tuesday + Friday + Sunday:** gym (~1.5h, daytime)
- **Daily (all 7 days):** dog walk morning (~8:30) and evening (~20:00), 30 min each
- **Tuesday:** blog work + cooking
- **Thursday evening:** cooking (after client)
- **Sunday:** cooking + gym
- **Saturday:** cleaning + learning
- **Weekdays between sessions:** learning (child/adult psychology)
- **Saturday evening / Sunday:** drawing, personal time
- **One evening/week (flexible):** friends

Wake time on work days: max 8:20. Bedtime: ~00:00–01:00.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | Frontend + API routes in one project, easy Vercel deploy |
| Styling | Tailwind CSS | Clean/bright Notion-like style chosen by user |
| PWA | next-pwa | Installable on iPhone home screen |
| CalDAV | tsdav (in API routes) | No CORS issues, works with iCloud |
| Hosting | Vercel (free tier) | One-click deploy from GitHub |

---

## Architecture

### Sync flow
1. User enters Apple ID app-specific password once in Settings (stored in localStorage — never sent to any server except iCloud directly via API route)
2. On app open and every 5 minutes: API route `/api/caldav` fetches events from iCloud
3. On create/edit/delete: change sent to iCloud immediately via same API route
4. Changes appear in Apple Calendar on iPhone and Mac automatically (iCloud handles device sync)
5. Reminders set in the app are stored as iCloud alarms — notifications come from Apple Calendar natively

### Offline
- Last-fetched events cached in localStorage
- App is viewable offline; sync resumes when connection returns
- Warning icon shown when data may be stale

---

## Screens

### 1. Weekly View (main screen)
- 7-day grid with time axis (8:00–22:00)
- Color-coded event blocks with icon + title + duration
- Tap empty slot → open EventEditor (new event)
- Tap existing block → open EventEditor (edit/delete)
- Navigation arrows ← → to move between weeks
- Auto-scroll to current time on open

### 2. Monthly View
- Standard calendar grid
- Colored dots on days that have events
- Tap a day → show event list for that day
- Tap event → open EventEditor
- Tap empty day → open EventEditor with that date pre-filled

### 3. Event Editor (modal)
Fields:
- Title (text input)
- Category (picker: Work / Gym / Dog / Blog / Learning / Personal / Chores)
- Date + start time + end time
- Repeat (none / every week / every day)
- Reminder (none / 15 min / 30 min / 1 hour before)
- Delete button (red, with confirmation)

### 4. Settings
- iCloud app-specific password input (masked)
- Calendar selector (choose which iCloud calendar to use)
- Sync status + last synced time
- Manual sync button

---

## Event Categories

| Category | Color | Icon | Examples |
|----------|-------|------|---------|
| Work | Blue `#3b82f6` | 👶👤 | Child lessons, adult client |
| Gym | Green `#22c55e` | 💪 | Gym sessions |
| Dog | Pink `#ec4899` | 🐕 | Morning/evening walks |
| Blog | Orange `#fb923c` | 📝 | Blog work |
| Learning | Indigo `#6366f1` | 📚 | Psychology reading/study |
| Personal | Yellow `#eab308` | 🎨👥 | Drawing, friends, meditation |
| Chores | Gray `#94a3b8` | 🧹🍳 | Cleaning, cooking |

---

## File Structure

```
schedule-app/
├── app/
│   ├── page.tsx                 — weekly view (default)
│   ├── month/page.tsx           — monthly view
│   ├── settings/page.tsx        — iCloud credentials
│   └── api/caldav/route.ts      — CalDAV proxy (fetch/create/update/delete)
├── components/
│   ├── WeekGrid.tsx             — 7-day time grid
│   ├── MonthGrid.tsx            — month calendar
│   ├── EventBlock.tsx           — single colored event block
│   ├── EventEditor.tsx          — modal for add/edit/delete
│   └── NavBar.tsx               — week/month toggle + add button
├── lib/
│   ├── caldav.ts                — iCloud CalDAV operations
│   ├── categories.ts            — colors, icons, labels per category
│   └── storage.ts               — localStorage cache helpers
├── public/
│   └── manifest.json            — PWA manifest (icon, name, theme)
└── docs/superpowers/specs/
    └── 2026-06-08-schedule-app-design.md
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| iCloud unreachable | Show cached data, ⚠️ badge on header |
| Wrong app-specific password | Redirect to Settings with clear error message |
| Edit conflict (two devices) | Last write wins (matches Apple Calendar behavior) |
| No internet on open | Load from localStorage cache, sync when back online |

---

## Testing

- Unit tests: category logic, CalDAV data mapping
- Manual testing on iPhone via Vercel preview URL before each deploy
- No mocking of CalDAV — integration tests use a real test iCloud calendar

---

## Out of Scope

- Android support (PWA works but not tested)
- Google Calendar / other CalDAV providers
- Collaborative calendars / sharing
- Drag-and-drop rescheduling (tap-to-edit is sufficient)
