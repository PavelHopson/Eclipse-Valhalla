import React from 'react';
import { NewsItem } from '../news';
import { Bookmark, Swords, Check, Clock, Signal, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n';

interface NewsCardProps {
  item: NewsItem;
  onMarkRead: (id: string) => void;
  onSave: (id: string) => void;
  onConvertToQuest: (item: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, onMarkRead, onSave, onConvertToQuest }) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const age = getTimeAgo(item.publishedAt);
  const signalColor = item.importanceScore >= 70 ? '#A33036' : item.importanceScore >= 40 ? '#B89B5E' : '#6C8FB8';
  const signalLabel = item.importanceScore >= 70 ? (isRu ? 'Критический сигнал' : 'Critical signal') : item.importanceScore >= 40 ? (isRu ? 'Высокий сигнал' : 'High signal') : (isRu ? 'Сигнал' : 'Signal');

  return (
    <article className={`group overflow-hidden rounded-[24px] border bg-[#121212]/94 transition-all hover:-translate-y-1 ${
      item.read ? 'border-white/6 opacity-70' : 'border-[#6C8FB822] hover:border-[#6C8FB838]'
    }`}>
      {item.imageUrl && (
        <div className="relative h-40 overflow-hidden border-b border-white/8">
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        </div>
      )}

      <div className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#7F7A72]">
          <Clock className="h-3.5 w-3.5" />
          <span>{age}</span>
          <span className="text-white/20">/</span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold" style={{ color: signalColor, borderColor: `${signalColor}33`, backgroundColor: `${signalColor}12` }}>
            <Signal className="h-3 w-3" />
            {signalLabel}
          </span>
          {item.saved && <Bookmark className="ml-auto h-3.5 w-3.5 fill-current text-[#B89B5E]" />}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#7F7A72]">{item.category || (isRu ? 'Источник' : 'Signal source')}</div>
          <h3 className={`mt-2 text-lg font-bold leading-tight ${item.read ? 'text-[#B4B0A7]' : 'text-[#F2F1EE]'}`}>{item.title}</h3>
        </div>

        {item.summary && (
          <p className="text-sm leading-6 text-[#B4B0A7] line-clamp-3">
            {item.summary}
          </p>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="rounded-full border border-white/8 bg-[#171717] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7F7A72]">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          {!item.read ? (
            <button
              onClick={() => { onMarkRead(item.id); import('../services/achievementService').then(({ trackEvent }) => { trackEvent('news_read'); }).catch(() => {}); }}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/8 bg-[#171717] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#B4B0A7] transition-colors hover:text-[#F2F1EE]"
            >
              <Check className="h-3.5 w-3.5" />
              {isRu ? 'Прочитано' : 'Mark read'}
            </button>
          ) : (
            <button
              onClick={() => onSave(item.id)}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/8 bg-[#171717] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#B4B0A7] transition-colors hover:text-[#F2F1EE]"
            >
              <Bookmark className="h-3.5 w-3.5" />
              {isRu ? 'Сохранить' : 'Save signal'}
            </button>
          )}

          <button
            onClick={() => onConvertToQuest(item)}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#6C8FB833] bg-[#6C8FB8] px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A] transition-all hover:bg-[#7C9FC7]"
          >
            <Swords className="h-3.5 w-3.5" />
            {isRu ? 'В квест' : 'Convert to quest'}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onSave(item.id)}
            className="text-[11px] font-semibold text-[#7F7A72] transition-colors hover:text-[#D8C18E]"
          >
            {item.saved ? (isRu ? 'В резерве' : 'Stored in reserve') : (isRu ? 'В резерв' : 'Store signal')}
          </button>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B4B0A7] transition-colors hover:text-[#F2F1EE]"
            >
              {isRu ? 'Источник' : 'Open source'}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default NewsCard;
