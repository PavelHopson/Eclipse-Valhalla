/**
 * Eclipse Valhalla — Admin Dashboard
 *
 * Professional analytics: overview, AI usage, system health, event feed.
 * Access: admin roles only.
 */

import React, { useState, useEffect } from 'react';
import {
  getOverviewMetrics, getAIUsageMetrics, getSystemHealth, getEventFeed,
} from './adminService';
import type { OverviewMetrics, AIUsageMetrics, SystemHealth, TelemetryEvent } from './types';
import {
  Users, Swords, Trophy, Shield, Zap, Activity, Database,
  AlertTriangle, CheckCircle, Clock, BarChart3, Cpu, Rss, DollarSign,
} from 'lucide-react';

type AdminTab = 'overview' | 'ai' | 'health' | 'events';

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AIUsageMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);

  useEffect(() => {
    setOverview(getOverviewMetrics());
    setAiMetrics(getAIUsageMetrics());
    setHealth(getSystemHealth());
    setEvents(getEventFeed(50));
  }, [tab]);

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'ai', label: 'AI Usage', icon: Cpu },
    { id: 'health', label: 'Health', icon: Activity },
    { id: 'events', label: 'Events', icon: Clock },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#E8E8F0]">Admin Console</h1>
            <p className="text-[10px] text-[#3A3A4A] uppercase tracking-widest">Eclipse Valhalla · Diagnostic Panel</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF444408] border border-[#FF444415]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF4444] animate-pulse" />
            <span className="text-[9px] font-bold text-[#FF4444] uppercase tracking-wider">Super Admin</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#0C0C14] border border-[#1A1A2E] rounded-xl p-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                  tab === t.id ? 'bg-[#12121A] text-[#E8E8F0] shadow-sm' : 'text-[#55556A] hover:text-[#8888A0]'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && overview && (
          <div className="space-y-5">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard icon={Users} label="Total Users" value={overview.totalUsers} color="#5DAEFF" />
              <KPICard icon={Swords} label="Quests Created" value={overview.totalQuests} color="#5DAEFF" />
              <KPICard icon={Trophy} label="Completion Rate" value={`${overview.completionRate}%`} color="#4ADE80" />
              <KPICard icon={Shield} label="Avg Discipline" value={overview.avgDisciplineScore} color={overview.avgDisciplineScore >= 60 ? '#4ADE80' : '#FBBF24'} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard icon={Activity} label="Active Today" value={overview.activeToday} color="#7A5CFF" />
              <KPICard icon={CheckCircle} label="Completed Today" value={overview.questsCompletedToday} color="#4ADE80" />
              <KPICard icon={Zap} label="Pro Users" value={overview.proUsers} color="#FFD700" />
              <KPICard icon={DollarSign} label="MRR" value={`$${overview.revenue}`} color="#4ADE80" />
            </div>
          </div>
        )}

        {/* ══ AI USAGE ══ */}
        {tab === 'ai' && aiMetrics && (
          <div className="space-y-5">
            {/* AI KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard icon={Cpu} label="Total Requests" value={aiMetrics.totalRequests} color="#5DAEFF" />
              <KPICard icon={CheckCircle} label="Success Rate" value={`${aiMetrics.successRate}%`} color={aiMetrics.successRate >= 90 ? '#4ADE80' : '#FF4444'} />
              <KPICard icon={Clock} label="Avg Duration" value={`${aiMetrics.avgDurationMs}ms`} color="#7A5CFF" />
              <KPICard icon={AlertTriangle} label="Errors" value={aiMetrics.topErrors.length} color={aiMetrics.topErrors.length > 0 ? '#FF4444' : '#4ADE80'} />
            </div>

            {/* By Provider */}
            <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A1A2E]">
                <span className="text-[10px] font-bold text-[#55556A] uppercase tracking-[0.15em]">Usage by Provider</span>
              </div>
              <div className="divide-y divide-[#1A1A2E]">
                {Object.entries(aiMetrics.byProvider).map(([name, data]) => (
                  <div key={name} className="px-4 py-3 flex items-center gap-4">
                    <span className="text-sm font-medium text-[#E8E8F0] w-24 capitalize">{name}</span>
                    <div className="flex-1 h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
                      <div className="h-full bg-[#5DAEFF] rounded-full" style={{ width: `${Math.min(100, (data.requests / Math.max(aiMetrics.totalRequests, 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-[#8888A0] w-20 text-right">{data.requests} req</span>
                    <span className="text-xs text-[#55556A] w-24 text-right">{data.tokens.toLocaleString()} tok</span>
                    {data.errors > 0 && <span className="text-[10px] text-[#FF4444] font-bold">{data.errors} err</span>}
                  </div>
                ))}
                {Object.keys(aiMetrics.byProvider).length === 0 && (
                  <div className="px-4 py-6 text-center text-[#3A3A4A] text-xs">No AI usage recorded yet.</div>
                )}
              </div>
            </div>

            {/* By Capability */}
            <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A1A2E]">
                <span className="text-[10px] font-bold text-[#55556A] uppercase tracking-[0.15em]">Usage by Capability</span>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(aiMetrics.byCapability).map(([cap, count]) => (
                  <div key={cap} className="bg-[#12121A] border border-[#1E1E2E] rounded-lg px-3 py-2">
                    <div className="text-xs text-[#8888A0] capitalize">{cap}</div>
                    <div className="text-lg font-bold text-[#E8E8F0]">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Errors */}
            {aiMetrics.topErrors.length > 0 && (
              <div className="bg-[#0C0C14] border border-[#FF444415] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1A1A2E]">
                  <span className="text-[10px] font-bold text-[#FF4444] uppercase tracking-[0.15em]">Top Errors</span>
                </div>
                <div className="divide-y divide-[#1A1A2E]">
                  {aiMetrics.topErrors.map((e, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="text-xs text-[#FF4444] font-bold w-8">{e.count}×</span>
                      <span className="text-xs text-[#8888A0] truncate">{e.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ SYSTEM HEALTH ══ */}
        {tab === 'health' && health && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard icon={Rss} label="Nexus Sources" value={health.ingestionSources} color="#7A5CFF" />
              <KPICard icon={CheckCircle} label="Healthy" value={health.ingestionHealthy} color="#4ADE80" />
              <KPICard icon={AlertTriangle} label="Errors" value={health.ingestionErrors} color={health.ingestionErrors > 0 ? '#FF4444' : '#4ADE80'} />
              <KPICard icon={Cpu} label="AI Providers" value={health.activeProviders} color="#5DAEFF" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Storage */}
              <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-[#55556A]" />
                  <span className="text-[10px] font-bold text-[#55556A] uppercase tracking-wider">Local Storage</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-[#E8E8F0]">{health.storageUsedKB}</span>
                  <span className="text-xs text-[#55556A]">/ {health.storageMaxKB} KB</span>
                </div>
                <div className="h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${(health.storageUsedKB / health.storageMaxKB) * 100}%`,
                    backgroundColor: health.storageUsedKB / health.storageMaxKB > 0.8 ? '#FF4444' : '#5DAEFF',
                  }} />
                </div>
              </div>

              {/* Last ingestion */}
              <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[#55556A]" />
                  <span className="text-[10px] font-bold text-[#55556A] uppercase tracking-wider">Last Ingestion</span>
                </div>
                <div className="text-sm text-[#E8E8F0]">
                  {health.lastIngestionAt ? new Date(health.lastIngestionAt).toLocaleString() : 'Never'}
                </div>
                <div className="text-xs text-[#3A3A4A] mt-1">
                  Errors (24h): {health.errors24h}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ EVENT FEED ══ */}
        {tab === 'events' && (
          <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A2E] flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#55556A] uppercase tracking-[0.15em]">Event Stream</span>
              <span className="text-[10px] text-[#3A3A4A]">{events.length} events</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-[#0A0A0F]">
              {events.map((e, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#12121A] transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5DAEFF] shrink-0" />
                  <span className="text-xs font-mono text-[#8888A0] w-40 truncate">{e.event}</span>
                  <span className="text-[10px] text-[#3A3A4A] flex-1 truncate">{JSON.stringify(e.properties)}</span>
                  <span className="text-[10px] text-[#3A3A4A] shrink-0">{new Date(e.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
              {events.length === 0 && (
                <div className="px-4 py-8 text-center text-[#3A3A4A] text-xs">No events recorded yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// KPI CARD COMPONENT
// ═══════════════════════════════════════════

const KPICard: React.FC<{ icon: any; label: string; value: string | number; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-[#0C0C14] border border-[#1A1A2E] rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-[10px] text-[#55556A] uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-2xl font-bold text-[#E8E8F0]">{value}</div>
  </div>
);

export default AdminDashboard;
