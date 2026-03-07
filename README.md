# 🦡 Badger — Warehouse Management Web App

**Live URL:** https://badger.augesrob.net  
**GitHub Repo:** https://github.com/augesrob/badger  
**Hosting:** Vercel (auto-deploys from GitHub `main` branch)  
**Database:** Supabase (https://supabase.com — project: `badger`)

---

## 📋 What Is This?

Badger is a real-time warehouse operations management system built for Badger Liquor in Fond du Lac, WI. It allows warehouse supervisors, print room staff, and truck movers to monitor and manage live truck movements, loading dock assignments, driver pre-shift setup, and more — all from a browser.

It is a private, login-required web application. No page is accessible without signing in first.

---

## 🏗️ How It's Built

```
Developer pushes code to GitHub (main branch)
        ↓
Vercel detects the push automatically
        ↓
Vercel pulls the code and runs: npm run build
        ↓
New version goes live at https://badger.augesrob.net
        ↓
All users see the update immediately (no manual deploy needed)
```

**Tech stack:**
- **Next.js 14** — React-based web framework (TypeScript)
- **Tailwind CSS** — Styling
- **Supabase** — Database, authentication, and real-time data sync
- **Vercel** — Hosting and automatic deployments

---

## 📁 Repository Structure

```
badger/
├── src/
│   ├── app/                    ← All pages (each folder = a route)
│   │   ├── page.tsx            ← Home / dashboard (/)
│   │   ├── login/              ← Login page (/login)
│   │   ├── movement/           ← Live truck movement (/movement)
│   │   ├── preshift/           ← Pre-shift door setup (/preshift)
│   │   ├── printroom/          ← Print room screen (/printroom)
│   │   ├── routesheet/         ← Route sheet viewer (/routesheet)
│   │   ├── cheatsheet/         ← Cheat sheet viewer (/cheatsheet)
│   │   ├── drivers/            ← Driver management (/drivers/*)
│   │   ├── fleet/              ← Fleet management (/fleet)
│   │   ├── chat/               ← Internal chat (/chat)
│   │   ├── admin/              ← Admin panel (/admin, /admin/users)
│   │   ├── profile/            ← User profile (/profile)
│   │   ├── download/           ← Android app download page (/download)
│   │   ├── statuses/           ← Status value management (/statuses)
│   │   └── api/                ← Server-side API routes (never hit browser directly)
│   │       ├── release/        ← Fetches latest Android APK from GitHub (server-side, uses GITHUB_TOKEN)
│   │       ├── cron/backup/    ← Weekly database backup, triggered by Vercel cron job
│   │       ├── notify-truck/   ← Sends truck status notifications
│   │       ├── route-email/    ← Sends route sheet emails via Gmail
│   │       ├── gmail-auth/     ← Handles Gmail OAuth2 token management
│   │       ├── badger/         ← Internal utility endpoints
│   │       ├── admin/          ← Admin-only API actions
│   │       └── user/           ← User management endpoints
│   ├── components/             ← Reusable UI building blocks
│   │   ├── Nav.tsx             ← Top navigation bar (role-aware, shows/hides tabs by permission)
│   │   ├── AuthProvider.tsx    ← Supplies login state + `can()` permission checker to all pages
│   │   ├── RequirePage.tsx     ← Wraps protected pages — redirects if user lacks permission
│   │   ├── GlobalMessageBanner.tsx ← Displays site-wide admin messages at top of every page
│   │   ├── NotificationBell.tsx    ← Bell icon with unread notification count
│   │   ├── NotificationPrefs.tsx   ← User notification preference settings
│   │   ├── ThemeProvider.tsx   ← Dark/light mode toggle
│   │   ├── Toast.tsx           ← Popup toast messages
│   │   ├── TTSPanel.tsx        ← Text-to-speech panel settings
│   │   ├── RoleManager.tsx     ← Admin UI for editing user roles
│   │   └── KeepAlive.tsx       ← Prevents Supabase connection from timing out
│   ├── lib/                    ← Shared utility code
│   └── middleware.ts           ← Authentication gate — runs on every page request,
│                                  redirects unauthenticated users to /login
├── .env.local.example          ← Template showing all required environment variables
├── vercel.json                 ← Vercel config (defines weekly cron job schedule)
├── next.config.mjs             ← Next.js configuration
├── tailwind.config.ts          ← Tailwind CSS configuration
└── CLAUDE-CONTEXT.md           ← AI developer notes for session continuity
```

---

## 🔑 Environment Variables

These are set in **Vercel → Project Settings → Environment Variables**. They are never stored in the code or committed to GitHub.

For local development, copy `.env.local.example` to `.env.local` and fill in real values.

| Variable | Where to Get It | What It's Used For |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | The URL of the Supabase project. `NEXT_PUBLIC_` prefix means it's safe to expose in the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | The public "anonymous" API key for Supabase. Row-Level Security (RLS) policies on the database enforce what this key can and cannot access. |
| `GITHUB_TOKEN` | GitHub → Settings → Developer Settings → Fine-grained tokens | A **read-only** personal access token with access to the `badger-android` repo. Used **server-side only** (never reaches the browser) to fetch the latest APK release info for the `/download` page. Works even when the repo is private. |

**Example `.env.local` (development only — never commit this file):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GITHUB_TOKEN=github_pat_11ABCDEF...
```

> ⚠️ There may be additional secrets for Gmail OAuth2 and email sending (route sheet emails). These are also set in Vercel environment variables. Check the Vercel project dashboard for the full current list.

---

## 🗄️ Database (Supabase)

**Dashboard:** https://supabase.com (login required)  
**Project name:** badger

Supabase provides:
- **PostgreSQL database** — stores all warehouse data (trucks, doors, drivers, users, etc.)
- **Authentication** — manages user accounts and sessions (email + password login)
- **Row-Level Security (RLS)** — database-level rules that restrict what each user can read/write based on their role
- **Real-time subscriptions** — pushes live data changes to connected browsers and the Android app instantly (no page refresh needed)

### Key Database Tables

| Table | Purpose |
|---|---|
| `profiles` | User accounts — display name, role, avatar, permissions |
| `live_movement` | Current truck locations and statuses — the live board |
| `loading_doors` | Warehouse dock doors and their current assignments |
| `preshift_setup` | Pre-shift truck-to-door placement data |
| `printroom_entries` | Print room queue entries |
| `status_values` | Configurable truck status options (e.g. "In Door", "On Route") |
| `door_status_values` | Configurable door status options |
| `dock_lock_status_values` | Dock lock status options |
| `tractors` | Tractor/semi inventory |
| `trailers` | Trailer inventory |
| `debug_logs` | Remote logs from Android app (capped at 1,000 rows) |
| `backup_log` | Record of each weekly database backup |
| `global_messages` | Site-wide announcements shown in the banner |
| `notifications` | Per-user notification inbox |

---

## 👤 User Roles & Permissions

Every user has a `role` stored in the `profiles` table. The `RequirePage` component and `can()` function in `AuthProvider.tsx` check this role before showing any page or nav tab.

| Role | Access Level |
|---|---|
| `admin` | Full access to everything including Admin panel and user management |
| `print_room` | Print room, PreShift, Route Sheet, Cheat Sheet, Live Movement |
| `truck_mover` | Live Movement, PreShift |
| `trainee` | Print Room only |
| `driver` | Drivers section only |

---

## ⚙️ Automated Cron Job (Weekly Database Backup)

Defined in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 18 * * 0"
    }
  ]
}
```

Every **Sunday at 6:00 PM UTC**, Vercel automatically calls `/api/cron/backup`. This API route:
1. Queries every operational table in Supabase
2. Formats the data as a structured backup
3. Posts it to a Discord channel as a file attachment
4. Logs the result to the `backup_log` table

No manual action is required. The backup runs automatically every week.

---

## 🚀 Deploying Changes

1. Make code changes locally
2. Run `npm run dev` to test locally at `http://localhost:3000`
3. Push to GitHub `main` branch: `git push origin main`
4. Vercel detects the push within seconds and builds + deploys automatically
5. Changes are live at https://badger.augesrob.net in ~1-2 minutes

**You never need to manually deploy.** Vercel handles it entirely from the GitHub push.

---

## 🖥️ Running Locally (Developer Setup)

Requirements: Node.js 18+, npm

```bash
# 1. Clone the repo
git clone https://github.com/augesrob/badger.git
cd badger

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase URL, anon key, and GitHub token

# 4. Start the development server
npm run dev
# App runs at http://localhost:3000
```

---

## 🔒 Security Notes

- The app is fully behind authentication — no page loads without a valid login session
- `middleware.ts` runs on every request and redirects unauthenticated users to `/login`
- Supabase RLS policies enforce data access at the database level (a user can only see/modify what their role permits, even if they try to call the API directly)
- The `GITHUB_TOKEN` for the download page is server-side only — it is never sent to the browser
- All secrets live in Vercel environment variables, never in the codebase
