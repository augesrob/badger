SESSION: 2026-02-21 Auth/Profiles/Chat/SMS
Transcript: /mnt/transcripts/2026-02-21-21-56-38-auth-profiles-chat-sms-system.txt

COMPLETED THIS SESSION:
- Full auth system: login/signup, AuthProvider context, role-based access
- Profile page: display name, avatar color, phone/carrier, SMS toggle, truck subscriptions
- Admin users page: role management, delete users
- Chat page: realtime global/role rooms via Supabase
- supabase-schema.sql: profiles, truck_subscriptions, notifications, chat tables
- Nav updated with profile avatar, notification bell, role-gated links
- NotificationBell component
- notify-truck API route

SMS NOTIFICATION SYSTEM (final working state):
- Uses Gmail SMTP via nodemailer (BADGER_EMAIL_USER / BADGER_EMAIL_PASS in Vercel)
- Switched FROM Resend (domain reputation issues, 3000/month limit)
- Gmail unlimited, better carrier delivery, already set up
- Carrier gateways: vtext.com, txt.att.net, tmomail.net, etc.
- Subscription matching: "223" matches TR223/TR223-1/TR223-2; "223-2" matches only TR223-2
- notify_sms flag auto-synced across all subs when saving profile
- Phone input strips +1 country code automatically

SUPABASE URL CONFIGURATION:
- Site URL: https://badger.augesrob.net
- Redirect URLs: https://badger.augesrob.net/**, http://localhost:3000/**

VERCEL ENV VARS REQUIRED:
- NEXT_PUBLIC_SUPABASE_URL (already set)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (already set)
- SUPABASE_SERVICE_ROLE_KEY (added this session)
- RESEND_API_KEY (added this session - no longer used for SMS but kept)
- BADGER_EMAIL_USER (pre-existing Gmail)
- BADGER_EMAIL_PASS (pre-existing Gmail app password)
- BADGER_SMTP_HOST (pre-existing, smtp.gmail.com)

PENDING:
- Run supabase-schema.sql in Supabase SQL Editor (if not done)
- Set first admin: create account on site, then set role='admin' in Supabase profiles table
- Direct message UI not yet built (schema supports it)

FINAL COMMIT: 8284ff5
