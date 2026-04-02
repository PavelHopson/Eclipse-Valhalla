/**
 * Eclipse Valhalla — Nexus Feed View
 *
 * Main intelligence feed screen.
 * Tabs: Feed | Sources | Digest
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getSources, getItems, fetchAllSources, markAsRead, saveItem, convertNewsToQuest, generateDigest } from '../news';
import type { NewsItem, NewsSource, QuestFromNews } from '../news';
import NewsCard from './NewsCard';
import NewsSourceManager from './NewsSourceManager';
import { Loader2, RefreshCw, Rss, BarChart3, FileText, Filter } from 'lucide-react';

interface NewsViewProps {
  userId: string;
  onCreateQuest?: (quest: QuestFromNews) => void;
}

type NexusTab = 'feed' | 'sources' | 'digest';

const NewsView: React.FC<NewsViewProps> = ({ userId, onCreateQuest }) => {
  const [tab, setTab] = useState<NexusTab>('feed');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'saved'>('all');

  // Load on mount
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

  const handleSourcesChanged = () => {
    setSources(getSources(userId));
  };

  // Filtered items
  const filteredItems = items.filter(i => {
    if (i.archived) return false;
    if (filter === 'unread' && i.read) return false;
    if (filter === 'saved' && !i.saved) return false;
    return true;
  });

  const unreadCount = items.filter(i => !i.read && !i.archived).length;
  const digest = generateDigest(userId);

  const tabs: { id: NexusTab; label: string; icon: any; badge?: number }[] = [
    { id: 'feed', label: 'Feed', icon: Rss, badge: unreadCount },
    { id: 'sources', label: 'Sources', icon: BarChart3, badge: sources.length },
    { id: 'digest', label: 'Digest', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#1E1E2E] bg-[#0E0E16]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-[#E8E8F0] tracking-wide">Nexus Feed</h2>
            <p className="text-[10px] text-[#55556A] uppercase tracking-widest">Intelligence Stream</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1A26] border border-[#2A2A3C] text-xs text-[#8888A0] hover:text-[#E8E8F0] hover:border-[#3A3A52] transition-colors disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {loading ? 'Scanning...' : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-[#1A1A26] text-[#E8E8F0] border border-[#2A2A3C]'
                    : 'text-[#55556A] hover:text-[#8888A0]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#5DAEFF15] text-[#5DAEFF] font-bold">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ── FEED TAB ── */}
        {tab === 'feed' && (
          <div className="space-y-3">
            {/* Filter pills */}
            <div className="flex gap-2 mb-3">
              {(['all', 'unread', 'saved'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f ? 'bg-[#5DAEFF15] text-[#5DAEFF] border border-[#5DAEFF30]' : 'text-[#55556A] hover:text-[#8888A0]'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unreadCount})` : 'Saved'}
                </button>
              ))}
            </div>

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredItems.map(item => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    onMarkRead={handleMarkRead}
                    onSave={handleSave}
                    onConvertToQuest={handleConvertToQuest}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Rss className="w-10 h-10 text-[#2A2A3C] mx-auto mb-3" />
                <p className="text-sm text-[#55556A]">
                  {sources.length === 0 ? 'Add signal sources to start receiving intelligence.' : 'No items match current filters.'}
                </p>
                {sources.length === 0 && (
                  <button
                    onClick={() => setTab('sources')}
                    className="mt-3 px-4 py-2 bg-[#5DAEFF15] text-[#5DAEFF] rounded-lg text-xs font-medium border border-[#5DAEFF30]"
                  >
                    Configure Sources
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SOURCES TAB ── */}
        {tab === 'sources' && (
          <NewsSourceManager
            userId={userId}
            sources={sources}
            onSourcesChanged={handleSourcesChanged}
          />
        )}

        {/* ── DIGEST TAB ── */}
        {tab === 'digest' && (
          <div className="space-y-4">
            <div className="bg-[#1A1A26] border border-[#2A2A3C] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#7A5CFF]" />
                <h3 className="text-sm font-bold text-[#E8E8F0]">{digest.title}</h3>
              </div>
              <p className="text-xs text-[#8888A0] leading-relaxed mb-4">
                {digest.summary}
              </p>
              <div className="text-[10px] text-[#3A3A4A]">
                Generated: {new Date(digest.generatedAt).toLocaleTimeString()}
                &middot; {digest.itemIds.length} items
              </div>
            </div>

            {/* Top items preview */}
            {digest.itemIds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#55556A] uppercase tracking-wider">Top Signals</h4>
                {items
                  .filter(i => digest.itemIds.includes(i.id))
                  .slice(0, 5)
                  .map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2 bg-[#12121A] border border-[#1E1E2E] rounded-lg">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#5DAEFF10] text-[#5DAEFF]">
                        {item.importanceScore}
                      </span>
                      <span className="text-xs text-[#E8E8F0] truncate flex-1">{item.title}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsView;
