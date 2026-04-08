import React, { useRef, useState, Suspense, lazy, useEffect } from 'react';
import {
  Download, Crown, HardDrive, LogOut, Upload, Globe, Edit2, Check,
  Cpu, ChevronRight, Flame, Target, MessageSquare, SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../i18n';
import { User, Reminder, Note, PlanTier, Theme } from '../types';
import { getMode, setMode as setDisciplineMode } from '../services/disciplineMode';
import { openTelegram } from '../services/telegramCTA';
import { desktop } from '../services/desktopBridge';

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
  user,
  onLogout,
  setReminders,
  setNotes,
  onUpdateTheme,
  onUpgrade,
  onUpdateUser,
  remindersCount,
  notesCount,
}) => {
  const { language, setLanguage } = useLanguage();
  const isRU = language === 'ru';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPro = user?.plan !== PlanTier.FREE;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [activeSection, setActiveSection] = useState<string | null>('behavior');
  const [desktopVersion, setDesktopVersion] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const isDesktop = desktop.isDesktop;

  useEffect(() => {
    if (!isDesktop) return;

    desktop.getAppInfo().then((info) => {
      setDesktopVersion(info.version);
    }).catch(() => {});

    desktop.getUpdaterState().then((state) => {
      setLatestVersion(state.latestVersion);
    }).catch(() => {});
  }, [isDesktop]);

  let streak = 0;
  try {
    const s = JSON.parse(localStorage.getItem(`eclipse_streak_${user?.id}`) || '{}');
    streak = s.days || 0;
  } catch {}

  const exportData = () => {
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

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const result = await desktop.checkForUpdates();
      setUpdateMessage(result.message);
      if ('version' in result && result.version) {
        setLatestVersion(result.version);
      }
    } catch {
      setUpdateMessage(isRU ? 'Не удалось проверить обновления.' : 'Failed to check for updates.');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A]">
      <div className="mx-auto max-w-4xl px-6 py-6 pb-24">
        <section className="rounded-[28px] border border-white/10 bg-[#121212]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">System control</div>
              <h1 className="mt-2 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">{isRU ? 'Контур управления' : 'Control chamber'}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#B4B0A7]">
                {isRU
                  ? 'Настройки не должны быть скучными. Здесь ты определяешь, как система давит, подсказывает и реагирует.'
                  : 'Settings should not feel generic. This is where you define how the system pressures, guides, and reacts.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <InfoChip label={isRU ? 'Режим' : 'Mode'} value={getMode() === 'hardcore' ? (isRU ? 'Экстремальный' : 'Hardcore') : (isRU ? 'Сбалансированный' : 'Balanced')} accent={getMode() === 'hardcore' ? '#A33036' : '#6C8FB8'} />
              <InfoChip label={isRU ? 'Тариф' : 'Plan'} value={isPro ? (isRU ? 'Про' : 'Pro') : (isRU ? 'Бесплатно' : 'Free')} accent={isPro ? '#B89B5E' : '#7F7A72'} />
              <InfoChip label={isRU ? 'Стрик' : 'Streak'} value={`${streak}d`} accent="#B89B5E" />
            </div>
          </div>
        </section>

        {user && (
          <section className="mt-6 rounded-[24px] border border-white/8 bg-[#121212]/92 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-[#6C8FB826] bg-[#6C8FB810] text-2xl font-extrabold text-[#9AB7D4]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-[12px] border border-white/10 bg-[#0F0F0F] px-3 py-2 text-sm text-[#F2F1EE] outline-none" />
                      <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full rounded-[12px] border border-white/10 bg-[#0F0F0F] px-3 py-2 text-sm text-[#F2F1EE] outline-none" />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            onUpdateUser({ name: editName, email: editEmail });
                            setIsEditing(false);
                          }}
                          className="rounded-[12px] border border-[#B89B5E30] bg-[#B89B5E] px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A]"
                        >
                          <Check className="mr-1 inline h-3.5 w-3.5" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-[#F2F1EE]">{user.name}</h2>
                        <button onClick={() => setIsEditing(true)} className="rounded-full p-2 text-[#7F7A72] hover:text-[#F2F1EE]">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                      {user.email && <div className="mt-1 text-sm text-[#7F7A72]">{user.email}</div>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isPro ? 'border-[#B89B5E30] bg-[#B89B5E10] text-[#D8C18E]' : 'border-white/8 bg-[#171717] text-[#7F7A72]'}`}>
                          {isPro ? 'Pro access' : 'Free access'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#B89B5E28] bg-[#B89B5E10] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#D8C18E]">
                          <Flame className="h-3 w-3" />
                          {streak}d streak
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:min-w-[320px]">
                <MiniStat label={isRU ? 'Квестов' : 'Quests'} value={remindersCount} />
                <MiniStat label={isRU ? 'Уровень' : 'Level'} value={user.level} />
                <MiniStat label="XP" value={user.xp} />
              </div>
            </div>
          </section>
        )}

        {!isPro && (
          <button
            onClick={onUpgrade}
            className="mt-6 w-full rounded-[22px] border border-[#B89B5E30] bg-[#B89B5E10] p-5 text-left transition-all hover:bg-[#B89B5E16]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-[#D8C18E]" />
                <div>
                  <div className="text-sm font-bold text-[#F2F1EE]">{isRU ? 'Перейти на Pro' : 'Upgrade to Pro'}</div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#B89B5E]">{isRU ? 'AI / themes / cloud / unlimited' : 'AI / themes / cloud / unlimited'}</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#D8C18E]" />
            </div>
          </button>
        )}

        <div className="mt-6 space-y-3">
          <SettingsSection
            icon={<Target className="h-4 w-4 text-[#A33036]" />}
            title={isRU ? 'Поведение системы' : 'System behavior'}
            subtitle={isRU ? 'Режим давления и реакция системы' : 'Pressure mode and system response'}
            open={activeSection === 'behavior'}
            onToggle={() => setActiveSection(activeSection === 'behavior' ? null : 'behavior')}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <ModeCard
                title={isRU ? 'Экстремальный' : 'Hardcore'}
                description={isRU ? 'Максимальное давление, жёстче возврат.' : 'Maximum pressure, less softness, harsher return states.'}
                active={getMode() === 'hardcore'}
                accent="#A33036"
                onClick={() => { setDisciplineMode('hardcore'); window.location.reload(); }}
              />
              <ModeCard
                title={isRU ? 'Сбалансированный' : 'Balanced'}
                description={isRU ? 'Система строга, но с пространством для восстановления.' : 'The system stays strict while leaving more room for recovery.'}
                active={getMode() === 'balanced'}
                accent="#6C8FB8"
                onClick={() => { setDisciplineMode('balanced'); window.location.reload(); }}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Cpu className="h-4 w-4 text-[#B89B5E]" />}
            title={isRU ? 'Oracle stack' : 'Oracle stack'}
            subtitle="Gemini / OpenAI / Claude / Custom"
            open={activeSection === 'ai'}
            onToggle={() => setActiveSection(activeSection === 'ai' ? null : 'ai')}
          >
            <Suspense fallback={<div className="py-6 text-center text-sm text-[#7F7A72]">Loading...</div>}>
              <AIProviderSettings />
            </Suspense>
          </SettingsSection>

          <SettingsSection
            icon={<Globe className="h-4 w-4 text-[#6C8FB8]" />}
            title={isRU ? 'Language' : 'Language'}
            subtitle={language === 'ru' ? 'Русский' : 'English'}
            open={activeSection === 'language'}
            onToggle={() => setActiveSection(activeSection === 'language' ? null : 'language')}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <OptionButton label="English" active={language === 'en'} onClick={() => setLanguage('en')} />
              <OptionButton label="Русский" active={language === 'ru'} onClick={() => setLanguage('ru')} />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<HardDrive className="h-4 w-4 text-[#8E9B79]" />}
            title={isRU ? 'Data vault' : 'Data vault'}
            subtitle={isRU ? `${remindersCount} квестов / ${notesCount} заметок` : `${remindersCount} quests / ${notesCount} notes`}
            open={activeSection === 'data'}
            onToggle={() => setActiveSection(activeSection === 'data' ? null : 'data')}
          >
            <div className="space-y-3">
              <ActionRow icon={<Download className="h-4 w-4 text-[#8E9B79]" />} title={isRU ? 'Экспортировать данные' : 'Export data'} subtitle={isRU ? 'Скачать состояние системы в JSON' : 'Download the system state as JSON'} onClick={exportData} />
              <ActionRow icon={<Upload className="h-4 w-4 text-[#B89B5E]" />} title={isRU ? 'Импортировать данные' : 'Import data'} subtitle={isRU ? 'Загрузить резервную копию JSON' : 'Load a JSON backup'} onClick={() => fileInputRef.current?.click()} />
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importData} />
            </div>
          </SettingsSection>

          {isDesktop && (
            <SettingsSection
              icon={<Download className="h-4 w-4 text-[#6C8FB8]" />}
              title={isRU ? 'Desktop updates' : 'Desktop updates'}
              subtitle={desktopVersion ? `${isRU ? 'Текущая версия' : 'Current version'} ${desktopVersion}` : (isRU ? 'Проверка версий приложения' : 'Check for new app versions')}
              open={activeSection === 'updates'}
              onToggle={() => setActiveSection(activeSection === 'updates' ? null : 'updates')}
            >
              <div className="space-y-3">
                <div className="rounded-[18px] border border-white/8 bg-[#0F0F0F] p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#F2F1EE]">
                        {isRU ? 'Проверка новых версий' : 'Check for new versions'}
                      </div>
                      <div className="mt-1 text-xs text-[#7F7A72]">
                        {latestVersion
                          ? (isRU ? `Последняя найденная версия: ${latestVersion}` : `Latest detected version: ${latestVersion}`)
                          : (isRU ? 'Приложение может проверить GitHub Releases на наличие новой версии.' : 'The desktop app can check GitHub Releases for a newer version.')}
                      </div>
                    </div>
                    <button
                      onClick={handleCheckForUpdates}
                      disabled={isCheckingUpdates}
                      className="rounded-[14px] border border-[#6C8FB830] bg-[#6C8FB814] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#BFD4E8] disabled:opacity-50"
                    >
                      {isCheckingUpdates
                        ? (isRU ? 'Проверка...' : 'Checking...')
                        : (isRU ? 'Проверить обновления' : 'Check for updates')}
                    </button>
                  </div>
                  {updateMessage && (
                    <div className="mt-3 text-xs text-[#B4B0A7]">{updateMessage}</div>
                  )}
                </div>
              </div>
            </SettingsSection>
          )}

          <SettingsSection
            icon={<SlidersHorizontal className="h-4 w-4 text-[#6C8FB8]" />}
            title={isRU ? 'System access' : 'System access'}
            subtitle={isRU ? 'Связь и поддержка' : 'Contact and support'}
            open={activeSection === 'contact'}
            onToggle={() => setActiveSection(activeSection === 'contact' ? null : 'contact')}
          >
            <ActionRow icon={<MessageSquare className="h-4 w-4 text-[#6C8FB8]" />} title={isRU ? 'Написать создателю' : 'Message the creator'} subtitle="Telegram @pfrfrpfr" onClick={() => openTelegram('generic', 'settings')} />
          </SettingsSection>
        </div>

        <div className="mt-8 border-t border-white/8 pt-6">
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-[14px] border border-[#7A1F2430] bg-[#7A1F240D] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#C05A60]">
            <LogOut className="h-4 w-4" />
            {isRU ? 'Выйти' : 'Sign out'}
          </button>
          <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-[#5F5A54]">Eclipse Valhalla v2.1.0</div>
        </div>
      </div>
    </div>
  );
};

const SettingsSection = ({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <section className="overflow-hidden rounded-[22px] border border-white/8 bg-[#121212]/92">
    <button onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]">
      {icon}
      <div className="flex-1">
        <div className="text-sm font-bold text-[#F2F1EE]">{title}</div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[#7F7A72]">{subtitle}</div>
      </div>
      <ChevronRight className={`h-4 w-4 text-[#7F7A72] transition-transform ${open ? 'rotate-90' : ''}`} />
    </button>
    {open && <div className="border-t border-white/8 px-5 py-5">{children}</div>}
  </section>
);

const ModeCard = ({
  title,
  description,
  active,
  accent,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  accent: string;
  onClick: () => void;
}) => (
  <button onClick={onClick} className={`rounded-[18px] border p-4 text-left ${active ? '' : 'border-white/8 bg-[#171717]'}`} style={active ? { borderColor: `${accent}40`, backgroundColor: `${accent}12` } : undefined}>
    <div className="text-sm font-bold text-[#F2F1EE]">{title}</div>
    <div className="mt-2 text-sm leading-6 text-[#B4B0A7]">{description}</div>
  </button>
);

const OptionButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`rounded-[16px] border px-4 py-4 text-left text-sm font-bold ${active ? 'border-[#6C8FB833] bg-[#6C8FB812] text-[#F2F1EE]' : 'border-white/8 bg-[#171717] text-[#B4B0A7]'}`}>
    {label}
  </button>
);

const ActionRow = ({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button onClick={onClick} className="flex w-full items-center gap-3 rounded-[16px] border border-white/8 bg-[#171717] px-4 py-4 text-left transition-colors hover:bg-[#1D1D1D]">
    {icon}
    <div className="flex-1">
      <div className="text-sm font-bold text-[#F2F1EE]">{title}</div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#7F7A72]">{subtitle}</div>
    </div>
    <ChevronRight className="h-4 w-4 text-[#7F7A72]" />
  </button>
);

const MiniStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-[16px] border border-white/8 bg-[#171717] p-3 text-center">
    <div className="text-2xl font-extrabold text-[#F2F1EE]">{value}</div>
    <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#7F7A72]">{label}</div>
  </div>
);

const InfoChip = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <div className="rounded-full border px-3 py-1.5" style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10` }}>
    <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>{label}</span>
    <span className="ml-2 text-sm font-extrabold text-[#F2F1EE]">{value}</span>
  </div>
);

export default SettingsView;
