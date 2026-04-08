
import React, { useState, useEffect } from 'react';
import { Hammer, ArrowRight, AlertCircle, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../i18n';
import { User, PlanTier } from '../types';
import { generateId } from '../utils';
import { hashPassword, verifyPassword } from '../services/cryptoService';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const usersDbStr = localStorage.getItem('lumina_users_db');
    const usersDb: StoredUser[] = usersDbStr ? JSON.parse(usersDbStr) : [];

    if (isRegistering) {
      if (usersDb.find(u => u.email === formData.email)) {
        setError('Soul with this contact already exists.');
        return;
      }

      const { hash, salt } = await hashPassword(formData.password);

      const newUser: any = {
        id: generateId(),
        name: formData.name,
        email: formData.email,
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: Date.now(),
        plan: PlanTier.FREE,
        xp: 0,
        level: 1,
        theme: 'blue',
        hasSeenOnboarding: false
      };

      usersDb.push(newUser);
      localStorage.setItem('lumina_users_db', JSON.stringify(usersDb));

      const { passwordHash, passwordSalt, ...safeUser } = newUser;
      setTimeout(() => onLogin(safeUser as User), 500);

    } else {
      let foundUser: StoredUser | null = null;

      for (const u of usersDb) {
        if (u.email !== formData.email) continue;

        // Hashed password check
        if ((u as any).passwordHash && (u as any).passwordSalt) {
          const valid = await verifyPassword(formData.password, (u as any).passwordHash, (u as any).passwordSalt);
          if (valid) { foundUser = u; break; }
        }
        // Legacy plaintext fallback (auto-migrate on success)
        if (u.password === formData.password) {
          const { hash, salt } = await hashPassword(formData.password);
          (u as any).passwordHash = hash;
          (u as any).passwordSalt = salt;
          delete u.password;
          localStorage.setItem('lumina_users_db', JSON.stringify(usersDb));
          foundUser = u;
          break;
        }
      }

      if (foundUser) {
        const { password, passwordHash, passwordSalt, ...safeUser } = foundUser as any;
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
    <div className="min-h-screen bg-[#1A1A26] flex items-center justify-center p-4 font-sans text-[#E8E8F0] relative overflow-hidden">

      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#55556A]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#5DAEFF]/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full bg-[#0A0A0F] rounded-sm shadow-2xl border border-[#1E1E2E] overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative z-10">

        {/* Header */}
        <div className="bg-[#12121A] p-10 text-center relative overflow-hidden border-b border-[#1E1E2E]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A26] to-[#0A0A0F] z-0"></div>

          <div className="relative z-10">
            <div className="mx-auto w-16 h-16 bg-[#1A1A26] rounded-lg flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(93,174,255,0.1)] border border-[#2A2A3C] rotate-45 transform hover:rotate-0 transition-all duration-500">
                <Hammer className="w-8 h-8 text-[#E8E8F0] -rotate-45 transform hover:rotate-0 transition-all duration-500" />
            </div>
            <h1 className="text-3xl font-bold text-[#E8E8F0] tracking-widest font-serif uppercase mb-1">{t('auth.welcome')}</h1>
            <div className="w-12 h-0.5 bg-[#2A2A3C] mx-auto mb-3"></div>
            <p className="text-[#55556A] text-xs uppercase tracking-widest">{t('auth.subtitle')}</p>
          </div>
        </div>

        {/* Quick Login for Existing Users */}
        {!isRegistering && existingUsers.length > 0 && (
            <div className="px-8 pt-6 pb-2">
                <label className="text-[10px] font-bold text-[#55556A] uppercase tracking-widest block mb-3">Detected Warriors</label>
                <div className="grid grid-cols-2 gap-2">
                    {existingUsers.map(u => (
                        <button
                            key={u.id}
                            type="button"
                            onClick={() => quickLogin(u)}
                            className="flex items-center gap-2 p-3 rounded-sm bg-[#12121A] hover:bg-[#1F1F2B] border border-[#2A2A3C] hover:border-[#55556A] transition-all text-left group"
                        >
                            <div className="w-8 h-8 rounded-sm bg-[#1A1A26] flex items-center justify-center border border-[#2A2A3C] group-hover:border-[#55556A] shadow-sm">
                                <UserIcon className="w-4 h-4 text-[#55556A] group-hover:text-[#E8E8F0]" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-xs text-[#8888A0] truncate">{u.name}</div>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="relative mt-6 mb-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1E1E2E]"></div></div>
                    <div className="relative flex justify-center"><span className="bg-[#0A0A0F] px-2 text-xs text-[#55556A] font-bold uppercase">or</span></div>
                </div>
            </div>
        )}

        {/* Form */}
        <div className="p-8 pt-4">
          {error && (
            <div className="mb-4 p-3 bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-sm flex items-start gap-2 text-[#FF4444] text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-bold text-[#55556A] uppercase tracking-widest">{t('auth.name')}</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#12121A] border border-[#2A2A3C] rounded-sm focus:ring-1 focus:ring-[#5DAEFF] outline-none transition-all text-[#E8E8F0] placeholder:text-[#55556A] font-medium"
                  placeholder="Ragnar"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#55556A] uppercase tracking-widest">{t('auth.email')}</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-[#12121A] border border-[#2A2A3C] rounded-sm focus:ring-1 focus:ring-[#5DAEFF] outline-none transition-all text-[#E8E8F0] placeholder:text-[#55556A] font-medium"
                placeholder="raven@valhalla.net"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#55556A] uppercase tracking-widest">{t('auth.password')}</label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-[#12121A] border border-[#2A2A3C] rounded-sm focus:ring-1 focus:ring-[#5DAEFF] outline-none transition-all text-[#E8E8F0] placeholder:text-[#55556A] font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#5DAEFF] hover:bg-[#5DAEFF]/80 text-[#0A0A0F] font-bold py-4 rounded-sm shadow-lg transition-all hover:translate-y-[-1px] flex items-center justify-center gap-2 mt-6 tracking-widest uppercase text-xs"
            >
              {isRegistering ? t('auth.submit_register') : t('auth.submit_login')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs font-bold text-[#55556A] hover:text-[#E8E8F0] transition-colors outline-none uppercase tracking-widest"
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
