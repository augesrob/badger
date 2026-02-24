# BADGER PROJECT — CLAUDE CONTEXT FILE
# Generated: 2026-02-24
# Use this at the start of a new chat to bring Claude up to speed instantly.

---

## WHAT IS BADGER?
A truck/logistics management web app for Badger Liquor in Fond du Lac, WI.
Manages print room operations, truck staging (preshift), live truck movement tracking,
route sheets, cheat sheets, fleet inventory, chat, and notifications.
Built with Next.js 14 + Supabase + Tailwind. Deployed on Vercel.

---

## LIVE URLS
- **Production site:** https://badger.augesrob.net
- **GitHub repo:** https://github.com/augesrob/badger
- **Vercel:** auto-deploys on push to `main`
- **Supabase project:** Settings > API for URL/keys

---

## LOCAL PROJECT PATH
```
C:\Users\auges\StudioProjects\badger\
```

---

## TECH STACK
- **Framework:** Next.js 14 (App Router)
- **Database/Auth:** Supabase (PostgreSQL + Realtime + Auth)
- **Styling:** Tailwind CSS
- **PDF generation:** jsPDF (pure vector, no screenshot)
- **Email:** Nodemailer via Gmail SMTP
- **Hosting:** Vercel

---

## ENVIRONMENT VARIABLES (set in Vercel dashboard)
```
NEXT_PUBLIC_SUPABASE_URL          = https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = [anon key]
SUPABASE_SERVICE_ROLE_KEY         = [service role key]
BADGER_EMAIL_USER                 = [gmail address]
BADGER_EMAIL_PASS                 = [gmail app password]
BADGER_SMTP_HOST                  = smtp.gmail.com
RESEND_API_KEY                    = [kept but unused for SMS]
```
**Local dev:** Create `.env.local` with the same vars (not committed to git).

---

## SUPABASE CONFIGURATION
- **Site URL:** https://badger.augesrob.net
- **Redirect URLs:** https://badger.augesrob.net/**, http://localhost:3000/**

---

## DATABASE TABLES
| Table | Purpose |
|-------|---------|
| `profiles` | User accounts, roles, phone/carrier/SMS settings |
| `truck_subscriptions` | Which trucks each user wants SMS alerts for |
| `notifications` | In-app + SMS notification queue |
| `chat_rooms` | Global, role-based, and direct message rooms |
| `messages` | Chat messages linked to rooms |
| `role_permissions` | Dynamic role → pages/features access control |
| `loading_doors` | Door names + sort order |
| `printroom_entries` | Truck assignments per door + batch/row order |
| `live_movements` | Real-time truck status tracking |
| `tractors` | Tractor/semi truck numbers |
| (others) | Fleet, preshift staging, etc. |

**Schema file:** `supabase-schema.sql` in project root.

---

## ROLES & PERMISSIONS SYSTEM
Fully dynamic — stored in `role_permissions` table in Supabase.
Managed via the Admin > Role Manager UI.

### Built-in Roles
| Role | Access |
|------|--------|
| `admin` | Everything |
| `print_room` | All pages + edit features |
| `truck_mover` | Operations pages, no reset/admin |
| `trainee` | Movement, preshift, chat, profile, drivers/live |
| `driver` | Chat, profile, drivers pages, PTT |

### How It Works
1. `AuthProvider.tsx` loads permissions from DB on login
2. `can(pageKey)` — check page access
3. `canFeature(featureKey)` — check feature access
4. `RequirePage` component wraps each protected page
5. Middleware handles authentication (session check → /login)
6. RequirePage handles authorization (permission check → /unauthorized)

### Pages Registry (pageKeys)
```
printroom, routesheet, cheatsheet, preshift, movement, fleet,
drivers, drivers_live, drivers_semis, chat, admin, profile
```

### Features Registry (featureKeys)
```
printroom_edit, printroom_reset, routesheet_download, cheatsheet_download,
movement_edit, movement_door_edit, movement_tts, printroom_tts,
preshift_edit, fleet_edit, admin_roles, admin_users, admin_reset, ptt
```

---

## KEY SOURCE FILES

### Core
```
src/middleware.ts                    — Auth check (session → /login)
src/components/AuthProvider.tsx      — Auth context, permissions loading
src/components/RequirePage.tsx       — Page-level auth guard (permission → /unauthorized)
src/components/Nav.tsx               — Navigation, role-gated links
src/lib/permissions.ts              — Master pages/features registry + defaults
src/lib/supabase.ts                 — Supabase client
src/lib/types.ts                    — TypeScript types
```

