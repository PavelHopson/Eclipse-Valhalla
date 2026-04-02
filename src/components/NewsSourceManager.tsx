/**
 * Eclipse Valhalla — Nexus Signal Source Manager
 *
 * Add/edit/remove news sources. RSS, Telegram, Website.
 */

import React, { useState } from 'react';
import { NewsSource, SourceType, NEWS_CATEGORIES, addSource, removeSource, updateSource, getSources } from '../news';
import { Plus, Trash2, Rss, Globe, Send, ToggleLeft, ToggleRight } from 'lucide-react';

interface NewsSourceManagerProps {
  userId: string;
  sources: NewsSource[];
  onSourcesChanged: () => void;
}

const SOURCE_ICONS: Record<SourceType, any> = {
  rss: Rss,
  telegram: Send,
  website: Globe,
};

const NewsSourceManager: React.FC<NewsSourceManagerProps> = ({ userId, sources, onSourcesChanged }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<SourceType>('rss');

  const handleAdd = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    addSource(userId, {
      name: newName.trim(),
      type: newType,
      url: newUrl.trim(),
    });
    setNewName('');
    setNewUrl('');
    setShowAdd(false);
    onSourcesChanged();
  };

  const handleRemove = (sourceId: string) => {
    removeSource(userId, sourceId);
    onSourcesChanged();
  };

  const handleToggle = (sourceId: string, enabled: boolean) => {
    updateSource(userId, sourceId, { enabled });
    onSourcesChanged();
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#E8E8F0]">Signal Sources</h3>
          <p className="text-[10px] text-[#55556A]">{sources.length} source{sources.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5DAEFF15] text-[#5DAEFF] border border-[#5DAEFF30] text-xs font-medium hover:bg-[#5DAEFF20] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Source
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-[#12121A] border border-[#2A2A3C] rounded-xl p-4 space-y-3">
          {/* Type selector */}
          <div className="flex gap-2">
            {(['rss', 'website', 'telegram'] as SourceType[]).map(type => {
              const Icon = SOURCE_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => setNewType(type)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    newType === type
                      ? 'bg-[#5DAEFF15] text-[#5DAEFF] border border-[#5DAEFF30]'
                      : 'bg-[#1A1A26] text-[#55556A] border border-[#1E1E2E] hover:text-[#8888A0]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {type === 'rss' ? 'RSS' : type === 'telegram' ? 'Telegram' : 'Website'}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Source name (e.g., TechCrunch)"
            className="w-full px-3 py-2 bg-[#0E0E16] border border-[#2A2A3C] rounded-lg text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF40]"
          />

          <input
            type="text"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder={
              newType === 'rss' ? 'https://example.com/feed.xml' :
              newType === 'telegram' ? '@channelname or https://t.me/channel' :
              'https://example.com'
            }
            className="w-full px-3 py-2 bg-[#0E0E16] border border-[#2A2A3C] rounded-lg text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF40]"
          />

          {newType === 'telegram' && (
            <p className="text-[10px] text-[#55556A]">
              Telegram parsing uses RSS bridges. Some channels may require backend integration.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs text-[#55556A] hover:text-[#8888A0]"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newUrl.trim()}
              className="px-4 py-1.5 bg-[#5DAEFF] text-[#0A0A0F] rounded-lg text-xs font-semibold disabled:opacity-30"
            >
              Add Signal
            </button>
          </div>
        </div>
      )}

      {/* Source list */}
      <div className="space-y-2">
        {sources.map(source => {
          const Icon = SOURCE_ICONS[source.type] || Globe;
          return (
            <div
              key={source.id}
              className="flex items-center gap-3 px-3 py-2.5 bg-[#1A1A26] border border-[#2A2A3C] rounded-xl"
            >
              <Icon className={`w-4 h-4 shrink-0 ${source.enabled ? 'text-[#5DAEFF]' : 'text-[#3A3A4A]'}`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${source.enabled ? 'text-[#E8E8F0]' : 'text-[#55556A]'}`}>
                  {source.name}
                </div>
                <div className="text-[10px] text-[#3A3A4A] truncate">{source.url}</div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => handleToggle(source.id, !source.enabled)}
                className="shrink-0"
              >
                {source.enabled
                  ? <ToggleRight className="w-5 h-5 text-[#5DAEFF]" />
                  : <ToggleLeft className="w-5 h-5 text-[#3A3A4A]" />
                }
              </button>

              {/* Delete */}
              <button
                onClick={() => handleRemove(source.id)}
                className="p-1 rounded hover:bg-[#8B000015] text-[#3A3A4A] hover:text-[#FF4444] transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {sources.length === 0 && (
          <div className="text-center py-8 text-[#3A3A4A]">
            <p className="text-sm">No signal sources configured.</p>
            <p className="text-xs mt-1">Add RSS feeds, websites, or Telegram channels.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsSourceManager;
