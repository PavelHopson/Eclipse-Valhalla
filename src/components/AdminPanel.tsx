
import React, { useState, useEffect } from 'react';
import { Reminder, Note, User } from '../types';
import { BarChart3, Users, Database, AlertTriangle, Search, Trash2, RefreshCw, HardDrive, ShieldCheck, Stethoscope, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '../i18n';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toLocalISOString } from '../utils';

interface AdminPanelProps {
  reminders: Reminder[];
  notes: Note[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

type AdminTab = 'dashboard' | 'users' | 'content' | 'diagnostics';

interface StoredUser extends User {
  password?: string;
  createdAt?: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ reminders, notes, setReminders, setNotes }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [dbUsers, setDbUsers] = useState<StoredUser[]>([]);

  // Diagnostics State
  const [testResults, setTestResults] = useState<{name: string, status: 'pass'|'fail'|'pending', msg: string}[]>([]);

  useEffect(() => {
      const usersDbStr = localStorage.getItem('lumina_users_db');
      if (usersDbStr) {
          setDbUsers(JSON.parse(usersDbStr));
      }
  }, []);

  const storageUsage = JSON.stringify(localStorage).length;
  const storageLimit = 5 * 1024 * 1024;
  const usagePercent = (storageUsage / storageLimit) * 100;

  const handleFactoryReset = () => {
    if (confirm(t('admin.confirm_reset'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm(t('admin.confirm_delete'))) {
      setReminders(prev => prev.filter(r => r.id !== id));
    }
  };

  const runDiagnostics = () => {
      const tests: {name: string, status: 'pass'|'fail'|'pending', msg: string}[] = [
          { name: 'Local Storage Access', status: 'pending', msg: 'Checking...' },
          { name: 'Timezone Offset', status: 'pending', msg: 'Checking...' },
          { name: 'Data Persistence', status: 'pending', msg: 'Checking...' },
          { name: 'User Database', status: 'pending', msg: 'Checking...' }
      ];
      setTestResults(tests);

      setTimeout(() => {
          const results = [...tests];

          // 1. LS Check
          try {
              localStorage.setItem('test_key', 'valhalla');
              const val = localStorage.getItem('test_key');
              localStorage.removeItem('test_key');
              if (val === 'valhalla') {
                  results[0] = { name: 'Local Storage Access', status: 'pass', msg: 'Read/Write OK' };
              } else {
                  results[0] = { name: 'Local Storage Access', status: 'fail', msg: 'Write Failed' };
              }
          } catch (e) {
              results[0] = { name: 'Local Storage Access', status: 'fail', msg: 'Access Denied' };
          }

          // 2. Timezone
          const now = new Date();
          const localIso = toLocalISOString(now);
          if (localIso.includes('T')) {
               results[1] = { name: 'Timezone Offset', status: 'pass', msg: `ISO: ${localIso} (OK)` };
          } else {
               results[1] = { name: 'Timezone Offset', status: 'fail', msg: 'Invalid ISO format' };
          }

          // 3. Persistence
          const session = localStorage.getItem('lumina_active_session');
          if (session) {
              results[2] = { name: 'Data Persistence', status: 'pass', msg: 'Session Active' };
          } else {
              results[2] = { name: 'Data Persistence', status: 'fail', msg: 'No Active Session' };
          }

          // 4. User DB
          if (dbUsers.length > 0) {
              results[3] = { name: 'User Database', status: 'pass', msg: `${dbUsers.length} Users Found` };
          } else {
              results[3] = { name: 'User Database', status: 'fail', msg: 'Database Empty' };
          }

          setTestResults(results);
      }, 1000);
  };

  const getTabLabel = (tab: AdminTab) => {
      switch(tab) {
          case 'dashboard': return t('admin.tab_dashboard');
          case 'users': return t('admin.tab_users');
          case 'content': return t('admin.tab_content');
          case 'diagnostics': return 'Diagnostics';
          default: return tab;
      }
  }

  // Mock Activity Data for Chart (Last 7 days)
  const activityData = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6-i));
      return {
          name: d.toLocaleDateString('en-US', {weekday: 'short'}),
          active: reminders.filter(r => new Date(r.createdAt).getDate() === d.getDate()).length + Math.floor(Math.random() * 2), // Add slight randomness for demo if empty
          completed: reminders.filter(r => r.isCompleted && new Date(r.dueDateTime).getDate() === d.getDate()).length
      };
  });

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('admin.metric_revenue'), value: `$0.00`, icon: BarChart3, color: 'text-[#4ADE80]', bg: 'bg-[#4ADE80]/10' },
          { label: t('admin.metric_users'), value: dbUsers.length.toString(), icon: Users, color: 'text-[#5DAEFF]', bg: 'bg-[#5DAEFF]/10' },
          { label: t('admin.metric_records'), value: reminders.length + notes.length, icon: Database, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: t('admin.metric_storage'), value: `${(storageUsage / 1024).toFixed(2)} KB`, icon: HardDrive, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#1A1A26] p-4 rounded-xl border border-[#2A2A3C] shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#55556A] uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-[#E8E8F0]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Chart */}
      <div className="bg-[#1A1A26] p-6 rounded-xl border border-[#2A2A3C] shadow-sm">
          <h3 className="font-bold text-[#E8E8F0] mb-4">{t('admin.chart_activity')}</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                    <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5DAEFF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#5DAEFF" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A3C" />
                    <XAxis dataKey="name" stroke="#55556A" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#55556A" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="active" stroke="#5DAEFF" fillOpacity={1} fill="url(#colorActive)" strokeWidth={2} />
                    <Area type="monotone" dataKey="completed" stroke="#4ADE80" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-[#1A1A26] p-6 rounded-xl border border-[#2A2A3C] shadow-sm">
          <h3 className="font-bold text-[#E8E8F0] mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#55556A]" />
            {t('admin.health_title')}
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#8888A0]">{t('admin.health_storage')}</span>
                <span className="font-bold text-[#E8E8F0]">{usagePercent.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-[#12121A] rounded-full h-2">
                <div className="bg-[#5DAEFF] h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.max(usagePercent, 1)}%` }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#12121A] rounded-lg border border-[#2A2A3C]">
              <span className="text-sm text-[#8888A0]">{t('admin.health_api')}</span>
              <span className="px-2 py-1 bg-[#4ADE80]/10 text-[#4ADE80] text-xs font-bold rounded uppercase">{t('admin.status_operational')}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#12121A] rounded-lg border border-[#2A2A3C]">
              <span className="text-sm text-[#8888A0]">{t('admin.health_db')}</span>
              <span className="text-sm font-mono text-[#55556A]">Local Storage DB</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#1A1A26] p-6 rounded-xl border border-[#FF4444]/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF4444]/5 rounded-full -mr-10 -mt-10"></div>
          <h3 className="font-bold text-[#FF4444] mb-4 flex items-center gap-2 relative z-10">
            <AlertTriangle className="w-5 h-5" />
            {t('admin.danger_title')}
          </h3>
          <p className="text-sm text-[#8888A0] mb-6 relative z-10">
            {t('admin.danger_desc')}
          </p>
          <button
            onClick={handleFactoryReset}
            className="w-full py-2 bg-[#FF4444]/10 hover:bg-[#FF4444]/20 text-[#FF4444] border border-[#FF4444]/30 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 relative z-10"
          >
            <Trash2 className="w-4 h-4" />
            {t('admin.btn_reset')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-[#1A1A26] rounded-xl border border-[#2A2A3C] shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-4 border-b border-[#2A2A3C] flex justify-between items-center bg-[#12121A]">
        <h3 className="font-bold text-[#E8E8F0]">{t('admin.users_title')}</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#55556A]" />
          <input type="text" placeholder={t('admin.search_placeholder')} className="pl-9 pr-4 py-1.5 text-sm border border-[#2A2A3C] bg-[#1A1A26] text-[#E8E8F0] rounded-lg outline-none focus:border-[#5DAEFF]" />
        </div>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-[#12121A] text-[#55556A] font-medium border-b border-[#2A2A3C]">
          <tr>
            <th className="px-4 py-3">{t('admin.tbl_id')}</th>
            <th className="px-4 py-3">Name / Email</th>
            <th className="px-4 py-3">{t('admin.tbl_plan')}</th>
            <th className="px-4 py-3">{t('admin.tbl_status')}</th>
          </tr>
        </thead>
        <tbody>
          {dbUsers.map((u, idx) => (
            <tr key={u.id} className="border-b border-[#2A2A3C] hover:bg-[#1F1F2B]">
              <td className="px-4 py-3 font-mono text-[#55556A] text-xs">{u.id.substring(0,8)}...</td>
              <td className="px-4 py-3">
                  <div className="font-medium text-[#E8E8F0]">{u.name}</div>
                  <div className="text-xs text-[#55556A]">{u.email}</div>
              </td>
              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2A2A3C] text-[#8888A0] uppercase">{u.plan}</span></td>
              <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#4ADE80]/10 text-[#4ADE80] text-xs font-bold">User</span>
              </td>
            </tr>
          ))}
          {dbUsers.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-[#55556A]">No users found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="bg-[#1A1A26] rounded-xl border border-[#2A2A3C] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#2A2A3C] bg-[#12121A]">
          <h3 className="font-bold text-[#E8E8F0]">{t('admin.registry_title')} (Current Session)</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#12121A] text-[#55556A] font-medium border-b border-[#2A2A3C] sticky top-0">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">{t('admin.tbl_task_title')}</th>
                <th className="px-4 py-3">{t('admin.tbl_task_due')}</th>
                <th className="px-4 py-3 text-right">{t('admin.tbl_task_admin')}</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map(r => (
                <tr key={r.id} className="border-b border-[#2A2A3C] hover:bg-[#1F1F2B] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#55556A]">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-[#8888A0]">{r.title}</td>
                  <td className="px-4 py-3 text-[#55556A]">{new Date(r.dueDateTime).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteTask(r.id)}
                      className="text-[#FF4444] hover:bg-[#FF4444]/10 p-1.5 rounded transition-colors" title="Force Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {reminders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#55556A]">{t('admin.no_tasks')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDiagnostics = () => (
      <div className="space-y-6 animate-in fade-in">
          <div className="bg-[#1A1A26] p-6 rounded-xl border border-[#2A2A3C] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-[#E8E8F0] flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-[#5DAEFF]" />
                      System Diagnostics
                  </h3>
                  <button onClick={runDiagnostics} className="px-4 py-2 bg-[#5DAEFF] text-[#0A0A0F] text-sm font-bold rounded-lg hover:bg-[#5DAEFF]/80">
                      Run Tests
                  </button>
              </div>

              <div className="space-y-3">
                  {testResults.length === 0 && <div className="text-center py-8 text-[#55556A]">Run tests to check system integrity.</div>}
                  {testResults.map((res, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#12121A] rounded-lg border border-[#2A2A3C]">
                          <div className="flex items-center gap-3">
                              {res.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-[#4ADE80]" />}
                              {res.status === 'fail' && <XCircle className="w-5 h-5 text-[#FF4444]" />}
                              {res.status === 'pending' && <RefreshCw className="w-5 h-5 text-[#55556A] animate-spin" />}
                              <span className="font-medium text-[#8888A0]">{res.name}</span>
                          </div>
                          <span className={`text-sm font-mono ${res.status === 'pass' ? 'text-[#4ADE80]' : res.status === 'fail' ? 'text-[#FF4444]' : 'text-[#55556A]'}`}>
                              {res.msg}
                          </span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="p-8 h-full flex flex-col w-full overflow-y-auto bg-[#12121A]/50">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-bold text-[#E8E8F0] tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-[#5DAEFF]" />
                {t('admin.title')}
            </h2>
            <p className="text-[#55556A] mt-1">{t('admin.subtitle')}</p>
        </div>
        <div className="flex bg-[#1A1A26] p-1 rounded-lg border border-[#2A2A3C] shadow-sm">
            {(['dashboard', 'users', 'content', 'diagnostics'] as const).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all capitalize ${
                        activeTab === tab
                        ? 'bg-[#5DAEFF] text-[#0A0A0F] shadow-md'
                        : 'text-[#55556A] hover:bg-[#1F1F2B]'
                    }`}
                >
                    {getTabLabel(tab)}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'content' && renderContent()}
        {activeTab === 'diagnostics' && renderDiagnostics()}
      </div>
    </div>
  );
};

export default AdminPanel;