### Pages
```
src/app/page.tsx                     — Home/dashboard
src/app/login/page.tsx               — Login/signup
src/app/unauthorized/page.tsx        — 403 page
src/app/printroom/page.tsx           — Print room management
src/app/routesheet/page.tsx          — Route sheet (2-page PDF, email sync)
src/app/cheatsheet/page.tsx          — Cheat sheet (2-page PDF)
src/app/preshift/page.tsx            — Pre-shift staging
src/app/movement/page.tsx            — Live truck movement (full edit)
src/app/fleet/page.tsx               — Fleet inventory
src/app/drivers/live/page.tsx        — Read-only live movement (drivers)
src/app/drivers/semis/page.tsx       — Semi/trailer list (drivers)
src/app/chat/page.tsx                — Chat rooms
src/app/profile/page.tsx             — User profile + SMS subscriptions
src/app/admin/page.tsx               — Admin panel (users + role manager)
```

### API Routes
```
src/app/api/admin/roles/route.ts     — CRUD for role_permissions table
src/app/api/notify-truck/route.ts    — Send SMS/push notifications
src/app/api/route-email/route.ts     — Email ping/reply for route CSV import
src/app/api/user/route.ts            — User management (admin)
```

### Components
```
src/components/RoleManager.tsx       — Role editor UI (pages + features tabs)
src/components/NotificationBell.tsx  — Bell icon with unread count
src/components/PreShiftTable.tsx     — Preshift staging drag-drop table
src/components/TTSPanel.tsx          — Text-to-speech panel
src/components/Toast.tsx             — Toast notification system
src/components/ThemeProvider.tsx     — Dark theme
src/components/KeepAlive.tsx         — Keeps Supabase realtime alive
```

---

## SECURITY ARCHITECTURE
Two-layer:
1. **Middleware** (`src/middleware.ts`) — checks Supabase session. No session → redirect to `/login`
2. **RequirePage** component — checks `can(pageKey)`. No permission → redirect to `/unauthorized`

API routes use `SUPABASE_SERVICE_ROLE_KEY` + verify admin role from `profiles` table.

---

## SMS NOTIFICATION SYSTEM
- Uses **Gmail SMTP** via Nodemailer (NOT Resend — domain issues with carrier gateways)
- Carrier gateways: vtext.com, txt.att.net, tmomail.net, etc.
- User sets phone + carrier in Profile page, toggles `notify_sms`
- Subscription matching: "223" matches TR223/TR223-1/TR223-2; "223-2" matches only TR223-2
- API: `POST /api/notify-truck` triggers SMS + in-app notification

---

## ROUTE SHEET EMAIL SYSTEM
- Print Room can request route CSV data by email: sends to fdlwhsestatus@badgerliquor.com
- System polls Gmail inbox (via Google OAuth2 API) for reply with CSV attachment
- CSV parsed and merged into route sheet blocks
- State persisted to localStorage (`badger-routesheet-v1`)
- API: `POST /api/route-email` with actions: `send`, `check`, `status`

---

## ANDROID APP
- **Separate project:** `C:\Users\auges\StudioProjects\badger-android\`
- **GitHub:** separate repo
- **Keystore:** generate with `keytool`, base64 encode, add GitHub secrets:
  `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`
- **Features:** PTT (push-to-talk), live truck tracking, fleet management, auto-update from GitHub releases
- **PTT Architecture:** Shared Realtime channel `badger-ptt` in `BadgerRepo.kt`
  - `pttChannel` is lazy-initialized singleton — ensures all screens share same channel instance
  - MovementScreen subscribes to both `movement data channel` (DB changes) and `pttChannel` (PTT)
- **Key file:** `app/src/main/java/com/badger/trucks/`

---

## RECENT GIT HISTORY
```
92b5648  Add page-level authorization guards with RequirePage component  ← LATEST
35fa0ac  Fix role seed: use upsert to update existing roles
10b1c85  Fix build error (unused import in admin page)
8284ff5  Auth/profiles/chat/SMS system (major session)
```

---

## WHAT WAS JUST COMPLETED (latest session)
✅ Dynamic role-based permissions system (DB-driven, fully configurable)
✅ Role Manager UI in Admin panel
✅ Page-level authorization with RequirePage component
✅ /unauthorized page
✅ All 8 protected pages wrapped with RequirePage:
   printroom, routesheet, cheatsheet, movement, preshift, fleet, drivers/live, drivers/semis

---

## POTENTIAL NEXT STEPS (not started)
- Direct message UI (schema exists, UI not built)
- Push notifications (native mobile, beyond SMS)
- Route email reply CSV parsing edge cases
- More granular feature gating inside pages (e.g. hide edit buttons for trainee)
- Any new features Robert wants to add

---

## NOTES FOR CLAUDE
- Project uses PowerShell — use semicolons not && for chaining commands
  e.g.: `cd C:\Users\auges\StudioProjects\badger; git add -A; git commit -m "msg"; git push`
- Desktop Commander has access to the filesystem
- Always check existing file before editing to avoid duplicates
- Vercel auto-deploys — just push to main
- To set first admin: create account on site, then manually set role='admin' in Supabase profiles table
