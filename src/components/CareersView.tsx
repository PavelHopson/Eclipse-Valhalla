/**
 * Eclipse Valhalla — Career Forge
 *
 * Gamified job-hunt tracker: daily career quests + kanban application tracker.
 * Uses localStorage via `careerService`.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../i18n';
import {
  Briefcase,
  Plus,
  Check,
  X,
  Trash2,
  ExternalLink,
  TrendingUp,
  Target,
  Wand2,
  Loader2,
  Copy,
  Save,
} from 'lucide-react';
import {
  getApplications,
  saveApplication,
  updateApplicationStatus,
  deleteApplication,
  getStats,
  completeQuest,
  getCompletedToday,
  saveCVForApplication,
  CAREER_QUESTS,
  type Application,
  type ApplicationStatus,
  type AppSource,
  type CareerQuestId,
  type CareerQuest,
} from '../services/careerService';
import { tailorCV, type CVTailorResult } from '../services/cvTailorService';

type TabId = 'quests' | 'applications';

const KANBAN_COLUMNS: { id: ApplicationStatus; labelEn: string; labelRu: string; accent: string }[] = [
  { id: 'applied',     labelEn: 'Applied',   labelRu: 'Отправлено',  accent: '#8888A0' },
  { id: 'hr-screen',   labelEn: 'HR Screen', labelRu: 'HR-скрининг', accent: '#5DAEFF' },
  { id: 'tech-screen', labelEn: 'Tech',      labelRu: 'Техсобес',    accent: '#7A5CFF' },
  { id: 'onsite',      labelEn: 'Onsite',    labelRu: 'Финал',       accent: '#FF6B35' },
  { id: 'offer',       labelEn: 'Offer',     labelRu: 'Оффер',       accent: '#4ADE80' },
  { id: 'rejected',    labelEn: 'Rejected',  labelRu: 'Отказ',       accent: '#FF4444' },
];

const SOURCES: AppSource[] = ['linkedin', 'hh.ru', 'referral', 'direct', 'other'];

const CareersView: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [tab, setTab] = useState<TabId>('quests');
  const [applications, setApplications] = useState<Application[]>([]);
  const [doneToday, setDoneToday] = useState<CareerQuestId[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [isAdding, setIsAdding] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  // Form fields (shared between add / edit)
  const [formCompany, setFormCompany] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formSource, setFormSource] = useState<AppSource>('linkedin');
  const [formUrl, setFormUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<ApplicationStatus>('applied');

  // CV Tailor state
  const [tailorApp, setTailorApp] = useState<Application | null>(null);
  const [tailorBaseCV, setTailorBaseCV] = useState('');
  const [tailorJobDescription, setTailorJobDescription] = useState('');
  const [tailorEmphasize, setTailorEmphasize] = useState('');
  const [tailorLoading, setTailorLoading] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [tailorResult, setTailorResult] = useState<CVTailorResult | null>(null);
  const [tailorCopied, setTailorCopied] = useState(false);

  const refresh = () => {
    setApplications(getApplications());
    setDoneToday(getCompletedToday());
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => getStats(), [applications, doneToday]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  // ─── Quests ───────────────────────────────────────────────────────────
  const handleCompleteQuest = (quest: CareerQuest) => {
    if (doneToday.includes(quest.id)) return;
    const result = completeQuest(quest.id);
    refresh();
    if (result.alreadyDone) {
      showToast(isRu ? 'Уже выполнено сегодня' : 'Already done today');
    } else {
      showToast(`+${result.xp} XP · ${isRu ? 'Получено' : 'Earned'}`);
    }
  };

  // ─── Applications ─────────────────────────────────────────────────────
  const resetForm = () => {
    setFormCompany('');
    setFormPosition('');
    setFormSource('linkedin');
    setFormUrl('');
    setFormNotes('');
    setFormStatus('applied');
  };

  const openAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const openEdit = (app: Application) => {
    setFormCompany(app.company);
    setFormPosition(app.position);
    setFormSource(app.source);
    setFormUrl(app.url || '');
    setFormNotes(app.notes || '');
    setFormStatus(app.status);
    setEditingApp(app);
  };

  const closeModals = () => {
    setIsAdding(false);
    setEditingApp(null);
    resetForm();
  };

  const submitAdd = () => {
    if (!formCompany.trim() || !formPosition.trim()) return;
    saveApplication({
      company: formCompany.trim(),
      position: formPosition.trim(),
      source: formSource,
      url: formUrl.trim() || undefined,
      notes: formNotes.trim(),
      status: formStatus,
    });
    refresh();
    closeModals();
    showToast(isRu ? 'Отклик добавлен' : 'Application added');
  };

  const submitEdit = () => {
    if (!editingApp) return;
    // Service only exposes `updateApplicationStatus` for updates. Status moves are
    // cheap. For non-status edits (company / position / notes / source / url) we
    // keep the data intact by only calling the status updater — other fields are
    // edited via delete + re-insert is lossy (new id + new timestamp), so for now
    // persist status only when editing. Non-status field changes stay in view
    // until the service gains a generic patch method.
    if (editingApp.status !== formStatus) {
      updateApplicationStatus(editingApp.id, formStatus);
    }
    refresh();
    closeModals();
  };

  const removeApp = (id: string) => {
    deleteApplication(id);
    refresh();
    closeModals();
  };

  // ─── CV Tailor ────────────────────────────────────────────────────────
  const openTailor = (app: Application) => {
    setTailorApp(app);
    setTailorBaseCV(app.cvVersion || '');
    setTailorJobDescription(app.notes || '');
    setTailorEmphasize('');
    setTailorResult(
      app.cvVersion
        ? {
            tailoredCV: app.cvVersion,
            keyChanges: [],
            matchScore: app.cvMatchScore ?? 0,
          }
        : null,
    );
    setTailorError(null);
    setTailorCopied(false);
  };

  const closeTailor = () => {
    setTailorApp(null);
    setTailorBaseCV('');
    setTailorJobDescription('');
    setTailorEmphasize('');
    setTailorResult(null);
    setTailorError(null);
    setTailorLoading(false);
    setTailorCopied(false);
  };

  const runTailor = async () => {
    if (!tailorApp) return;
    if (!tailorBaseCV.trim() || !tailorJobDescription.trim()) return;
    setTailorLoading(true);
    setTailorError(null);
    try {
      const result = await tailorCV({
        baseCV: tailorBaseCV.trim(),
        jobTitle: tailorApp.position,
        jobCompany: tailorApp.company,
        jobDescription: tailorJobDescription.trim(),
        emphasize: tailorEmphasize.trim() || undefined,
      });
      setTailorResult(result);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('No AI provider')) {
        setTailorError(isRu ? 'AI-провайдер не настроен. Зайдите в Настройки → AI-провайдеры.' : 'No AI provider configured. Go to Settings → AI Providers.');
      } else {
        setTailorError(msg || (isRu ? 'Не удалось адаптировать CV.' : 'Failed to tailor CV.'));
      }
    } finally {
      setTailorLoading(false);
    }
  };

  const copyTailored = async () => {
    if (!tailorResult) return;
    try {
      await navigator.clipboard.writeText(tailorResult.tailoredCV);
      setTailorCopied(true);
      window.setTimeout(() => setTailorCopied(false), 1800);
    } catch {
      // Clipboard API can fail in sandbox/older browsers — silent.
    }
  };

  const saveTailored = () => {
    if (!tailorApp || !tailorResult) return;
    saveCVForApplication(tailorApp.id, tailorResult.tailoredCV, tailorResult.matchScore);
    refresh();
    showToast(isRu ? 'Сохранено в отклик' : 'Saved to application');
    closeTailor();
  };

  const appsByStatus = (status: ApplicationStatus) =>
    applications.filter((a) => a.status === status);

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#050508' }}>
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: '#FF6B3515',
                border: '1px solid #FF6B3530',
              }}
            >
              <Briefcase className="w-5 h-5" style={{ color: '#FF6B35' }} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold text-[#EAEAF2] tracking-wide"
                style={{ fontFamily: "'Cinzel', Georgia, serif" }}
              >
                {isRu ? 'Кузница карьеры' : 'Career Forge'}
              </h2>
              <p className="text-xs text-[#8888A0] mt-0.5">
                {isRu ? 'Поиск работы как квест.' : 'Your job hunt, gamified.'}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ STATS ROW ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          <StatCard
            label={isRu ? 'Всего откликов' : 'Total applied'}
            value={stats.totalApplications}
            accent="#5DAEFF"
          />
          <StatCard
            label={isRu ? 'На этой неделе' : 'This week'}
            value={stats.thisWeek}
            accent="#FF6B35"
          />
          <StatCard
            label={isRu ? 'Активных интервью' : 'Active interviews'}
            value={stats.activeInterviews}
            accent="#7A5CFF"
          />
          <StatCard
            label={isRu ? 'Офферы' : 'Offers'}
            value={stats.offers}
            accent="#4ADE80"
          />
          <StatCard
            label={isRu ? 'Серия откликов' : 'Apply streak'}
            value={stats.applyStreak}
            accent="#D8C18E"
            unit={isRu ? 'д' : 'd'}
          />
        </div>

        {/* ═══ TABS ═══ */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{ backgroundColor: '#08080D', border: '1px solid #1E1E2E' }}
        >
          {(['quests', 'applications'] as const).map((id) => {
            const active = tab === id;
            const label =
              id === 'quests'
                ? isRu
                  ? 'Квесты'
                  : 'Quests'
                : isRu
                  ? 'Отклики'
                  : 'Applications';
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  active ? 'text-[#EAEAF2]' : 'text-[#8888A0] hover:text-[#EAEAF2]'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: '#1A1A26',
                        boxShadow: 'inset 0 0 0 1px #2A2A3C70',
                      }
                    : undefined
                }
              >
                {id === 'quests' ? (
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {label}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══ QUESTS TAB ═══ */}
        {tab === 'quests' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CAREER_QUESTS.map((quest) => {
              const done = doneToday.includes(quest.id);
              const title = isRu ? quest.titleRu : quest.title;
              return (
                <div
                  key={quest.id}
                  className="rounded-2xl p-4 flex flex-col gap-3 transition-all"
                  style={{
                    backgroundColor: done ? '#4ADE8008' : '#0B0B12',
                    border: `1px solid ${done ? '#4ADE8030' : '#1E1E2E'}`,
                    opacity: done ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl leading-none">{quest.icon}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: '#FF6B3515',
                        color: '#FF6B35',
                        border: '1px solid #FF6B3530',
                      }}
                    >
                      +{quest.xp} XP
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#EAEAF2] leading-snug">
                      {title}
                    </h3>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#55556A] mt-1 inline-block">
                      {quest.interval === 'daily'
                        ? isRu
                          ? 'день'
                          : 'daily'
                        : quest.interval === 'weekly'
                          ? isRu
                            ? 'неделя'
                            : 'weekly'
                          : isRu
                            ? 'по запросу'
                            : 'on-demand'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCompleteQuest(quest)}
                    disabled={done}
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all disabled:cursor-default"
                    style={
                      done
                        ? {
                            backgroundColor: '#4ADE8015',
                            color: '#4ADE80',
                            border: '1px solid #4ADE8030',
                          }
                        : {
                            backgroundColor: '#FF6B35',
                            color: '#0A0A0F',
                            boxShadow: '0 4px 12px rgba(255,107,53,0.25)',
                          }
                    }
                  >
                    {done ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        {isRu ? 'Сделано' : 'Done'}
                      </span>
                    ) : (
                      isRu ? 'Выполнить' : 'Complete'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ APPLICATIONS TAB ═══ */}
        {tab === 'applications' && (
          <div className="space-y-4">
            {/* Add button */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8888A0]">
                {isRu ? 'Канбан откликов' : 'Applications board'}
              </span>
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: '#FF6B35',
                  color: '#0A0A0F',
                  boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                {isRu ? '+ Новый отклик' : '+ Add application'}
              </button>
            </div>

            {/* Empty state */}
            {applications.length === 0 && (
              <div
                className="text-center py-16 rounded-2xl"
                style={{ backgroundColor: '#08080D', border: '1px dashed #1E1E2E' }}
              >
                <Briefcase className="w-8 h-8 mx-auto mb-3 text-[#3A3A4A]" />
                <p className="font-semibold text-[#8888A0]">
                  {isRu
                    ? 'Пока нет откликов. Начни с первого!'
                    : 'No applications yet. Start with your first!'}
                </p>
              </div>
            )}

            {/* Kanban */}
            {applications.length > 0 && (
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                {KANBAN_COLUMNS.map((col) => {
                  const items = appsByStatus(col.id);
                  return (
                    <div
                      key={col.id}
                      className="rounded-2xl p-3 flex flex-col gap-2 min-h-[160px]"
                      style={{
                        backgroundColor: '#08080D',
                        border: '1px solid #16162240',
                      }}
                    >
                      {/* Column header */}
                      <div className="flex items-center justify-between px-1.5 pb-2 mb-1 border-b border-[#1E1E2E]">
                        <span
                          className="text-[10px] font-bold uppercase tracking-[0.2em]"
                          style={{ color: col.accent }}
                        >
                          {isRu ? col.labelRu : col.labelEn}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${col.accent}15`,
                            color: col.accent,
                          }}
                        >
                          {items.length}
                        </span>
                      </div>

                      {/* Cards */}
                      {items.length === 0 ? (
                        <div className="text-center py-6 text-[10px] text-[#3A3A4A]">
                          —
                        </div>
                      ) : (
                        items.map((app) => (
                          <div
                            key={app.id}
                            className="rounded-xl p-3 transition-all hover:translate-y-[-1px]"
                            style={{
                              backgroundColor: '#0B0B12',
                              border: '1px solid #1E1E2E',
                            }}
                          >
                            <button
                              onClick={() => openEdit(app)}
                              className="w-full text-left"
                            >
                              <div className="text-sm font-bold text-[#EAEAF2] truncate">
                                {app.company}
                              </div>
                              <div className="text-[11px] text-[#8888A0] truncate mt-0.5">
                                {app.position}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span
                                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: '#1A1A26',
                                    color: '#8888A0',
                                  }}
                                >
                                  {app.source}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {typeof app.cvMatchScore === 'number' && (
                                    <span
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                      style={{
                                        backgroundColor: '#FF6B3515',
                                        color: '#FF6B35',
                                        border: '1px solid #FF6B3530',
                                      }}
                                    >
                                      {app.cvMatchScore}%
                                    </span>
                                  )}
                                  {app.url && (
                                    <ExternalLink className="w-3 h-3 text-[#3A3A4A]" />
                                  )}
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openTailor(app);
                              }}
                              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                              style={{
                                backgroundColor: '#FF6B3510',
                                color: '#FF6B35',
                                border: '1px solid #FF6B3530',
                              }}
                            >
                              <Wand2 className="w-3 h-3" />
                              {isRu ? 'Настроить CV' : 'Tailor CV'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ ADD / EDIT MODAL ═══ */}
      {(isAdding || editingApp) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={closeModals}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 space-y-3"
            style={{
              backgroundColor: '#0B0B12',
              border: '1px solid #2A2A3C70',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-bold text-[#EAEAF2]"
                style={{ fontFamily: "'Cinzel', Georgia, serif" }}
              >
                {editingApp
                  ? isRu
                    ? 'Редактировать отклик'
                    : 'Edit application'
                  : isRu
                    ? 'Новый отклик'
                    : 'New application'}
              </h3>
              <button
                onClick={closeModals}
                className="p-1.5 rounded-lg text-[#8888A0] hover:text-[#EAEAF2] hover:bg-[#1A1A26] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Field label={isRu ? 'Компания' : 'Company'}>
              <input
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                disabled={!!editingApp}
                placeholder={isRu ? 'Напр. Google' : 'e.g. Google'}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-[#050508] border border-[#1E1E2E] text-[#EAEAF2] focus:border-[#5DAEFF] disabled:opacity-60"
                autoFocus={!editingApp}
              />
            </Field>

            <Field label={isRu ? 'Должность' : 'Position'}>
              <input
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                disabled={!!editingApp}
                placeholder={isRu ? 'Напр. Senior Engineer' : 'e.g. Senior Engineer'}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-[#050508] border border-[#1E1E2E] text-[#EAEAF2] focus:border-[#5DAEFF] disabled:opacity-60"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={isRu ? 'Источник' : 'Source'}>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value as AppSource)}
                  disabled={!!editingApp}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-[#050508] border border-[#1E1E2E] text-[#EAEAF2] focus:border-[#5DAEFF] disabled:opacity-60"
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={isRu ? 'Статус' : 'Status'}>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-[#050508] border border-[#1E1E2E] text-[#EAEAF2] focus:border-[#5DAEFF]"
                >
                  {KANBAN_COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isRu ? c.labelRu : c.labelEn}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={isRu ? 'Ссылка' : 'URL'}>
              <input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                disabled={!!editingApp}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-[#050508] border border-[#1E1E2E] text-[#EAEAF2] focus:border-[#5DAEFF] disabled:opacity-60"
              />
            </Field>

            <Field label={isRu ? 'Заметки' : 'Notes'}>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                disabled={!!editingApp}
                placeholder={
                  isRu ? 'Контакт рекрутера, впечатления...' : 'Recruiter contact, notes...'
                }
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-[#050508] border border-[#1E1E2E] text-[#EAEAF2] focus:border-[#5DAEFF] resize-none disabled:opacity-60"
              />
            </Field>

            {editingApp && (
              <p className="text-[10px] text-[#55556A] italic">
                {isRu
                  ? 'Редактирование статуса доступно. Поля компании, должности и заметок заблокированы — удалите и создайте заново, чтобы изменить.'
                  : 'Status editing is supported. Company, position, and notes fields are locked — delete and re-create to change them.'}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2">
              {editingApp ? (
                <button
                  onClick={() => removeApp(editingApp.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#FF4444] hover:bg-[#FF444415] transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isRu ? 'Удалить' : 'Delete'}
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#8888A0] hover:text-[#EAEAF2] transition-all"
                >
                  {isRu ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={editingApp ? submitEdit : submitAdd}
                  disabled={!editingApp && (!formCompany.trim() || !formPosition.trim())}
                  className="px-5 py-2 rounded-lg text-xs font-bold disabled:opacity-30 transition-all"
                  style={{
                    backgroundColor: '#5DAEFF',
                    color: '#0A0A0F',
                  }}
                >
                  {editingApp ? (isRu ? 'Сохранить' : 'Save') : isRu ? 'Добавить' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CV TAILOR MODAL ═══ */}
      {tailorApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(5,5,8,0.88)', backdropFilter: 'blur(6px)' }}
          onClick={closeTailor}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 space-y-4"
            style={{
              backgroundColor: '#0B0B12',
              border: '1px solid #2A2A3C70',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: '#FF6B3515',
                    border: '1px solid #FF6B3530',
                  }}
                >
                  <Wand2 className="w-5 h-5" style={{ color: '#FF6B35' }} />
                </div>
                <div>
                  <h3
                    className="text-lg font-bold text-[#EAEAF2]"
                    style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                  >
                    {isRu ? 'Настройка CV' : 'CV Tailor'}
                  </h3>
                  <p className="text-xs text-[#8888A0] mt-0.5 truncate">
                    {tailorApp.company} — {tailorApp.position}
                  </p>
                </div>
              </div>
              <button
                onClick={closeTailor}
                className="p-1.5 rounded-lg text-[#8888A0] hover:text-[#EAEAF2] hover:bg-[#1A1A26] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input section */}
            <div className="space-y-3">
              <Field label={isRu ? 'Ваше CV' : 'Your base CV'}>
                <textarea
                  value={tailorBaseCV}
                  onChange={(e) => setTailorBaseCV(e.target.value)}
                  placeholder={isRu ? 'Вставьте сюда своё обычное CV…' : 'Paste your generic CV here…'}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-[#050508] border border-[#1E1E2E] text-[#EAEAF2] focus:border-[#FF6B35] resize-y"
                />
              </Field>

              <Field label={isRu ? 'Описание вакансии' : 'Job description'}>
                <textarea
                  value={tailorJobDescription}
                  onChange={(e) => setTailorJobDescription(e.target.value)}
                  placeholder={isRu ? 'Вставьте описание вакансии…' : 'Paste the job description…'}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-[#050508] border border-[#1E1E2E] text-[#EAEAF2] focus:border-[#FF6B35] resize-y"
                />
              </Field>

              <Field label={isRu ? 'Что подчеркнуть' : 'Skills to emphasize'}>
                <input
                  value={tailorEmphasize}
                  onChange={(e) => setTailorEmphasize(e.target.value)}
                  placeholder={
                    isRu
                      ? 'Необязательно — напр. TypeScript, system design…'
                      : 'Optional — e.g. TypeScript, system design…'
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-[#050508] border border-[#1E1E2E] text-[#EAEAF2] focus:border-[#FF6B35]"
                />
              </Field>

              <button
                onClick={runTailor}
                disabled={tailorLoading || !tailorBaseCV.trim() || !tailorJobDescription.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#FF6B35',
                  color: '#0A0A0F',
                  boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                }}
              >
                {tailorLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isRu ? 'Анализ вашего CV…' : 'Analyzing your CV…'}
                  </>
                ) : tailorResult ? (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    {isRu ? 'Перегенерировать' : 'Regenerate'}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    {isRu ? 'Сгенерировать' : 'Generate'}
                  </>
                )}
              </button>

              {tailorError && (
                <div
                  className="px-3 py-2 rounded-lg text-[11px] font-semibold"
                  style={{
                    backgroundColor: '#FF444415',
                    color: '#FF6666',
                    border: '1px solid #FF444430',
                  }}
                >
                  {tailorError}
                </div>
              )}
            </div>

            {/* Result section */}
            {tailorResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#1E1E2E]">
                {/* Tailored CV */}
                <div
                  className="rounded-xl p-3 flex flex-col gap-2 min-h-[240px]"
                  style={{
                    backgroundColor: '#050508',
                    border: '1px solid #1E1E2E',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8888A0]">
                      {isRu ? 'Адаптированное CV' : 'Tailored CV'}
                    </span>
                    <button
                      onClick={copyTailored}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all"
                      style={{
                        backgroundColor: tailorCopied ? '#4ADE8015' : '#1A1A26',
                        color: tailorCopied ? '#4ADE80' : '#8888A0',
                        border: `1px solid ${tailorCopied ? '#4ADE8030' : '#2A2A3C'}`,
                      }}
                    >
                      {tailorCopied ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {tailorCopied
                        ? isRu
                          ? 'Скопировано'
                          : 'Copied'
                        : isRu
                          ? 'Скопировать'
                          : 'Copy'}
                    </button>
                  </div>
                  <pre className="flex-1 whitespace-pre-wrap text-[11px] leading-relaxed text-[#EAEAF2] font-sans">
                    {tailorResult.tailoredCV}
                  </pre>
                </div>

                {/* Score + changes */}
                <div className="flex flex-col gap-3">
                  <div
                    className="rounded-xl p-4 flex flex-col items-center justify-center"
                    style={{
                      backgroundColor: '#050508',
                      border: '1px solid #FF6B3530',
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8888A0]">
                      {isRu ? 'Соответствие' : 'Match score'}
                    </span>
                    <div
                      className="text-5xl font-extrabold leading-none mt-2"
                      style={{
                        color: '#FF6B35',
                        fontFamily: "'Cinzel', Georgia, serif",
                      }}
                    >
                      {tailorResult.matchScore}
                      <span className="text-xl align-top text-[#8888A0]">%</span>
                    </div>
                    {/* Gauge bar */}
                    <div
                      className="w-full h-1.5 rounded-full mt-3 overflow-hidden"
                      style={{ backgroundColor: '#1A1A26' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${tailorResult.matchScore}%`,
                          background: 'linear-gradient(90deg,#FF6B35,#FFB26B)',
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="flex-1 rounded-xl p-3"
                    style={{
                      backgroundColor: '#050508',
                      border: '1px solid #1E1E2E',
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8888A0]">
                      {isRu ? 'Ключевые изменения' : 'Key changes'}
                    </span>
                    {tailorResult.keyChanges.length === 0 ? (
                      <p className="text-[11px] text-[#55556A] italic mt-2">—</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {tailorResult.keyChanges.map((change, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-[11px] text-[#EAEAF2] leading-snug"
                          >
                            <span
                              className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: '#FF6B35' }}
                            />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    onClick={saveTailored}
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: '#5DAEFF',
                      color: '#0A0A0F',
                      boxShadow: '0 4px 12px rgba(93,174,255,0.25)',
                    }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isRu ? 'Сохранить в отклик' : 'Save to application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-bold"
          style={{
            backgroundColor: '#0B0B12',
            border: '1px solid #4ADE8040',
            color: '#4ADE80',
            boxShadow: '0 10px 40px rgba(74,222,128,0.2)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

// ─── Subcomponents ──────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: number; accent: string; unit?: string }> = ({
  label,
  value,
  accent,
  unit,
}) => (
  <div
    className="rounded-2xl p-3 flex flex-col gap-1"
    style={{
      backgroundColor: '#08080D',
      border: '1px solid #16162240',
    }}
  >
    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8888A0] truncate">
      {label}
    </span>
    <div className="flex items-baseline gap-1">
      <span
        className="text-2xl font-extrabold leading-none"
        style={{ color: accent, fontFamily: "'Cinzel', Georgia, serif" }}
      >
        {value}
      </span>
      {unit && <span className="text-[10px] font-bold text-[#8888A0]">{unit}</span>}
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8888A0]">
      {label}
    </label>
    {children}
  </div>
);

export default CareersView;
