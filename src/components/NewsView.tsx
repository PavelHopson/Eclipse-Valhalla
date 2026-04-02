/**
 * Eclipse Valhalla — Nexus Feed
 *
 * Intelligence stream. Bilingual. Guided. Brutal.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getSources, getItems, fetchAllSources, markAsRead, saveItem, convertNewsToQuest, generateDigest } from '../news';
import type { NewsItem, NewsSource, QuestFromNews } from '../news';
import NewsCard from './NewsCard';
import NewsSourceManager from './NewsSourceManager';
import { useLanguage } from '../i18n';
import { Loader2, RefreshCw, Rss, BarChart3, FileText, HelpCircle } from 'lucide-react';

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

  const handleSourcesChanged = () => { setSources(getSources(userId)); };

  const filteredItems = items.filter(i => {
    if (i.archived) return false;
    if (filter === 'unread' && i.read) return false;
    if (filter === 'saved' && !i.saved) return false;
    return true;
  });

  const unreadCount = items.filter(i => !i.read && !i.archived).length;
  const digest = generateDigest(userId);

  const tabs: { id: NexusTab; label: string; icon: any; badge?: number }[] = [
    { id: 'feed', label: isRU ? 'Лента' : 'Feed', icon: Rss, badge: unreadCount },
    { id: 'sources', label: isRU ? 'Источники' : 'Sources', icon: BarChart3, badge: sources.length },
    { id: 'digest', label: isRU ? 'Дайджест' : 'Digest', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-[#16162240] bg-[#08080D]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-[#EAEAF2] tracking-tight">{isRU ? 'Nexus — Разведка' : 'Nexus — Intelligence'}</h2>
            <p className="text-[11px] text-[#5E5E78] mt-0.5">
              {isRU
                ? 'Добавь RSS-источники, сайты или Telegram-каналы. Система соберёт, ранжирует и покажет важное.'
                : 'Add RSS feeds, websites, or Telegram channels. The system collects, ranks, and surfaces what matters.'}
            </p>
          </div>
          <button onClick={handleRefresh} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B12] border border-[#1E1E3040] text-xs font-bold text-[#9494AD] hover:text-[#EAEAF2] hover:border-[#2A2A3C70] transition-all disabled:opacity-40">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? (isRU ? 'Сканирую...' : 'Scanning...') : (isRU ? 'Обновить' : 'Refresh')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0B0B12] border border-[#1E1E3040] rounded-lg p-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all flex-1 justify-center ${
                  tab === t.id ? 'bg-[#14141F] text-[#EAEAF2] shadow-sm' : 'text-[#5E5E78] hover:text-[#9494AD]'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#5DA8FF10] text-[#5DA8FF] font-bold">{t.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* ═══ FEED ═══ */}
        {tab === 'feed' && (
          <div className="space-y-3">
            {/* Filter pills */}
            <div className="flex gap-2 mb-4">
              {(['all', 'unread', 'saved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    filter === f ? 'bg-[#5DA8FF10] text-[#5DA8FF] border border-[#5DA8FF25]' : 'text-[#5E5E78] hover:text-[#9494AD]'
                  }`}>
                  {f === 'all' ? (isRU ? 'Все' : 'All') : f === 'unread' ? `${isRU ? 'Непрочит.' : 'Unread'} (${unreadCount})` : (isRU ? 'Сохранённые' : 'Saved')}
                </button>
              ))}
            </div>

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredItems.map(item => (
                  <NewsCard key={item.id} item={item} onMarkRead={handleMarkRead} onSave={handleSave} onConvertToQuest={handleConvertToQuest} />
                ))}
              </div>
            ) : (
              /* ═══ EMPTY STATE — with explanation ═══ */
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-xl bg-[#0B0B12] border border-[#1E1E3040] flex items-center justify-center mx-auto mb-5">
                  <Rss className="w-7 h-7 text-[#3D3D52]" />
                </div>
                <h3 className="text-base font-bold text-[#EAEAF2] mb-2">
                  {sources.length === 0
                    ? (isRU ? 'Нет источников' : 'No sources configured')
                    : (isRU ? 'Нет новостей по фильтру' : 'No items match current filter')}
                </h3>
                <p className="text-sm text-[#5E5E78] max-w-md mx-auto mb-2">
                  {sources.length === 0
                    ? (isRU
                      ? 'Nexus — это твоя разведывательная система. Добавь RSS-ленты, сайты или Telegram-каналы, и система будет автоматически собирать, ранжировать и показывать важные новости.'
                      : 'Nexus is your intelligence system. Add RSS feeds, websites, or Telegram channels, and the system will automatically collect, rank, and surface important news.')
                    : (isRU ? 'Попробуй изменить фильтр или обновить ленту.' : 'Try changing the filter or refreshing the feed.')}
                </p>

                {sources.length === 0 && (
                  <>
                    {/* How it works */}
                    <div className="max-w-sm mx-auto mt-6 space-y-2 text-left">
                      {[
                        isRU ? '1. Перейди во вкладку "Источники"' : '1. Go to the "Sources" tab',
                        isRU ? '2. Добавь RSS-ленту, сайт или Telegram-канал' : '2. Add an RSS feed, website, or Telegram channel',
                        isRU ? '3. Нажми "Обновить" — система соберёт новости' : '3. Click "Refresh" — the system will collect news',
                        isRU ? '4. Важные новости можно превратить в квесты' : '4. Important news can be converted into quests',
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-2 bg-[#0B0B12] border border-[#1E1E3040] rounded-lg">
                          <span className="text-[10px] font-bold text-[#5DA8FF] mt-0.5">{i + 1}</span>
                          <span className="text-xs text-[#9494AD]">{step.slice(3)}</span>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => setTab('sources')}
                      className="mt-6 px-6 py-3 bg-[#5DA8FF] text-[#050508] rounded-lg text-sm font-bold">
                      {isRU ? 'Добавить источник' : 'Add Source'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ SOURCES ═══ */}
        {tab === 'sources' && (
          <div>
            {/* Explanation banner */}
            <div className="mb-4 px-4 py-3 bg-[#0B0B12] border border-[#1E1E3040] rounded-lg flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-[#5DA8FF] shrink-0 mt-0.5" />
              <p className="text-xs text-[#9494AD] leading-relaxed">
                {isRU
                  ? 'Добавляй источники новостей: RSS-ленты (напр. https://habr.com/ru/rss/), сайты (система попробует найти RSS автоматически) или Telegram-каналы (через @имя).'
                  : 'Add news sources: RSS feeds (e.g. https://techcrunch.com/feed/), websites (the system will try to detect RSS automatically), or Telegram channels (via @name).'}
              </p>
            </div>
            <NewsSourceManager userId={userId} sources={sources} onSourcesChanged={handleSourcesChanged} />
          </div>
        )}

        {/* ═══ DIGEST ═══ */}
        {tab === 'digest' && (
          <div className="space-y-4">
            {/* Explanation */}
            <div className="px-4 py-3 bg-[#0B0B12] border border-[#1E1E3040] rounded-lg flex items-start gap-3 mb-4">
              <HelpCircle className="w-4 h-4 text-[#7B5CFF] shrink-0 mt-0.5" />
              <p className="text-xs text-[#9494AD] leading-relaxed">
                {isRU
                  ? 'Дайджест — автоматическая сводка самых важных новостей. Система отбирает топ-сигналы по релевантности и показывает краткую сводку.'
                  : 'Digest is an automatic summary of the most important news. The system selects top signals by relevance and shows a brief overview.'}
              </p>
            </div>

            <div className="bg-[#0B0B12] border border-[#1E1E3040] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#7B5CFF]" />
                <h3 className="text-sm font-bold text-[#EAEAF2]">{digest.title}</h3>
              </div>
              <p className="text-xs text-[#9494AD] leading-relaxed mb-4">{digest.summary}</p>
              <div className="text-[10px] text-[#3D3D52]">
                {isRU ? 'Создан' : 'Generated'}: {new Date(digest.generatedAt).toLocaleTimeString()} · {digest.itemIds.length} {isRU ? 'сигналов' : 'signals'}
              </div>
            </div>

            {digest.itemIds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-[#5E5E78] uppercase tracking-[0.2em]">{isRU ? 'Топ сигналы' : 'Top Signals'}</h4>
                {items.filter(i => digest.itemIds.includes(i.id)).slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-[#0B0B12] border border-[#1E1E3040] rounded-lg">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#5DA8FF08] text-[#5DA8FF] border border-[#5DA8FF15]">{item.importanceScore}</span>
                    <span className="text-sm text-[#EAEAF2] truncate flex-1">{item.title}</span>
                  </div>
                ))}
              </div>
            )}

            {digest.itemIds.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[#5E5E78]">{isRU ? 'Нет данных для дайджеста. Добавь источники и обнови ленту.' : 'No data for digest. Add sources and refresh the feed.'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsView;
