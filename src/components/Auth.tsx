
import React, { useState, useEffect } from 'react';
import { Hammer, ArrowRight, AlertCircle, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../i18n';
import { User, PlanTier } from '../types';
import { generateId } from '../utils';

interface AuthProps {
  onLogin: (user: User) => void;
}

interface StoredUser extends User {
  password?: string;
  createdAt?: number;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingUsers, setExistingUsers] = useState<StoredUser[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const usersDbStr = localStorage.getItem('lumina_users_db');
    if (usersDbStr) {
      setExistingUsers(JSON.parse(usersDbStr));
    }
  }, []);

  useEffect(() => {
    setError(null);
    setFormData({ name: '', email: '', password: '' });
  }, [isRegistering]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const usersDbStr = localStorage.getItem('lumina_users_db');
    const usersDb: StoredUser[] = usersDbStr ? JSON.parse(usersDbStr) : [];

    if (isRegistering) {
      if (usersDb.find(u => u.email === formData.email)) {
        setError('Soul with this contact already exists.');
        return;
      }

      const newUser: StoredUser = {
        id: generateId(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        createdAt: Date.now(),
        plan: PlanTier.FREE,
        xp: 0,
        level: 1,
        theme: 'blue',
        hasSeenOnboarding: false
      };

      usersDb.push(newUser);
      localStorage.setItem('lumina_users_db', JSON.stringify(usersDb));

      const { password, ...safeUser } = newUser;
      setTimeout(() => onLogin(safeUser as User), 500);

    } else {
      const foundUser = usersDb.find(u => u.email === formData.email && u.password === formData.password);

      if (foundUser) {
        const { password, ...safeUser } = foundUser;
        setTimeout(() => onLogin(safeUser as User), 500);
      } else {
        setError('Key is incorrect or Soul not found.');
      }
    }
  };

  const quickLogin = (u: StoredUser) => {
      const { password, ...safeUser } = u;
      onLogin(safeUser as User);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-900 relative overflow-hidden">

      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-slate-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full bg-white dark:bg-slate-950 rounded-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative z-10">

        {/* Header */}
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 z-0"></div>

          <div className="relative z-10">
            <div className="mx-auto w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-slate-700 rotate-45 transform hover:rotate-0 transition-all duration-500">
                <Hammer className="w-8 h-8 text-slate-200 -rotate-45 transform hover:rotate-0 transition-all duration-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-widest font-serif uppercase mb-1">{t('auth.welcome')}</h1>
            <div className="w-12 h-0.5 bg-slate-600 mx-auto mb-3"></div>
            <p className="text-slate-400 text-xs uppercase tracking-widest">{t('auth.subtitle')}</p>
          </div>
        </div>

        {/* Quick Login for Existing Users */}
        {!isRegistering && existingUsers.length > 0 && (
            <div className="px-8 pt-6 pb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Detected Warriors</label>
                <div className="grid grid-cols-2 gap-2">
                    {existingUsers.map(u => (
                        <button
                            key={u.id}
                            type="button"
                            onClick={() => quickLogin(u)}
                            className="flex items-center gap-2 p-3 rounded-sm bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all text-left group"
                        >
                            <div className="w-8 h-8 rounded-sm bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:border-slate-400 shadow-sm">
                                <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate">{u.name}</div>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="relative mt-6 mb-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                    <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-950 px-2 text-xs text-slate-400 font-bold uppercase">or</span></div>
                </div>
            </div>
        )}

        {/* Form */}
        <div className="p-8 pt-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-sm flex items-start gap-2 text-red-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('auth.name')}</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-1 focus:ring-slate-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                  placeholder="Ragnar"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('auth.email')}</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-1 focus:ring-slate-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                placeholder="raven@valhalla.net"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('auth.password')}</label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-1 focus:ring-slate-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-sm shadow-lg transition-all hover:translate-y-[-1px] flex items-center justify-center gap-2 mt-6 tracking-widest uppercase text-xs"
            >
              {isRegistering ? t('auth.submit_register') : t('auth.submit_login')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs font-bold text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors outline-none uppercase tracking-widest"
            >
              {isRegistering ? t('auth.switch_login') : t('auth.switch_register')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
