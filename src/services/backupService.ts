/**
 * Eclipse Valhalla — Auto-Backup Service
 * Automatically backs up all user data to localStorage daily
 * Can export to file on demand
 */

const BACKUP_KEY = 'eclipse_backup';
const BACKUP_DATE_KEY = 'eclipse_backup_date';

const DATA_KEYS = [
  'lumina_users_db', 'lumina_active_session',
  'eclipse_ai_providers', 'eclipse_ai_usage',
  'eclipse_achievements', 'eclipse_achievement_stats',
  'eclipse_rewards', 'eclipse_active_title',
  'eclipse_training_plans', 'eclipse_video_library',
  'eclipse_habits', 'eclipse_journal',
  'eclipse_weight_log', 'eclipse_measurements', 'eclipse_kbju_profile',
  'eclipse_oracle_history', 'eclipse_image_gallery', 'eclipse_voice_history',
  'eclipse_prs', 'eclipse_quest_templates',
  'eclipse_dismissed_tips', 'eclipse_theme',
  'eclipse_device_key', 'app_language',
];

export function createBackup(): Record<string, any> {
  const backup: Record<string, any> = { _version: '4.1.0', _date: new Date().toISOString() };

  // Collect all eclipse/lumina data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('eclipse_') || key.startsWith('lumina_') || key.startsWith('reminders_') || key.startsWith('notes_') || key.startsWith('routines_') || key.startsWith('workout_logs_'))) {
      try { backup[key] = JSON.parse(localStorage.getItem(key) || 'null'); } catch { backup[key] = localStorage.getItem(key); }
    }
  }
  // Also save app_language
  backup['app_language'] = localStorage.getItem('app_language');

  return backup;
}

export function restoreBackup(backup: Record<string, any>): boolean {
  try {
    for (const [key, value] of Object.entries(backup)) {
      if (key.startsWith('_')) continue;
      if (value === null || value === undefined) continue;
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
    return true;
  } catch {
    return false;
  }
}

export function autoBackup(): void {
  const today = new Date().toISOString().split('T')[0];
  const lastBackup = localStorage.getItem(BACKUP_DATE_KEY);

  if (lastBackup === today) return; // Already backed up today

  const backup = createBackup();
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
  localStorage.setItem(BACKUP_DATE_KEY, today);
}

export function downloadBackup(): void {
  const backup = createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `valhalla-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getLastBackupDate(): string | null {
  return localStorage.getItem(BACKUP_DATE_KEY);
}

// Run auto-backup on import
autoBackup();
