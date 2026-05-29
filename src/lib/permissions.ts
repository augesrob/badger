// ============================================================
// PERMISSIONS REGISTRY
// Single source of truth for all pages and features in Badger.
// When you add a new page or feature, add it here — it will
// automatically appear in the Role Manager for all roles.
// ============================================================

export interface PageDef  { key: string; label: string; icon: string; description: string; group: string }
export interface FeatureDef { key: string; label: string; icon: string; description: string; group: string }

export const MASTER_PAGES: PageDef[] = [
  { key: 'printroom',     label: 'Print Room',         icon: '🖨️', description: 'Manage loading doors and truck entries',   group: 'Print Room' },
  { key: 'routesheet',    label: 'Route Sheet',        icon: '📄', description: 'View and print route sheets',              group: 'Print Room' },
  { key: 'cheatsheet',    label: 'Cheat Sheet',        icon: '📋', description: 'View and print cheat sheets',             group: 'Print Room' },
  { key: 'preshift',      label: 'PreShift',           icon: '📋', description: 'Stage trucks before shift',               group: 'Operations' },
  { key: 'movement',      label: 'Live Movement',      icon: '🚚', description: 'Track live truck movement',               group: 'Operations' },
  { key: 'fleet',         label: 'Fleet',              icon: '🚛', description: 'View fleet inventory',                    group: 'Operations' },
  { key: 'drivers',       label: 'Drivers Hub',        icon: '🚚', description: 'Access the Drivers section',              group: 'Drivers' },
  { key: 'drivers_live',  label: 'Drivers: Live View', icon: '📍', description: 'Read-only live movement board',           group: 'Drivers' },
  { key: 'drivers_semis', label: 'Drivers: Semi List', icon: '🚛', description: 'Semi / trailer daily list',               group: 'Drivers' },
  { key: 'chat',          label: 'Chat',               icon: '💬', description: 'Access chat rooms',                       group: 'Communication' },
  { key: 'admin',         label: 'Admin Panel',        icon: '⚙️', description: 'Full admin settings',                     group: 'Admin' },
  { key: 'statuses',      label: 'Status Values',      icon: '🏷️', description: 'Add/edit truck, door, dock lock statuses',group: 'Admin' },
  { key: 'profile',       label: 'My Profile',         icon: '👤', description: 'View and edit own profile',               group: 'Account' },
]

export const MASTER_FEATURES: FeatureDef[] = [
  { key: 'printroom_edit',      label: 'Edit Print Room',      icon: '✏️', description: 'Add/edit/delete entries in Print Room',     group: 'Print Room' },
  { key: 'printroom_reset',     label: 'Reset Print Room',     icon: '🗑️', description: 'Reset/clear printroom data',               group: 'Print Room' },
  { key: 'routesheet_download', label: 'Download Route Sheet', icon: '⬇️', description: 'Download PDFs of route sheets',            group: 'Print Room' },
  { key: 'cheatsheet_download', label: 'Download Cheat Sheet', icon: '⬇️', description: 'Download PDFs of cheat sheets',           group: 'Print Room' },
  { key: 'movement_edit',       label: 'Edit Movement Status', icon: '✏️', description: 'Change truck status in Live Movement',     group: 'Operations' },
  { key: 'movement_door_edit',  label: 'Edit Door Status',     icon: '🚪', description: 'Change door status in Live Movement',     group: 'Operations' },
  { key: 'movement_tts',        label: 'Movement TTS',         icon: '🔊', description: 'Text-to-speech announcements',             group: 'Operations' },
  { key: 'printroom_tts',       label: 'Print Room TTS',       icon: '🔊', description: 'Text-to-speech on print room page',        group: 'Print Room' },
  { key: 'preshift_edit',       label: 'Edit PreShift',        icon: '✏️', description: 'Assign trucks to staging doors',           group: 'Operations' },
  { key: 'fleet_edit',          label: 'Edit Fleet',           icon: '✏️', description: 'Add/edit trucks and tractors',             group: 'Operations' },
  { key: 'admin_roles',         label: 'Manage Roles',         icon: '🛡️', description: 'Create and edit role permissions',         group: 'Admin' },
  { key: 'admin_users',         label: 'Manage Users',         icon: '👥', description: 'View and edit user accounts',              group: 'Admin' },
  { key: 'admin_reset',         label: 'Data Reset',           icon: '⚠️', description: 'Perform data resets',                     group: 'Admin' },
  { key: 'admin_statuses',      label: 'Manage Status Values', icon: '🏷️', description: 'Add/edit truck, door, dock lock statuses', group: 'Admin' },
  { key: 'ptt',                 label: 'Push-to-Talk',         icon: '🎙️', description: 'Use push-to-talk voice feature',          group: 'Communication' },
  { key: 'chat_read_only',      label: 'Chat Read-Only',       icon: '👁️', description: 'Can read chat messages but not send',     group: 'Communication' },
]

// ── Default permissions per built-in role ─────────────────────────────────────
//   admin       — Full access + full admin settings + full TTS
//   print_room  — Full access, no admin settings + full TTS
//   truck_mover — Full access + full admin settings + full TTS (same as admin)
//   trainee     — R/W Movement, PreShift, PrintRoom, Fleet + TTS + all chat rooms
//   semi_driver — Read-only Movement + Drivers/Global chat only + no TTS
//   driver      — Read-only Movement + Drivers/Global chat only + no TTS
export const DEFAULT_ROLE_PERMISSIONS: Record<string, { pages: string[]; features: string[] }> = {
  admin: {
    pages:    MASTER_PAGES.map(p => p.key),
    features: MASTER_FEATURES.map(f => f.key),
  },
  print_room: {
    pages:    ['printroom','routesheet','cheatsheet','preshift','movement','fleet',
               'drivers','drivers_live','drivers_semis','chat','profile','statuses'],
    features: ['printroom_edit','printroom_reset','routesheet_download','cheatsheet_download',
               'movement_edit','movement_door_edit','movement_tts','printroom_tts',
               'preshift_edit','fleet_edit','ptt'],
  },
  truck_mover: {
    // Full access + full admin settings + full TTS — same as admin
    pages:    MASTER_PAGES.map(p => p.key),
    features: MASTER_FEATURES.map(f => f.key),
  },
  trainee: {
    pages:    ['movement','preshift','printroom','fleet','chat','profile',
               'drivers','drivers_live'],
    features: ['movement_edit','movement_door_edit','movement_tts','printroom_tts',
               'preshift_edit','printroom_edit','fleet_edit','ptt'],
  },
  semi_driver: {
    // Read-only movement, Drivers + Global chat only, no TTS, no PTT, no voice commands
    pages:    ['movement','drivers','drivers_live','drivers_semis','chat','profile'],
    features: [],
  },
  driver: {
    // Same as semi_driver
    pages:    ['movement','drivers','drivers_live','drivers_semis','chat','profile'],
    features: [],
  },
}
