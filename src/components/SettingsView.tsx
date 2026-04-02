
import React, { useRef, useState } from 'react';
import { Download, Moon, Crown, Palette, HardDrive, User as UserIcon, LogOut, Upload, Zap, Trophy, Shield, Star, Globe, Edit2, Check, X } from 'lucide-react';
import { useLanguage } from '../i18n';
import { User, Reminder, Note, PlanTier, Theme } from '../types';
import { THEME_COLORS, getNextLevelXp } from '../utils';

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
    user, onLogout, setReminders, setNotes, onUpdateTheme, onUpgrade, onUpdateUser
}) => {
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  const handleExport = () => {
    const data = {
      reminders: JSON.parse(localStorage.getItem(`reminders_${user?.id}`) || '[]'),
      notes: JSON.parse(localStorage.getItem(`notes_${user?.id}`) || '[]'),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valhalla-saga-${new Date().toISOString().slice(0,10)}.json`;
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
        if (json.reminders && Array.isArray(json.reminders)) setReminders(json.reminders);
        if (json.notes && Array.isArray(json.notes)) setNotes(json.notes);
        alert('Saga restored successfully!');
      } catch (err) {
        alert('Failed to read the scroll.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveProfile = () => {
    if (user) {
        onUpdateUser({ name: editName, email: editEmail });
        setIsEditing(false);
    }
  };

  const isPro = user?.plan !== PlanTier.FREE;

  return (
    <div className="p-4 md:p-8 h-full flex flex-col max-w-3xl mx-auto w-full overflow-y-auto pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-serif uppercase">{t('settings.title')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.subtitle')}</p>
      </div>

      {/* User Profile Card */}
      {user && (
        <section className="mb-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-6 shadow-lg relative group transition-all">
             <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900 dark:text-white rotate-12 group-hover:rotate-0 transition-transform">
                 {user.plan === PlanTier.PRO ? <Crown className="w-32 h-32" /> : <Shield className="w-32 h-32" />}
             </div>

             <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                <div className="flex gap-4 flex-1">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shrink-0 ${user.plan === PlanTier.PRO ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-slate-600'}`}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-3 mb-4 max-w-sm">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Name</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-sm font-bold dark:text-white"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Raven (Email)</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-sm font-medium dark:text-white"
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
                                <p className="text-sm text-slate-500 mb-3 font-mono">{user.email}</p>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${user.plan === PlanTier.PRO ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                    {user.plan} Class
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    {isEditing ? (
                        <>
                             <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 text-slate-500 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                {t('settings.cancel')}
                             </button>
                             <button onClick={handleSaveProfile} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                <Check className="w-4 h-4" /> {t('settings.save')}
                             </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title={t('settings.edit')}>
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title={t('settings.logout')}>
                                <LogOut className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
             </div>

             {/* Stats Mini Grid */}
             {isPro && !isEditing && (
                 <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                     <div className="flex items-center gap-3">
                         <div className="bg-yellow-100 p-2 rounded-lg text-yellow-700"><Trophy className="w-4 h-4"/></div>
                         <div>
                             <p className="text-[10px] text-slate-400 uppercase font-bold">{t('game.level')}</p>
                             <p className="font-bold text-slate-900 dark:text-white">{user.level}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="bg-blue-100 p-2 rounded-lg text-blue-700"><Zap className="w-4 h-4"/></div>
                         <div>
                             <p className="text-[10px] text-slate-400 uppercase font-bold">{t('game.xp')}</p>
                             <p className="font-bold text-slate-900 dark:text-white">{user.xp} <span className="text-xs text-slate-400 font-normal">/ {getNextLevelXp(user.level)}</span></p>
                         </div>
                     </div>
                 </div>
             )}
          </div>
        </section>
      )}

      {/* Upgrade Banner (If Free) */}
      {!isPro && (
        <button onClick={onUpgrade} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-6 rounded-2xl shadow-xl mb-8 text-left relative overflow-hidden group hover:shadow-2xl transition-all">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <h3 className="text-lg font-bold font-serif uppercase tracking-wider flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-400" />
                        {t('settings.upgrade')}
                    </h3>
                    <p className="text-sm opacity-70 mt-1">Unlock Themes, AI, and Glory.</p>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 fill-current" />
                </div>
            </div>
        </button>
      )}

      <div className="space-y-8">

        {/* Section: Realm */}
        <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                <Globe className="w-3 h-3" /> {t('settings.language')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setLanguage('en')} className={`p-4 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${language === 'en' ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-transparent bg-white dark:bg-slate-800 text-slate-400'}`}>
                   <span className="text-2xl">🇺🇸</span> English
               </button>
               <button onClick={() => setLanguage('ru')} className={`p-4 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${language === 'ru' ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-transparent bg-white dark:bg-slate-800 text-slate-400'}`}>
                   <span className="text-2xl">🇷🇺</span> Русский
               </button>
            </div>
        </section>

        {/* Section: Appearance */}
        <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                <Palette className="w-3 h-3" /> {t('settings.appearance')}
            </h4>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                 <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg"><Moon className="w-5 h-5" /></div>
                        <div>
                            <h5 className="font-bold text-slate-800 dark:text-white text-sm">{t('settings.dark_mode')}</h5>
                        </div>
                    </div>
                    {/* Dark mode toggle is handled by system/html class, this is visual representation since we use auto-detect */}
                    <div className="text-xs text-slate-400 font-mono">Auto/System</div>
                </div>

                <div className={`p-4 flex items-center justify-between ${!isPro ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-lg"><Palette className="w-5 h-5" /></div>
                        <div>
                            <h5 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                {t('settings.theme')}
                                {!isPro && <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 rounded border border-slate-300">LOCKED</span>}
                            </h5>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {(Object.keys(THEME_COLORS) as Theme[]).map(th => (
                            <button
                                key={th}
                                disabled={!isPro}
                                onClick={() => onUpdateTheme(th)}
                                className={`w-8 h-8 rounded-full ${THEME_COLORS[th].primary} ${user?.theme === th ? 'ring-4 ring-slate-100 dark:ring-slate-700 scale-110' : ''} shadow-sm border-2 border-white dark:border-slate-800`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Section: Data */}
        <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                <HardDrive className="w-3 h-3" /> {t('settings.data')}
            </h4>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"><Download className="w-5 h-5" /></div>
                        <div>
                            <h5 className="font-bold text-slate-800 dark:text-white text-sm">{t('settings.export')}</h5>
                        </div>
                    </div>
                    <button onClick={handleExport} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-600 transition-colors">{t('settings.export_btn')}</button>
                </div>
                <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><Upload className="w-5 h-5" /></div>
                        <div>
                            <h5 className="font-bold text-slate-800 dark:text-white text-sm">{t('settings.import')}</h5>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                    <button onClick={handleImportClick} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-600 transition-colors">{t('settings.import_btn')}</button>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
