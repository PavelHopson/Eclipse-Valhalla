/**
 * Eclipse Valhalla — Settings (Redesigned)
 *
 * Clean, professional, premium dark settings panel.
 * Sections: Profile, AI, Language, Appearance, Data, Account.
 */

import React, { useRef, useState, Suspense, lazy } from 'react';
import {
  Download, Moon, Crown, Palette, HardDrive, LogOut, Upload,
  Zap, Shield, Globe, Edit2, Check, X, Cpu, User as UserIcon,
  ChevronRight, Flame, Target, MessageSquare,
} from 'lucide-react';
import { useLanguage } from '../i18n';
import { User, Reminder, Note, PlanTier, Theme } from '../types';
import { THEME_COLORS, getNextLevelXp } from '../utils';
import { getMode, setMode as setDisciplineMode } from '../services/disciplineMode';
import { openTelegram } from '../services/telegramCTA';

const AIProviderSettings = lazy(() => import('./AIProviderSettings'));

interface SettingsViewProps {
  remindersCount: number;
  notesCount: number;
  user?: User | null;
  onLogout?: () => void;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  onUpdateTheme: (theme: Theme) => void;
  onUpgrade: () => void;
  onUpdateUser: (updates: Partial<User>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  user, onLogout, setReminders, setNotes, onUpdateTheme, onUpgrade, onUpdateUser, remindersCount, notesCount,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const isRU = language === 'ru';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPro = user?.plan !== PlanTier.FREE;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Streak
  let streak = 0;
  try { const s = JSON.parse(localStorage.getItem(`eclipse_streak_${user?.id}`) || '{}'); streak = s.days || 0; } catch {}

  const handleExport = () => {
    const data = {
      reminders: JSON.parse(localStorage.getItem(`reminders_${user?.id}`) || '[]'),
      notes: JSON.parse(localStorage.getItem(`notes_${user?.id}`) || '[]'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eclipse-valhalla-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.reminders) setReminders(json.reminders);
        if (json.notes) setNotes(json.notes);
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveProfile = () => {
    if (user) { onUpdateUser({ name: editName, email: editEmail }); setIsEditing(false); }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-6 pb-24">

        {/* ═══ HEADER ═══ */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#E8E8F0]">{isRU ? 'Настройки' : 'Settings'}</h1>
          <p className="text-xs text-[#3A3A4A] mt-0.5">{isRU ? 'Настрой систему под себя' : 'Configure your system'}</p>
        </div>

        {/* ═══ PROFILE CARD ═══ */}
        {user && (
          <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-xl bg-[#5DAEFF10] border border-[#5DAEFF20] flex items-center justify-center text-xl font-bold text-[#5DAEFF] shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder={isRU ? 'Имя' : 'Name'}
                      className="w-full px-3 py-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg text-sm text-[#E8E8F0] outline-none focus:border-[#5DAEFF40]" />
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email"
                      className="w-full px-3 py-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg text-sm text-[#E8E8F0] outline-none focus:border-[#5DAEFF40]" />
                    <div className="flex gap-2">
                      <button onClick={handleSaveProfile} className="px-3 py-1.5 bg-[#5DAEFF] text-[#0A0A0F] rounded-lg text-xs font-bold"><Check className="w-3 h-3 inline mr-1" />{isRU ? 'Сохранить' : 'Save'}</button>
                      <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-[#55556A]">{isRU ? 'Отмена' : 'Cancel'}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#E8E8F0]">{user.name}</h2>
                      <button onClick={() => setIsEditing(true)} className="p-1 text-[#3A3A4A] hover:text-[#55556A]"><Edit2 className="w-3 h-3" /></button>
                    </div>
                    {user.email && <p className="text-xs text-[#3A3A4A] font-mono">{user.email}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isPro ? 'bg-[#FFD70010] text-[#FFD700] border border-[#FFD70025]' : 'bg-[#12121A] text-[#55556A] border border-[#1E1E2E]'}`}>
                        {isPro ? 'Pro' : 'Free'}
                      </span>
                      {streak > 0 && (
                        <span className="text-[9px] text-[#FF6B35] flex items-center gap-1"><Flame className="w-3 h-3" />{streak}d streak</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stats row */}
            {!isEditing && (
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1A1A2E]">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#E8E8F0]">{remindersCount}</div>
                  <div className="text-[9px] text-[#3A3A4A] uppercase">{isRU ? 'Квесты' : 'Quests'}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#E8E8F0]">{user.level}</div>
                  <div className="text-[9px] text-[#3A3A4A] uppercase">{isRU ? 'Уровень' : 'Level'}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#E8E8F0]">{user.xp}</div>
                  <div className="text-[9px] text-[#3A3A4A] uppercase">XP</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ UPGRADE BANNER ═══ */}
        {!isPro && (
          <button onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-[#5DAEFF08] to-[#7A5CFF08] border border-[#5DAEFF15] rounded-xl p-4 mb-6 text-left hover:border-[#5DAEFF30] transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-[#FFD700]" />
                <div>
                  <span className="text-sm font-bold text-[#E8E8F0]">{isRU ? 'Перейти на Pro' : 'Upgrade to Pro'}</span>
                  <p className="text-[10px] text-[#55556A]">{isRU ? 'AI, темы, облако, без ограничений' : 'AI, themes, cloud, unlimited'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#3A3A4A] group-hover:text-[#55556A]" />
            </div>
          </button>
        )}

        {/* ═══ SETTINGS SECTIONS ═══ */}
        <div className="space-y-2">

          {/* AI PROVIDERS */}
          <SettingsSection
            icon={<Cpu className="w-4 h-4 text-[#7A5CFF]" />}
            title={isRU ? 'AI Провайдеры' : 'AI Providers'}
            subtitle={isRU ? 'Gemini, OpenAI, Claude, Custom' : 'Gemini, OpenAI, Claude, Custom'}
            open={activeSection === 'ai'}
            onToggle={() => setActiveSection(activeSection === 'ai' ? null : 'ai')}
          >
            <Suspense fallback={<div className="text-xs text-[#3A3A4A] py-4 text-center">{isRU ? 'Загрузка...' : 'Loading...'}</div>}>
              <AIProviderSettings />
            </Suspense>
          </SettingsSection>

          {/* LANGUAGE */}
          <SettingsSection
            icon={<Globe className="w-4 h-4 text-[#5DAEFF]" />}
            title={isRU ? 'Язык' : 'Language'}
            subtitle={language === 'ru' ? 'Русский' : 'English'}
            open={activeSection === 'lang'}
            onToggle={() => setActiveSection(activeSection === 'lang' ? null : 'lang')}
          >
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setLanguage('en')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${language === 'en' ? 'border-[#5DAEFF30] bg-[#5DAEFF08] text-[#E8E8F0]' : 'border-[#1A1A2E] text-[#55556A]'}`}>
                🇺🇸 English
              </button>
              <button onClick={() => setLanguage('ru')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${language === 'ru' ? 'border-[#5DAEFF30] bg-[#5DAEFF08] text-[#E8E8F0]' : 'border-[#1A1A2E] text-[#55556A]'}`}>
                🇷🇺 Русский
              </button>
            </div>
          </SettingsSection>

          {/* DISCIPLINE MODE */}
          <SettingsSection
            icon={<Target className="w-4 h-4 text-[#FF6B35]" />}
            title={isRU ? 'Режим дисциплины' : 'Discipline Mode'}
            subtitle={getMode() === 'hardcore' ? (isRU ? 'Жёсткий' : 'Hardcore') : (isRU ? 'Сбалансированный' : 'Balanced')}
            open={activeSection === 'mode'}
            onToggle={() => setActiveSection(activeSection === 'mode' ? null : 'mode')}
          >
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setDisciplineMode('hardcore'); window.location.reload(); }}
                className={`p-3 rounded-xl border text-left transition-all ${getMode() === 'hardcore' ? 'border-[#FF6B3530] bg-[#FF6B3508]' : 'border-[#1A1A2E]'}`}>
                <div className="text-sm font-bold text-[#E8E8F0]">{isRU ? 'Жёсткий' : 'Hardcore'}</div>
                <div className="text-[10px] text-[#3A3A4A]">{isRU ? 'Без компромиссов' : 'No mercy'}</div>
              </button>
              <button onClick={() => { setDisciplineMode('balanced'); window.location.reload(); }}
                className={`p-3 rounded-xl border text-left transition-all ${getMode() === 'balanced' ? 'border-[#5DAEFF30] bg-[#5DAEFF08]' : 'border-[#1A1A2E]'}`}>
                <div className="text-sm font-bold text-[#E8E8F0]">{isRU ? 'Сбалансированный' : 'Balanced'}</div>
                <div className="text-[10px] text-[#3A3A4A]">{isRU ? 'Твёрдо, но спокойно' : 'Firm but calm'}</div>
              </button>
            </div>
          </SettingsSection>

          {/* DATA */}
          <SettingsSection
            icon={<HardDrive className="w-4 h-4 text-[#4ADE80]" />}
            title={isRU ? 'Данные' : 'Data'}
            subtitle={`${remindersCount} ${isRU ? 'квестов' : 'quests'}, ${notesCount} ${isRU ? 'заметок' : 'notes'}`}
            open={activeSection === 'data'}
            onToggle={() => setActiveSection(activeSection === 'data' ? null : 'data')}
          >
            <div className="space-y-2">
              <button onClick={handleExport}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#0A0A0F] border border-[#1A1A2E] rounded-xl hover:border-[#2A2A3C] transition-all text-left">
                <Download className="w-4 h-4 text-[#4ADE80]" />
                <div>
                  <div className="text-sm text-[#E8E8F0]">{isRU ? 'Экспорт данных' : 'Export Data'}</div>
                  <div className="text-[10px] text-[#3A3A4A]">{isRU ? 'Скачать JSON файл' : 'Download JSON file'}</div>
                </div>
              </button>
              <button onClick={handleImportClick}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#0A0A0F] border border-[#1A1A2E] rounded-xl hover:border-[#2A2A3C] transition-all text-left">
                <Upload className="w-4 h-4 text-[#FF6B35]" />
                <div>
                  <div className="text-sm text-[#E8E8F0]">{isRU ? 'Импорт данных' : 'Import Data'}</div>
                  <div className="text-[10px] text-[#3A3A4A]">{isRU ? 'Загрузить JSON файл' : 'Upload JSON file'}</div>
                </div>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            </div>
          </SettingsSection>

          {/* CONTACT */}
          <SettingsSection
            icon={<MessageSquare className="w-4 h-4 text-[#5DAEFF]" />}
            title={isRU ? 'Связь' : 'Contact'}
            subtitle="Telegram"
            open={activeSection === 'contact'}
            onToggle={() => setActiveSection(activeSection === 'contact' ? null : 'contact')}
          >
            <button onClick={() => openTelegram('generic', 'settings')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#0A0A0F] border border-[#1A1A2E] rounded-xl hover:border-[#5DAEFF20] transition-all text-left">
              <MessageSquare className="w-4 h-4 text-[#5DAEFF]" />
              <div>
                <div className="text-sm text-[#E8E8F0]">{isRU ? 'Написать разработчику' : 'Message the creator'}</div>
                <div className="text-[10px] text-[#3A3A4A]">Telegram @pfrfrpfr</div>
              </div>
            </button>
          </SettingsSection>

        </div>

        {/* ═══ LOGOUT ═══ */}
        <div className="mt-8 pt-6 border-t border-[#1A1A2E]">
          <button onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#FF4444] hover:bg-[#FF444408] rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            {isRU ? 'Выйти' : 'Sign Out'}
          </button>
          <p className="text-[9px] text-[#2A2A3C] mt-2 px-1">Eclipse Valhalla v2.1.0</p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// COLLAPSIBLE SECTION
// ═══════════════════════════════════════════

const SettingsSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, open, onToggle, children }) => (
  <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-xl overflow-hidden">
    <button onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#12121A] transition-colors text-left">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#E8E8F0]">{title}</div>
        <div className="text-[10px] text-[#3A3A4A]">{subtitle}</div>
      </div>
      <ChevronRight className={`w-4 h-4 text-[#3A3A4A] transition-transform ${open ? 'rotate-90' : ''}`} />
    </button>
    {open && (
      <div className="px-4 pb-4 pt-1 border-t border-[#1A1A2E]">
        {children}
      </div>
    )}
  </div>
);

export default SettingsView;
