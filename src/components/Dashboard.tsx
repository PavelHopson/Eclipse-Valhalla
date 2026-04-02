
import React, { useState, useEffect } from 'react';
import { Reminder, Note, ViewMode, User, NewsArticle, PlanTier } from '../types';
import { getGreetingKey, formatDate, getPriorityColor, getNextLevelXp, THEME_COLORS } from '../utils';
import { CloudSun, Clock, ArrowRight, Play, Pause, RotateCcw, Newspaper, ExternalLink, RefreshCw, Zap, Skull, WifiOff } from 'lucide-react';
import { useLanguage } from '../i18n';

interface DashboardProps {
  reminders: Reminder[];
  setView: (view: ViewMode) => void;
  user?: User | null;
}

type NewsCategory = 'general' | 'tech' | 'business' | 'science' | 'sports';

const Dashboard: React.FC<DashboardProps> = ({ reminders, setView, user }) => {
  const { language, t } = useLanguage();
  const theme = user?.theme && user.plan !== PlanTier.FREE ? THEME_COLORS[user.theme] : THEME_COLORS.blue;
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Stats
  const pendingCount = reminders.filter(r => !r.isCompleted).length;
  const completedCount = reminders.filter(r => r.isCompleted).length;
  const upcomingTasks = reminders
    .filter(r => !r.isCompleted)
    .sort((a, b) => new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime())
    .slice(0, 3);

  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  // News State
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [newsCategory, setNewsCategory] = useState<NewsCategory>('general');

  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };
  const switchMode = (m: 'focus' | 'break') => {
    setMode(m);
    setIsActive(false);
    setTimeLeft(m === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'focus'
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  // --- NEWS LOGIC ---
  const RSS_SOURCES = {
      en: {
          general: 'https://feeds.bbci.co.uk/news/rss.xml',
          tech: 'https://www.theverge.com/rss/index.xml',
          business: 'https://www.cnbc.com/id/10001147/device/rss/rss.html',
          science: 'https://www.sciencedaily.com/rss/top/science.xml',
          sports: 'https://www.espn.com/espn/rss/news'
      },
      ru: {
          general: 'https://lenta.ru/rss/top7',
          tech: 'https://habr.com/ru/rss/articles/?fl=ru',
          business: 'https://rssexport.rbc.ru/rbcnews/news/20/full.rss',
          science: 'https://postnauka.ru/feed',
          sports: 'https://www.sports.ru/rss/main.xml'
      }
  };

  useEffect(() => {
      if (!isOnline) {
          setNewsLoading(false);
          return;
      }

      const fetchNews = async () => {
          setNewsLoading(true);
          setNewsError(false);
          try {
              const langKey = language === 'ru' ? 'ru' : 'en';
              const rssUrl = RSS_SOURCES[langKey][newsCategory];
              const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
              const data = await response.json();

              if (data.status === 'ok') {
                  const articles = data.items.map((item: any) => ({
                      title: item.title,
                      link: item.link,
                      pubDate: item.pubDate,
                      content: item.description,
                      thumbnail: item.thumbnail || item.enclosure?.link || '',
                      author: item.author,
                      source: data.feed.title
                  }));
                  setNews(articles.slice(0, 6));
              } else {
                  setNewsError(true);
              }
          } catch (err) {
              setNewsError(true);
          } finally {
              setNewsLoading(false);
          }
      };
      fetchNews();
  }, [newsCategory, language, isOnline]);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col max-w-6xl mx-auto w-full overflow-y-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 animate-in slide-in-from-top-4 duration-500 flex justify-between items-start">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#E8E8F0] tracking-tight font-serif uppercase">{t(getGreetingKey())}, {user?.name || 'Warrior'}.</h1>
            <p className="text-[#55556A] mt-1 text-sm md:text-base">{t('dashboard.welcome')}</p>
        </div>
        {!isOnline && (
            <div className="bg-[#12121A] px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold text-[#55556A] animate-pulse">
                <WifiOff className="w-3 h-3" />
                Offline
            </div>
        )}
      </div>

      {/* Gamification Bar (Pro) */}
      {user && user.plan !== PlanTier.FREE && (
          <div className="mb-8 bg-[#1A1A26] p-4 rounded-sm shadow-sm border border-[#2A2A3C] flex items-center gap-4">
              <div className={`w-12 h-12 rounded-sm ${theme.light} flex items-center justify-center border border-[#2A2A3C]`}>
                  <Zap className={`w-6 h-6 ${theme.primary.replace('bg-', 'text-')}`} />
              </div>
              <div className="flex-1">
                  <div className="flex justify-between mb-1">
                      <span className="font-bold text-sm text-[#E8E8F0] uppercase tracking-wider">{t('game.level')} {user.level}</span>
                      <span className="text-xs font-mono text-[#55556A]">{user.xp} / {getNextLevelXp(user.level)} XP</span>
                  </div>
                  <div className="h-2 bg-[#12121A] rounded-none overflow-hidden">
                      <div className={`h-full ${theme.primary}`} style={{ width: `${(user.xp / getNextLevelXp(user.level)) * 100}%` }}></div>
                  </div>
              </div>
          </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">

        {/* Pomodoro Widget */}
        <div className="bg-[#1A1A26] rounded-sm shadow-sm border border-[#2A2A3C] p-6 flex flex-col relative overflow-hidden col-span-1 md:col-span-1">
           <div className="absolute top-0 left-0 w-full h-1 bg-[#12121A]">
               <div className={`h-full transition-all duration-1000 ${theme.primary}`} style={{ width: `${progress}%` }}></div>
           </div>
           <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-[#E8E8F0] flex items-center gap-2 text-sm md:text-base uppercase tracking-wider">
                   <Clock className={`w-4 h-4 ${theme.primary.replace('bg-', 'text-')}`} />
                   {t('dashboard.focus')}
               </h3>
               <div className="flex bg-[#12121A] rounded-none p-0.5">
                   <button onClick={() => switchMode('focus')} className={`text-[10px] font-bold px-2 py-1 rounded-none transition-colors ${mode === 'focus' ? `bg-[#1A1A26] text-${theme.primary.replace('bg-', 'text-')} shadow-sm` : 'text-[#55556A]'}`}>{t('dashboard.focus_btn')}</button>
                   <button onClick={() => switchMode('break')} className={`text-[10px] font-bold px-2 py-1 rounded-none transition-colors ${mode === 'break' ? 'bg-[#1A1A26] text-[#4ADE80] shadow-sm' : 'text-[#55556A]'}`}>{t('dashboard.break_btn')}</button>
               </div>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center py-2">
               <div className="text-5xl font-mono font-bold text-[#E8E8F0] tracking-tighter mb-6">
                   {formatTime(timeLeft)}
               </div>
               <div className="flex items-center gap-3">
                   <button
                    onClick={toggleTimer}
                    className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all border border-[#2A2A3C] ${isActive ? 'bg-[#12121A] text-[#55556A]' : `${theme.primary} text-[#E8E8F0] shadow-lg`}`}
                   >
                       {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                   </button>
                   <button
                    onClick={resetTimer}
                    className="w-12 h-12 rounded-sm bg-[#1A1A26] text-[#55556A] hover:bg-[#1F1F2B] flex items-center justify-center transition-all border border-[#2A2A3C]"
                   >
                       <RotateCcw className="w-5 h-5" />
                   </button>
               </div>
           </div>
        </div>

        {/* Quick Stats & Weather */}
        <div className="md:col-span-2 flex flex-col gap-4 md:gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 flex-1">
                {/* Weather (Mock) */}
                <div className={`bg-gradient-to-br ${theme.gradient} rounded-sm shadow-lg p-6 text-[#E8E8F0] flex flex-col justify-between relative overflow-hidden group min-h-[140px]`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8E8F0]/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-[#E8E8F0]/20 transition-all"></div>
                    <div>
                        <h3 className="font-semibold text-white/90 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <CloudSun className="w-4 h-4" />
                            {t('dashboard.weather')}
                        </h3>
                        <p className="mt-1 text-xs text-white/80">Midgard</p>
                    </div>
                    <div className="relative z-10 mt-4 md:mt-0">
                         <div className="text-4xl font-bold">5°C</div>
                         <div className="text-sm font-medium text-white/80 mt-1">Mist & Fog</div>
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-[#1A1A26] rounded-sm shadow-sm border border-[#2A2A3C] p-6 flex flex-col justify-between min-h-[140px]">
                    <h3 className="font-bold text-[#E8E8F0] text-sm uppercase tracking-wider">{t('dashboard.progress')}</h3>
                    <div className="flex items-end gap-2 mt-4">
                        <span className="text-4xl font-bold text-[#E8E8F0]">{completedCount}</span>
                        <span className="text-sm text-[#55556A] mb-1.5">/ {pendingCount + completedCount} {t('dashboard.tasks_count')}</span>
                    </div>
                    <div className="w-full bg-[#12121A] rounded-none h-1.5 mt-4">
                        <div
                            className="bg-[#4ADE80] h-1.5 rounded-none transition-all duration-1000"
                            style={{ width: `${(completedCount / (pendingCount + completedCount || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Upcoming Tasks Summary */}
            <div className="bg-[#1A1A26] rounded-sm shadow-sm border border-[#2A2A3C] p-6 flex-1">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-[#E8E8F0] text-sm uppercase tracking-wider flex items-center gap-2">
                        <Skull className="w-4 h-4" />
                        {t('dashboard.up_next')}
                     </h3>
                     <button onClick={() => setView('reminders')} className={`text-xs font-bold hover:underline flex items-center gap-1 ${theme.primary.replace('bg-', 'text-')}`}>
                         {t('dashboard.view_all')} <ArrowRight className="w-3 h-3" />
                     </button>
                </div>
                <div className="space-y-3">
                    {upcomingTasks.length === 0 && (
                        <div className="text-[#55556A] text-sm text-center py-2">{t('dashboard.no_tasks')}</div>
                    )}
                    {upcomingTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-[#1F1F2B] rounded-sm transition-colors border-l-2 border-transparent hover:border-[#55556A]">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority).split(' ')[1]}`}></div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-[#E8E8F0] text-sm truncate">{task.title}</h4>
                                <p className="text-xs text-[#55556A]">{formatDate(task.dueDateTime, language)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* NEWS FEED */}
      <div className="mb-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
            <div>
                <h2 className="text-xl font-bold text-[#E8E8F0] flex items-center gap-2 uppercase font-serif tracking-wider">
                    <Newspaper className="w-5 h-5 text-[#55556A]" />
                    {t('news.title')}
                </h2>
            </div>
            <div className="flex bg-[#1A1A26] p-1 rounded-sm border border-[#2A2A3C] shadow-sm overflow-x-auto max-w-full scrollbar-hide">
                {(['general', 'tech', 'business', 'science', 'sports'] as const).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setNewsCategory(cat)}
                        disabled={!isOnline}
                        className={`px-3 py-1.5 text-xs font-bold rounded-sm whitespace-nowrap transition-all ${
                            newsCategory === cat
                            ? 'bg-[#12121A] text-[#E8E8F0] shadow'
                            : 'text-[#55556A] hover:bg-[#1F1F2B]'
                        } ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {t(`news.cat_${cat}`)}
                    </button>
                ))}
            </div>
        </div>

        {!isOnline ? (
             <div className="bg-[#12121A] border border-[#2A2A3C] rounded-xl p-12 text-center flex flex-col items-center justify-center">
                 <WifiOff className="w-12 h-12 text-[#55556A] mb-4" />
                 <h3 className="text-lg font-bold text-[#8888A0]">Offline Mode</h3>
                 <p className="text-sm text-[#55556A] max-w-xs mx-auto mt-2">Ravens cannot fly in this storm. Reconnect to the world tree to receive news.</p>
             </div>
        ) : newsLoading ? (
            <div className="bg-[#1A1A26] rounded-sm p-12 text-center border border-[#2A2A3C]">
                <RefreshCw className="w-8 h-8 text-[#5DAEFF] animate-spin mx-auto mb-2" />
                <p className="text-[#55556A] text-sm">{t('news.loading')}</p>
            </div>
        ) : newsError ? (
             <div className="bg-[#FF444410] rounded-sm p-8 text-center border border-[#FF444430]">
                <p className="text-[#FF4444] text-sm font-medium">{t('news.error')}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.map((article, i) => (
                    <a
                        key={i}
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#1A1A26] rounded-sm border border-[#2A2A3C] overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full"
                    >
                        {article.thumbnail && (
                            <div className="h-32 w-full overflow-hidden relative">
                                <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale hover:grayscale-0" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-bold text-[#E8E8F0] text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#5DAEFF] transition-colors">{article.title}</h3>
                            <div className="mt-auto pt-3 flex items-center gap-1 text-xs font-bold text-[#5DAEFF] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wide">
                                {t('news.read_more')} <ExternalLink className="w-3 h-3" />
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        )}
      </div>

      <div className="mt-auto text-center mb-6 md:mb-0">
        <p className="text-sm font-medium text-[#55556A] italic font-serif">{t('dashboard.quote')}</p>
      </div>
    </div>
  );
};

export default Dashboard;
