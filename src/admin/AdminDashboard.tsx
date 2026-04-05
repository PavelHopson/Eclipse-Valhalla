import React, { useMemo, useState, useEffect } from 'react';
import { getOverviewMetrics, getAIUsageMetrics, getSystemHealth, getEventFeed } from './adminService';
import type { OverviewMetrics, AIUsageMetrics, SystemHealth, TelemetryEvent } from './types';
import {
  Swords, Trophy, Shield, Activity, AlertTriangle, CheckCircle,
  Clock, Cpu, Rss, DollarSign, Eye, Radar, Orbit,
} from 'lucide-react';

type AdminTab = 'signals' | 'ai' | 'health' | 'events';

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('signals');
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

  const observationSignals = useMemo(() => {
    if (!overview || !aiMetrics || !health) return [];
    return [
      {
        title: 'Users stall after first pressure cycle',
        detail: `${overview.completionRate}% completion rate suggests many users never convert intention into repeated execution.`,
        tone: overview.completionRate < 40 ? 'danger' : 'neutral',
      },
      {
        title: 'Day-two retention is fragile',
        detail: `${overview.activeToday} users active today across ${overview.totalUsers} recorded profiles. Return pressure is not yet sticky enough.`,
        tone: overview.totalUsers > 0 && overview.activeToday <= 1 ? 'danger' : 'neutral',
      },
      {
        title: 'AI must sharpen decisions, not decorate them',
        detail: `${aiMetrics.totalRequests} AI requests with ${aiMetrics.successRate}% success rate. Monitor whether insight leads to quest creation.`,
        tone: aiMetrics.successRate < 90 ? 'danger' : 'gold',
      },
      {
        title: 'System integrity',
        detail: `${health.ingestionErrors} ingestion faults and ${health.errors24h} telemetry errors in the last 24h.`,
        tone: health.ingestionErrors > 0 || health.errors24h > 0 ? 'danger' : 'success',
      },
    ];
  }, [overview, aiMetrics, health]);

  const tabs = [
    { id: 'signals' as AdminTab, label: 'Eyes of Odin', icon: Eye },
    { id: 'ai' as AdminTab, label: 'AI Pressure', icon: Cpu },
    { id: 'health' as AdminTab, label: 'System Integrity', icon: Radar },
    { id: 'events' as AdminTab, label: 'Event Stream', icon: Orbit },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A]">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <section className="rounded-[28px] border border-white/10 bg-[#121212]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#7F7A72]">Observation layer</div>
              <h1 className="mt-2 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">Eyes of Odin</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#B4B0A7]">
                This is not a dashboard. It is a surveillance surface for behavioral failure, weak loops, and system health.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#A3303630] bg-[#7A1F2412] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C05A60]">
              <div className="h-2 w-2 rounded-full bg-[#A33036] animate-pulse" />
              Super Admin
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-[14px] border px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] ${
                    tab === t.id ? 'border-[#B89B5E30] bg-[#B89B5E10] text-[#D8C18E]' : 'border-white/8 bg-[#171717] text-[#7F7A72]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>

        {tab === 'signals' && overview && (
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SignalCard icon={Swords} label="Quests forged" value={overview.totalQuests} accent="#6C8FB8" />
              <SignalCard icon={Trophy} label="Completion rate" value={`${overview.completionRate}%`} accent={overview.completionRate < 40 ? '#A33036' : '#B89B5E'} />
              <SignalCard icon={Shield} label="Discipline average" value={overview.avgDisciplineScore} accent={overview.avgDisciplineScore < 60 ? '#A33036' : '#8E9B79'} />
              <SignalCard icon={DollarSign} label="Revenue pressure" value={`$${overview.revenue}`} accent="#B89B5E" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {observationSignals.map(signal => (
                <div key={signal.title} className={`rounded-[24px] border p-5 ${
                  signal.tone === 'danger' ? 'border-[#7A1F2435] bg-[#7A1F240D]' :
                  signal.tone === 'success' ? 'border-[#8E9B7930] bg-[#8E9B790D]' :
                  signal.tone === 'gold' ? 'border-[#B89B5E30] bg-[#B89B5E0D]' :
                  'border-white/8 bg-[#121212]/92'
                }`}>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">Signal</div>
                  <h3 className="mt-3 text-lg font-bold text-[#F2F1EE]">{signal.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#B4B0A7]">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'ai' && aiMetrics && (
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SignalCard icon={Cpu} label="AI requests" value={aiMetrics.totalRequests} accent="#6C8FB8" />
              <SignalCard icon={CheckCircle} label="Success rate" value={`${aiMetrics.successRate}%`} accent={aiMetrics.successRate < 90 ? '#A33036' : '#8E9B79'} />
              <SignalCard icon={Clock} label="Latency" value={`${aiMetrics.avgDurationMs}ms`} accent="#B89B5E" />
              <SignalCard icon={AlertTriangle} label="Top errors" value={aiMetrics.topErrors.length} accent={aiMetrics.topErrors.length > 0 ? '#A33036' : '#8E9B79'} />
            </div>

            <Panel title="Provider pressure">
              <div className="space-y-3">
                {Object.entries(aiMetrics.byProvider).map(([name, data]) => (
                  <div key={name} className="rounded-[18px] border border-white/8 bg-[#171717] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold capitalize text-[#F2F1EE]">{name}</div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#7F7A72]">{data.requests} req / {data.tokens.toLocaleString()} tok</div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
                      <div className="h-full rounded-full bg-[#6C8FB8]" style={{ width: `${Math.min(100, (data.requests / Math.max(aiMetrics.totalRequests, 1)) * 100)}%` }} />
                    </div>
                    {data.errors > 0 && <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[#C05A60]">{data.errors} failure signals</div>}
                  </div>
                ))}
              </div>
            </Panel>

            {aiMetrics.topErrors.length > 0 && (
              <Panel title="Failure signatures">
                <div className="space-y-2">
                  {aiMetrics.topErrors.map((e, i) => (
                    <div key={i} className="rounded-[16px] border border-[#7A1F2430] bg-[#7A1F240F] px-4 py-3 text-sm text-[#F4D6D8]">
                      <span className="mr-2 font-bold text-[#C05A60]">{e.count}x</span>
                      {e.error}
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}

        {tab === 'health' && health && (
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SignalCard icon={Rss} label="Nexus sources" value={health.ingestionSources} accent="#6C8FB8" />
              <SignalCard icon={CheckCircle} label="Healthy sources" value={health.ingestionHealthy} accent="#8E9B79" />
              <SignalCard icon={AlertTriangle} label="Source errors" value={health.ingestionErrors} accent={health.ingestionErrors > 0 ? '#A33036' : '#8E9B79'} />
              <SignalCard icon={Activity} label="24h errors" value={health.errors24h} accent={health.errors24h > 0 ? '#A33036' : '#B89B5E'} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Storage pressure">
                <div className="text-3xl font-extrabold text-[#F2F1EE]">{health.storageUsedKB} <span className="text-base text-[#7F7A72]">/ {health.storageMaxKB} KB</span></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(health.storageUsedKB / health.storageMaxKB) * 100}%`,
                      backgroundColor: health.storageUsedKB / health.storageMaxKB > 0.8 ? '#A33036' : '#6C8FB8',
                    }}
                  />
                </div>
              </Panel>

              <Panel title="Last ingestion">
                <div className="text-lg font-bold text-[#F2F1EE]">
                  {health.lastIngestionAt ? new Date(health.lastIngestionAt).toLocaleString() : 'Never'}
                </div>
                <div className="mt-3 text-sm text-[#B4B0A7]">
                  Active AI providers: {health.activeProviders}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div className="mt-6 overflow-hidden rounded-[24px] border border-white/8 bg-[#121212]/92">
            <div className="border-b border-white/8 px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">Telemetry stream</div>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {events.map((e, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-white/5 px-5 py-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-[#6C8FB8]" />
                  <span className="w-48 shrink-0 font-mono text-[#B4B0A7]">{e.event}</span>
                  <span className="flex-1 truncate text-[#7F7A72]">{JSON.stringify(e.properties)}</span>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-[#5F5A54]">{new Date(e.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
              {events.length === 0 && (
                <div className="px-5 py-12 text-center text-[#7F7A72]">No signals recorded yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SignalCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) => (
  <div className="rounded-[20px] border border-white/8 bg-[#121212]/92 p-4">
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#7F7A72]">
      <Icon className="h-4 w-4" style={{ color: accent }} />
      {label}
    </div>
    <div className="mt-3 text-3xl font-extrabold text-[#F2F1EE]">{value}</div>
  </div>
);

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-[24px] border border-white/8 bg-[#121212]/92 p-5">
    <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">{title}</div>
    <div className="mt-4">{children}</div>
  </div>
);

export default AdminDashboard;
