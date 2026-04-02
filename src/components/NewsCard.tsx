/**
 * Eclipse Valhalla — Nexus News Card
 */

import React from 'react';
import { NewsItem } from '../news';
import { Bookmark, ExternalLink, Swords, Check, Clock } from 'lucide-react';

interface NewsCardProps {
  item: NewsItem;
  onMarkRead: (id: string) => void;
  onSave: (id: string) => void;
  onConvertToQuest: (item: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, onMarkRead, onSave, onConvertToQuest }) => {
  const age = getTimeAgo(item.publishedAt);
  const importColor = item.importanceScore >= 70 ? '#FF4444'
    : item.importanceScore >= 40 ? '#FBBF24'
    : '#5DAEFF';

  return (
    <div
      className={`bg-[#1A1A26] border border-[#2A2A3C] rounded-xl overflow-hidden transition-all hover:border-[#3A3A52] ${
        item.read ? 'opacity-60' : ''
      }`}
    >
      {/* Image */}
      {item.imageUrl && (
        <div className="h-32 overflow-hidden">
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="p-4 space-y-2">
        {/* Meta line */}
        <div className="flex items-center gap-2 text-[10px] text-[#55556A]">
          <Clock className="w-3 h-3" />
          <span>{age}</span>
          <div className="w-1 h-1 rounded-full bg-[#2A2A3C]" />

          {/* Importance badge */}
          <span
            className="px-1.5 py-0.5 rounded-full font-bold border"
            style={{ color: importColor, borderColor: `${importColor}30`, backgroundColor: `${importColor}08` }}
          >
            {item.importanceScore}
          </span>

          {item.saved && (
            <Bookmark className="w-3 h-3 text-[#FBBF24] ml-auto fill-current" />
          )}
        </div>

        {/* Title */}
        <h3 className={`text-sm font-semibold leading-tight ${item.read ? 'text-[#55556A]' : 'text-[#E8E8F0]'}`}>
          {item.title}
        </h3>

        {/* Summary */}
        {item.summary && (
          <p className="text-xs text-[#8888A0] line-clamp-2 leading-relaxed">
            {item.summary}
          </p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#12121A] text-[#55556A] border border-[#1E1E2E]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1">
          {!item.read && (
            <button
              onClick={() => onMarkRead(item.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[#55556A] hover:bg-[#1F1F2B] hover:text-[#8888A0] transition-colors"
            >
              <Check className="w-3 h-3" /> Read
            </button>
          )}

          <button
            onClick={() => onSave(item.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[#55556A] hover:bg-[#1F1F2B] hover:text-[#FBBF24] transition-colors"
          >
            <Bookmark className="w-3 h-3" /> Save
          </button>

          <button
            onClick={() => onConvertToQuest(item)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[#55556A] hover:bg-[#5DAEFF10] hover:text-[#5DAEFF] transition-colors"
          >
            <Swords className="w-3 h-3" /> Quest
          </button>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[#55556A] hover:bg-[#1F1F2B] hover:text-[#8888A0] transition-colors ml-auto"
            >
              <ExternalLink className="w-3 h-3" /> Open
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default NewsCard;
