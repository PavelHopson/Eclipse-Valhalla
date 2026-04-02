
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
        <h2 className="text-3xl font-bold text-[#E8E8F0] tracking-tight font-serif uppercase">{t('settings.title')}</h2>
        <p className="text-[#55556A] text-sm">{t('settings.subtitle')}</p>
      </div>

      {/* User Profile Card */}
      {user && (
        <section className="mb-8 animate-in slide-in-from-bottom-4">
          <div className="bg-[#1A1A26] rounded-2xl border border-[#2A2A3C] overflow-hidden p-6 shadow-lg relative group transition-all">
             <div className="absolute top-0 right-0 p-6 opacity-5 text-[#E8E8F0] rotate-12 group-hover:rotate-0 transition-transform">
                 {user.plan === PlanTier.PRO ? <Crown className="w-32 h-32" /> : <Shield className="w-32 h-32" />}
             </div>

             <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                <div className="flex gap-4 flex-1">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-[#E8E8F0] shadow-xl shrink-0 ${user.plan === PlanTier.PRO ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-[#55556A]'}`}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-3 mb-4 max-w-sm">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-[#55556A] mb-1">Name</label>
                                    <input
                                        className="w-full bg-[#12121A] border border-[#2A2A3C] rounded px-3 py-2 text-sm font-bold text-[#E8E8F0]"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-[#55556A] mb-1">Raven (Email)</label>
                                    <input
                                        className="w-full bg-[#12121A] border border-[#2A2A3C] rounded px-3 py-2 text-sm font-medium text-[#E8E8F0]"
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-[#E8E8F0]">{user.name}</h3>
                                <p className="text-sm text-[#55556A] mb-3 font-mono">{user.email}</p>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${user.plan === PlanTier.PRO ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-[#12121A] text-[#8888A0] border border-[#2A2A3C]'}`}>
                                    {user.plan} Class
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    {isEditing ? (
                        <>
                             <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 text-[#55556A] font-bold text-xs hover:bg-[#1F1F2B] rounded-lg transition-colors">
                                {t('settings.cancel')}
                             </button>
                             <button onClick={handleSaveProfile} className="flex items-center gap-2 px-4 py-2 bg-[#5DAEFF] text-[#E8E8F0] font-bold text-xs rounded-lg shadow-md hover:bg-[#5DAEFF]/80 transition-colors">
                                <Check className="w-4 h-4" /> {t('settings.save')}
                             </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="p-2 text-[#55556A] hover:text-[#5DAEFF] hover:bg-[#1F1F2B] rounded-lg transition-colors" title={t('settings.edit')}>
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={onLogout} className="p-2 text-[#55556A] hover:text-[#FF4444] hover:bg-[#FF4444]/10 rounded-lg transition-colors" title={t('settings.logout')}>
                                <LogOut className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
             </div>

             {/* Stats Mini Grid */}
             {isPro && !isEditing && (
                 <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#2A2A3C]">
                     <div className="flex items-center gap-3">
                         <div className="bg-yellow-100 p-2 rounded-lg text-yellow-700"><Trophy className="w-4 h-4"/></div>
                         <div>
                             <p className="text-[10px] text-[#55556A] uppercase font-bold">{t('game.level')}</p>
                             <p className="font-bold text-[#E8E8F0]">{user.level}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="bg-[#5DAEFF]/20 p-2 rounded-lg text-[#5DAEFF]"><Zap className="w-4 h-4"/></div>
                         <div>
                             <p className="text-[10px] text-[#55556A] uppercase font-bold">{t('game.xp')}</p>
                             <p className="font-bold text-[#E8E8F0]">{user.xp} <span className="text-xs text-[#55556A] font-normal">/ {getNextLevelXp(user.level)}</span></p>
                         </div>
                     </div>
                 </div>
             )}
          </div>
        </section>
      )}

      {/* Upgrade Banner (If Free) */}
      {!isPro && (
        <button onClick={onUpgrade} className="w-full bg-[#12121A] text-[#E8E8F0] p-6 rounded-2xl shadow-xl mb-8 text-left relative overflow-hidden group hover:shadow-2xl transition-all">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <h3 className="text-lg font-bold font-serif uppercase tracking-wider flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-400" />
                        {t('settings.upgrade')}
                    </h3>
                    <p className="text-sm opacity-70 mt-1">Unlock Themes, AI, and Glory.</p>
                </div>
                <div className="w-8 h-8 bg-[#E8E8F0]/20 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 fill-current" />
                </div>
            </div>
        </button>
      )}

      <div className="space-y-8">

        {/* Section: Realm */}
        <section>
            <h4 className="text-xs font-bold text-[#55556A] uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                <Globe className="w-3 h-3" /> {t('settings.language')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setLanguage('en')} className={`p-4 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${language === 'en' ? 'border-[#E8E8F0] bg-[#1A1A26] text-[#E8E8F0]' : 'border-transparent bg-[#1A1A26] text-[#55556A]'}`}>
                   <span className="text-2xl">🇺🇸</span> English
               </button>
               <button onClick={() => setLanguage('ru')} className={`p-4 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${language === 'ru' ? 'border-[#E8E8F0] bg-[#1A1A26] text-[#E8E8F0]' : 'border-transparent bg-[#1A1A26] text-[#55556A]'}`}>
                   <span className="text-2xl">🇷🇺</span> Русский
               </button>
            </div>
        </section>

        {/* Section: Appearance */}
        <section>
            <h4 className="text-xs font-bold text-[#55556A] uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                <Palette className="w-3 h-3" /> {t('settings.appearance')}
            </h4>
            <div className="bg-[#1A1A26] rounded-2xl border border-[#2A2A3C] overflow-hidden divide-y divide-[#2A2A3C]">
                 <div className="p-4 flex items-center justify-between hover:bg-[#1F1F2B] transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#12121A] text-[#8888A0] rounded-lg"><Moon className="w-5 h-5" /></div>
                        <div>
                            <h5 className="font-bold text-[#E8E8F0] text-sm">{t('settings.dark_mode')}</h5>
                        </div>
                    </div>
                    {/* Dark mode toggle is handled by system/html class, this is visual representation since we use auto-detect */}
                    <div className="text-xs text-[#55556A] font-mono">Auto/System</div>
                </div>

                <div className={`p-4 flex items-center justify-between ${!isPro ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-900/30 text-purple-300 rounded-lg"><Palette className="w-5 h-5" /></div>
                        <div>
                            <h5 className="font-bold text-[#E8E8F0] text-sm flex items-center gap-2">
                                {t('settings.theme')}
                                {!isPro && <span className="text-[9px] bg-[#12121A] text-[#8888A0] px-1.5 rounded border border-[#2A2A3C]">LOCKED</span>}
                            </h5>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {(Object.keys(THEME_COLORS) as Theme[]).map(th => (
                            <button
                                key={th}
                                disabled={!isPro}
                                onClick={() => onUpdateTheme(th)}
                                className={`w-8 h-8 rounded-full ${THEME_COLORS[th].primary} ${user?.theme === th ? 'ring-4 ring-[#1E1E2E] scale-110' : ''} shadow-sm border-2 border-[#1A1A26]`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Section: Data */}
        <section>
            <h4 className="text-xs font-bold text-[#55556A] uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                <HardDrive className="w-3 h-3" /> {t('settings.data')}
            </h4>
            <div className="bg-[#1A1A26] rounded-2xl border border-[#2A2A3C] overflow-hidden divide-y divide-[#2A2A3C]">
                <div className="p-4 flex items-center justify-between hover:bg-[#1F1F2B] transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#4ADE80]/20 text-[#4ADE80] rounded-lg"><Download className="w-5 h-5" /></div>
                        <div>
                            <h5 className="font-bold text-[#E8E8F0] text-sm">{t('settings.export')}</h5>
                        </div>
                    </div>
                    <button onClick={handleExport} className="px-4 py-2 text-xs font-bold text-[#8888A0] border border-[#2A2A3C] rounded-lg hover:bg-[#1F1F2B] transition-colors">{t('settings.export_btn')}</button>
                </div>
                <div className="p-4 flex items-center justify-between hover:bg-[#1F1F2B] transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-900/30 text-orange-400 rounded-lg"><Upload className="w-5 h-5" /></div>
                        <div>
                            <h5 className="font-bold text-[#E8E8F0] text-sm">{t('settings.import')}</h5>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                    <button onClick={handleImportClick} className="px-4 py-2 text-xs font-bold text-[#8888A0] border border-[#2A2A3C] rounded-lg hover:bg-[#1F1F2B] transition-colors">{t('settings.import_btn')}</button>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
