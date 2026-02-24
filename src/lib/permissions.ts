// ============================================================
// PERMISSIONS REGISTRY
// Single source of truth for all pages and features in Badger.
// When you add a new page or feature, add it here — it will
// automatically appear in the Role Manager for all roles.
// ============================================================

export interface PageDef {
  key: string
  label: string
  icon: string
  description: string
  group: string
}

export interface FeatureDef {
  key: string
  label: string
  icon: string
  description: string
  group: string
}

// ALL PAGES in Badger — add new ones here
export const MASTER_PAGES: PageDef[] = [
  // Print Room group
  { key: 'printroom',  label: 'Print Room',    icon: '🖨️', description: 'Manage loading doors and truck entries', group: 'Print Room' },
  { key: 'routesheet', label: 'Route Sheet',   icon: '📄', description: 'View and print route sheets',           group: 'Print Room' },
  { key: 'cheatsheet', label: 'Cheat Sheet',   icon: '📋', description: 'View and print cheat sheets',          group: 'Print Room' },
  // Operations group
  { key: 'preshift',   label: 'PreShift',      icon: '📋', description: 'Stage trucks before shift',            group: 'Operations' },
  { key: 'movement',   label: 'Live Movement', icon: '🚚', description: 'Track live truck movement (full edit)', group: 'Operations' },
  { key: 'fleet',      label: 'Fleet',         icon: '🚛', description: 'View fleet inventory',                 group: 'Operations' },
  // Drivers group
  { key: 'drivers',        label: 'Drivers Hub',        icon: '🚚', description: 'Access the Drivers section',      group: 'Drivers' },
  { key: 'drivers_live',   label: 'Drivers: Live View', icon: '📍', description: 'Read-only live movement board',   group: 'Drivers' },
  { key: 'drivers_semis',  label: 'Drivers: Semi List', icon: '🚛', description: 'Semi / trailer daily list',       group: 'Drivers' },
  // Communication group
  { key: 'chat',       label: 'Chat',          icon: '💬', description: 'Access chat rooms',                    group: 'Communication' },
  // Admin group
  { key: 'admin',      label: 'Admin Panel',   icon: '⚙️', description: 'Full admin settings (admin only)',     group: 'Admin' },
  { key: 'profile',    label: 'My Profile',    icon: '👤', description: 'View and edit own profile',            group: 'Account' },
]

// ALL FEATURES in Badger — granular capability flags
export const MASTER_FEATURES: FeatureDef[] = [
  // Print Room features
  { key: 'printroom_edit',      label: 'Edit Print Room',      icon: '✏️', description: 'Add/edit/delete entries in Print Room',    group: 'Print Room' },
  { key: 'printroom_reset',     label: 'Reset Print Room',     icon: '🗑️', description: 'Reset/clear printroom data',              group: 'Print Room' },
  { key: 'routesheet_download', label: 'Download Route Sheet', icon: '⬇️', description: 'Download PDFs of route sheets',           group: 'Print Room' },
  { key: 'cheatsheet_download', label: 'Download Cheat Sheet', icon: '⬇️', description: 'Download PDFs of cheat sheets',          group: 'Print Room' },
  // Movement features
  { key: 'movement_edit',       label: 'Edit Movement Status', icon: '✏️', description: 'Change truck status in Live Movement',    group: 'Operations' },
  { key: 'movement_door_edit',  label: 'Edit Door Status',     icon: '🚪', description: 'Change door status in Live Movement',    group: 'Operations' },
  { key: 'movement_tts',        label: 'Movement TTS',         icon: '🔊', description: 'Text-to-speech on movement page',        group: 'Operations' },
  { key: 'printroom_tts',       label: 'Print Room TTS',       icon: '🔊', description: 'Text-to-speech on print room page',     group: 'Print Room' },
  // PreShift features
  { key: 'preshift_edit',       label: 'Edit PreShift',        icon: '✏️', description: 'Assign trucks to staging doors',         group: 'Operations' },
  // Fleet features
  { key: 'fleet_edit',          label: 'Edit Fleet',           icon: '✏️', description: 'Add/edit trucks and tractors',           group: 'Operations' },
  // Admin features
  { key: 'admin_roles',         label: 'Manage Roles',         icon: '🛡️', description: 'Create and edit role permissions',       group: 'Admin' },
  { key: 'admin_users',         label: 'Manage Users',         icon: '👥', description: 'View and edit user accounts',            group: 'Admin' },
  { key: 'admin_reset',         label: 'Data Reset',           icon: '⚠️', description: 'Perform data resets',                   group: 'Admin' },
  // PTT
  { key: 'ptt',                 label: 'Push-to-Talk',         icon: '🎙️', description: 'Use push-to-talk voice feature',        group: 'Communication' },
]

// Default permissions per built-in role (used as fallback & for first-time DB seeding)
export const DEFAULT_ROLE_PERMISSIONS: Record<string, { pages: string[]; features: string[] }> = {
  admin: {
    pages: MASTER_PAGES.map(p => p.key),
    features: MASTER_FEATURES.map(f => f.key),
  },
  print_room: {
    pages: ['printroom','routesheet','cheatsheet','preshift','movement','fleet','chat','profile','drivers','drivers_live','drivers_semis'],
    features: ['printroom_edit','printroom_reset','routesheet_download','cheatsheet_download','movement_edit','movement_door_edit','movement_tts','printroom_tts','preshift_edit','fleet_edit','ptt'],
  },
  truck_mover: {
    pages: ['printroom','routesheet','cheatsheet','preshift','movement','fleet','chat','profile','drivers','drivers_live','drivers_semis'],
    features: ['printroom_edit','routesheet_download','cheatsheet_download','movement_edit','movement_door_edit','movement_tts','printroom_tts','preshift_edit','ptt'],
  },
  trainee: {
    pages: ['movement','preshift','chat','profile','drivers','drivers_live'],
    features: ['movement_tts','ptt'],
  },
  driver: {
    pages: ['chat','profile','drivers','drivers_live','drivers_semis'],
    features: ['ptt'],
  },
}
