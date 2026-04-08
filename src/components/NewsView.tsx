import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSources, getItems, fetchAllSources, markAsRead, saveItem, convertNewsToQuest, generateDigest } from '../news';
import type { NewsItem, NewsSource, QuestFromNews } from '../news';
import NewsCard from './NewsCard';
import NewsSourceManager from './NewsSourceManager';
import { useLanguage } from '../i18n';
import { Loader2, RefreshCw, Radar, FileText, Signal, ArrowRightLeft } from 'lucide-react';

interface NewsViewProps {
  userId: string;
  onCreateQuest?: (quest: QuestFromNews) => void;
}

type NexusTab = 'feed' | 'sources' | 'digest';

const NewsView: React.FC<NewsViewProps> = ({ userId, onCreateQuest }) => {
  const { language } = useLanguage();
  const isRU = language === 'ru';
  const [tab, setTab] = useState<NexusTab>('feed');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'saved'>('all');

  useEffect(() => {
    setSources(getSources(userId));
    setItems(getItems(userId));
  }, [userId]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchAllSources(userId);
      setItems(fetched);
      setSources(getSources(userId));
    } catch (e) {
      console.error('[Nexus] Refresh failed:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleMarkRead = (id: string) => {
    markAsRead(userId, id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  };

  const handleSave = (id: string) => {
    saveItem(userId, id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, saved: true } : i));
  };

  const handleConvertToQuest = (item: NewsItem) => {
    const quest = convertNewsToQuest(item, userId);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, convertedToQuest: true } : i));
    onCreateQuest?.(quest);
  };

  const filteredItems = useMemo(() => items.filter(i => {
    if (i.archived) return false;
    if (filter === 'unread' && i.read) return false;
    if (filter === 'saved' && !i.saved) return false;
    return true;
  }), [items, filter]);

  const unreadCount = items.filter(i => !i.read && !i.archived).length;
  const convertedCount = items.filter(i => i.convertedToQuest).length;
  const digest = generateDigest(userId);

  const tabs = [
    { id: 'feed' as NexusTab, label: isRU ? 'Поток сигналов' : 'Signal stream', icon: Signal },
    { id: 'sources' as NexusTab, label: isRU ? 'Сетка источников' : 'Source matrix', icon: Radar },
    { id: 'digest' as NexusTab, label: isRU ? 'Сводка' : 'Digest', icon: FileText },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0A0A0A]">
      <div className="border-b border-white/8 bg-[#121212]/96 px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#7F7A72]">Nexus flow</div>
            <h1 className="mt-2 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">{isRU ? 'Nexus разведка' : 'Nexus intelligence'}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#B4B0A7]">
              {isRU
                ? 'Здесь новости становятся не лентой, а потоком сигналов. Важное должно быстро превращаться в квест.'
                : 'This is not a news feed. It is a stream of signals. Important signals should turn into quests quickly.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetricPill label={isRU ? 'Новые' : 'Unread'} value={unreadCount} accent="#6C8FB8" />
            <MetricPill label={isRU ? 'Источники' : 'Sources'} value={sources.length} accent="#8E9B79" />
            <MetricPill label={isRU ? 'В квесты' : 'Converted'} value={convertedCount} accent="#B89B5E" />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex rounded-[16px] border border-white/8 bg-[#171717] p-1">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-[12px] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-all ${
                    tab === t.id ? 'bg-[#232323] text-[#F2F1EE]' : 'text-[#7F7A72]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-[14px] border border-[#6C8FB830] bg-[#171717] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#B4B0A7] transition-all hover:text-[#F2F1EE] disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? (isRU ? 'Сканирую' : 'Scanning') : (isRU ? 'Обновить поток' : 'Refresh stream')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {tab === 'feed' && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'all', label: isRU ? 'Все сигналы' : 'All signals' },
                { id: 'unread', label: isRU ? 'Новые' : 'Unread' },
                { id: 'saved', label: isRU ? 'В резерве' : 'Stored' },
              ] as const).map(item => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] ${
                    filter === item.id ? 'border-[#6C8FB833] bg-[#6C8FB812] text-[#9AB7D4]' : 'border-white/8 bg-[#171717] text-[#7F7A72]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map(item => (
                  <NewsCard key={item.id} item={item} onMarkRead={handleMarkRead} onSave={handleSave} onConvertToQuest={handleConvertToQuest} />
                ))}
              </div>
            ) : (
              <EmptyNexus
                title={sources.length === 0 ? (isRU ? 'Поток пуст.' : 'The stream is empty.') : (isRU ? 'Сигналы не найдены.' : 'No signals match.')}
                description={sources.length === 0
                  ? (isRU ? 'Добавь источники, чтобы Nexus начал собирать и ранжировать входящие сигналы.' : 'Add sources so Nexus can collect and rank incoming signals.')
                  : (isRU ? 'Смени фильтр или обнови поток.' : 'Change the filter or refresh the stream.')}
                actionLabel={sources.length === 0 ? (isRU ? 'Перейти к источникам' : 'Open source matrix') : undefined}
                onAction={sources.length === 0 ? () => setTab('sources') : undefined}
              />
            )}
          </div>
        )}

        {tab === 'sources' && (
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="rounded-[24px] border border-[#6C8FB822] bg-[#121212]/92 p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">{isRU ? 'Матрица источников' : 'Source matrix'}</div>
              <p className="mt-3 text-sm leading-6 text-[#B4B0A7]">
                {isRU
                  ? 'Подключай RSS, сайты и Telegram-каналы. Это сенсоры, которые питают поток сигналов.'
                  : 'Connect RSS feeds, websites, and Telegram channels. These are the sensors feeding the signal stream.'}
              </p>
            </div>
            <NewsSourceManager userId={userId} sources={sources} onSourcesChanged={() => setSources(getSources(userId))} />
          </div>
        )}

        {tab === 'digest' && (
          <div className="mx-auto max-w-4xl space-y-5">
            <div className="rounded-[28px] border border-[#6C8FB822] bg-[#121212]/92 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-[#7F7A72]">
                <ArrowRightLeft className="h-4 w-4 text-[#6C8FB8]" />
                {isRU ? 'Сводка сигналов' : 'Signal digest'}
              </div>
              <h2 className="mt-4 font-ritual text-3xl text-[#F2F1EE]">{digest.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#B4B0A7]">{digest.summary}</p>
              <div className="mt-5 text-[11px] uppercase tracking-[0.16em] text-[#7F7A72]">
                {new Date(digest.generatedAt).toLocaleTimeString()} / {digest.itemIds.length} {isRU ? 'сигналов' : 'signals'}
              </div>
            </div>

            {digest.itemIds.length > 0 ? (
              <div className="space-y-3">
                {items.filter(i => digest.itemIds.includes(i.id)).slice(0, 5).map(item => (
                  <div key={item.id} className="rounded-[20px] border border-white/8 bg-[#171717] px-4 py-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full border border-[#6C8FB82A] bg-[#6C8FB812] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9AB7D4]">
                        {item.importanceScore}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[#F2F1EE]">{item.title}</div>
                        {item.summary && <div className="mt-2 text-sm leading-6 text-[#B4B0A7]">{item.summary}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyNexus
                title={isRU ? 'Сводка ещё не собрана.' : 'The digest has not formed yet.'}
                description={isRU ? 'Сначала добавь источники и обнови поток.' : 'Add sources and refresh the stream first.'}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MetricPill = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className="rounded-full border px-3 py-1.5" style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10` }}>
    <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>{label}</span>
    <span className="ml-2 text-sm font-extrabold text-[#F2F1EE]">{value}</span>
  </div>
);

const EmptyNexus = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="rounded-[28px] border border-white/8 bg-[#121212]/92 px-6 py-16 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#6C8FB822] bg-[#6C8FB810]">
      <Signal className="h-8 w-8 text-[#6C8FB8]" />
    </div>
    <h3 className="mt-6 font-ritual text-3xl text-[#F2F1EE]">{title}</h3>
    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#B4B0A7]">{description}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="mt-6 rounded-[14px] border border-[#6C8FB833] bg-[#6C8FB8] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A]">
        {actionLabel}
      </button>
    )}
  </div>
);

export default NewsView;
