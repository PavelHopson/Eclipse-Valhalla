/**
 * Eclipse Valhalla — Onboarding Tips & Feature Guide
 *
 * Two exports:
 *   <OnboardingTip section="dashboard" />  — floating contextual tooltip (shows once per section)
 *   <FeatureGuide isOpen={bool} onClose={fn} /> — full feature guide modal
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, Zap, Brain, Dumbbell, Rss, Trophy, Settings, Target, Image, AudioLines, Upload, Download, Keyboard, Rocket, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n';

// ═══════════════════════════════════════════
// TYPES & CONFIG
// ═══════════════════════════════════════════

const STORAGE_KEY = 'eclipse_dismissed_tips';

interface TipConfig {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  icon: string;
}

const TIPS: TipConfig[] = [
  {
    id: 'dashboard',
    title: 'Command Loop',
    titleRu: 'Командный контур',
    description: 'This is your command center. Add quests, track streaks, enter focus mode.',
    descriptionRu: 'Это твой командный центр. Добавляй квесты, отслеживай серии, входи в режим фокуса.',
    icon: '🏠',
  },
  {
    id: 'reminders',
    title: 'Quest Log',
    titleRu: 'Книга Походов',
    description: 'Create tasks with priorities and deadlines. Use the AI input to parse natural language commands.',
    descriptionRu: 'Создавай задачи с приоритетами и дедлайнами. Используй AI-ввод для команд на естественном языке.',
    icon: '⚔️',
  },
  {
    id: 'workouts',
    title: 'Training Ground',
    titleRu: 'Полигон',
    description: 'Build training programs, assign to weekdays, attach workout videos. Track sets, reps and personal records.',
    descriptionRu: 'Создавай программы тренировок, назначай на дни недели, прикрепляй видео. Отслеживай подходы, повторения и рекорды.',
    icon: '🏋️',
  },
  {
    id: 'oracle',
    title: 'The Oracle',
    titleRu: 'Оракул',
    description: 'AI assistant powered by Gemini, OpenAI or Anthropic. Plan your day, get advice, brainstorm ideas.',
    descriptionRu: 'AI-ассистент на базе Gemini, OpenAI или Anthropic. Планируй день, получай советы, генерируй идеи.',
    icon: '🔮',
  },
  {
    id: 'nexus',
    title: 'Intelligence Feed',
    titleRu: 'Лента Нексус',
    description: 'Add RSS feeds and news sources. AI ranks and enriches articles for you.',
    descriptionRu: 'Добавляй RSS-ленты и источники новостей. AI ранжирует и обогащает статьи.',
    icon: '📡',
  },
  {
    id: 'achievements',
    title: 'Hall of Glory',
    titleRu: 'Зал Славы',
    description: '31 achievements across 5 categories. Complete quests, maintain streaks, use features to unlock rewards.',
    descriptionRu: '31 достижение в 5 категориях. Выполняй квесты, держи серии, используй функции для открытия наград.',
    icon: '🏆',
  },
  {
    id: 'settings',
    title: 'Settings',
    titleRu: 'Настройки',
    description: 'Configure AI providers, export data, change language, customize appearance.',
    descriptionRu: 'Настрой AI-провайдеров, экспортируй данные, меняй язык, настраивай внешний вид.',
    icon: '⚙️',
  },
  {
    id: 'focus',
    title: 'Focus Mode',
    titleRu: 'Режим фокуса',
    description: 'Deep work timer. No switching, no distractions. Complete one objective at a time.',
    descriptionRu: 'Таймер глубокой работы. Без переключений, без отвлечений. Выполняй одну цель за раз.',
    icon: '🎯',
  },
];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function getDismissedTips(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function dismissTip(id: string): void {
  const dismissed = getDismissedTips();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
  }
}

// ═══════════════════════════════════════════
// ONBOARDING TIP — floating contextual tooltip
// ═══════════════════════════════════════════

interface OnboardingTipProps {
  section: string;
}

export const OnboardingTip: React.FC<OnboardingTipProps> = ({ section }) => {
  const { language } = useLanguage();
  const isRU = language === 'ru';

  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  const tip = TIPS.find(t => t.id === section);

  useEffect(() => {
    if (!tip) return;
    const dismissed = getDismissedTips();
    if (!dismissed.includes(tip.id)) {
      // Small delay so content renders first
      const timer = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => setAnimate(true));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [tip]);

  const handleDismiss = useCallback(() => {
    if (!tip) return;
    setAnimate(false);
    setTimeout(() => {
      setVisible(false);
      dismissTip(tip.id);
    }, 300);
  }, [tip]);

  if (!visible || !tip) return null;

  return (
    <div
      className="relative z-40 mx-4 mb-3 md:mx-6"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#5DAEFF20] bg-[#0C0C14]/95 backdrop-blur-xl shadow-[0_8px_40px_rgba(93,174,255,0.08)]">
        {/* Accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5DAEFF] via-[#5DAEFF80] to-transparent" />

        <div className="flex items-start gap-3.5 p-4">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#5DAEFF18] bg-[#5DAEFF08] text-lg">
            {tip.icon}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-bold text-[#F2F1EE] leading-tight">
              {isRU ? tip.titleRu : tip.title}
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-[#8888A0]">
              {isRU ? tip.descriptionRu : tip.description}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-lg border border-[#5DAEFF30] bg-[#5DAEFF10] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5DAEFF] transition-all hover:bg-[#5DAEFF20] hover:border-[#5DAEFF50]"
          >
            {isRU ? 'Понятно' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// FEATURE GUIDE — full modal
// ═══════════════════════════════════════════

interface FeatureGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSection {
  title: string;
  titleRu: string;
  items: GuideItem[];
}

interface GuideItem {
  icon: React.ReactNode;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  shortcut?: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: 'Getting Started',
    titleRu: 'Начало работы',
    items: [
      {
        icon: <Rocket className="w-4 h-4" />,
        title: 'Create your first quest',
        titleRu: 'Создай первый квест',
        description: 'Type an objective in the command input on the dashboard and press Enter. It auto-enters Focus Mode.',
        descriptionRu: 'Введи цель в поле ввода на главном экране и нажми Enter. Автоматически запустится режим фокуса.',
      },
      {
        icon: <Brain className="w-4 h-4" />,
        title: 'Configure AI',
        titleRu: 'Настрой AI',
        description: 'Go to Settings and add your Gemini, OpenAI, or Anthropic API key to unlock the Oracle and smart features.',
        descriptionRu: 'Перейди в Настройки и добавь ключ Gemini, OpenAI или Anthropic для доступа к Оракулу и умным функциям.',
      },
    ],
  },
  {
    title: 'Core Features',
    titleRu: 'Основные функции',
    items: [
      {
        icon: <Zap className="w-4 h-4" />,
        title: 'Dashboard',
        titleRu: 'Главная',
        description: 'Your command center. See active quests, discipline score, streak counter, and quick-create new objectives.',
        descriptionRu: 'Твой командный центр. Активные квесты, шкала дисциплины, счётчик серий и быстрое создание целей.',
      },
      {
        icon: <Target className="w-4 h-4" />,
        title: 'Focus Mode',
        titleRu: 'Режим фокуса',
        description: 'Click any quest to enter full-screen Focus Mode. Timer, no distractions, complete one objective at a time.',
        descriptionRu: 'Нажми на любой квест для полноэкранного фокуса. Таймер, без отвлечений, одна цель за раз.',
      },
    ],
  },
  {
    title: 'Training',
    titleRu: 'Тренировки',
    items: [
      {
        icon: <Dumbbell className="w-4 h-4" />,
        title: 'Workout Programs',
        titleRu: 'Программы тренировок',
        description: 'Create custom programs, assign exercises to weekdays, attach video links. Log sets, reps, and weight.',
        descriptionRu: 'Создавай программы, назначай упражнения по дням, прикрепляй видео. Записывай подходы, повторения и вес.',
      },
    ],
  },
  {
    title: 'AI Tools',
    titleRu: 'AI-инструменты',
    items: [
      {
        icon: <Sparkles className="w-4 h-4" />,
        title: 'Oracle Chat',
        titleRu: 'Чат с Оракулом',
        description: 'AI assistant for planning, advice, and brainstorming. Supports Gemini, OpenAI, and Anthropic.',
        descriptionRu: 'AI-ассистент для планирования, советов и мозгового штурма. Поддержка Gemini, OpenAI, Anthropic.',
      },
      {
        icon: <Image className="w-4 h-4" />,
        title: 'Image Forge',
        titleRu: 'Кузница образов',
        description: 'Generate images with AI. Describe what you want and let the model create it.',
        descriptionRu: 'Генерируй изображения с помощью AI. Опиши, что хочешь, и модель создаст это.',
      },
      {
        icon: <AudioLines className="w-4 h-4" />,
        title: 'Voice TTS',
        titleRu: 'Голосовой TTS',
        description: 'Text-to-speech powered by AI. Convert text to natural-sounding voice.',
        descriptionRu: 'Озвучка текста с помощью AI. Конвертируй текст в естественную речь.',
      },
    ],
  },
  {
    title: 'Intelligence',
    titleRu: 'Разведка',
    items: [
      {
        icon: <Rss className="w-4 h-4" />,
        title: 'Nexus Feed',
        titleRu: 'Лента Нексус',
        description: 'Add RSS feeds and news sources. AI ranks articles by relevance and enriches them with summaries.',
        descriptionRu: 'Добавляй RSS и источники новостей. AI ранжирует статьи по релевантности и добавляет саммари.',
      },
    ],
  },
  {
    title: 'Gamification',
    titleRu: 'Геймификация',
    items: [
      {
        icon: <Trophy className="w-4 h-4" />,
        title: 'Achievements & XP',
        titleRu: 'Достижения и XP',
        description: '31 achievements across 5 categories. Earn XP for completing quests, maintaining streaks, and using features. Level up your rank.',
        descriptionRu: '31 достижение в 5 категориях. Получай XP за квесты, серии и использование функций. Повышай свой ранг.',
      },
    ],
  },
  {
    title: 'Data',
    titleRu: 'Данные',
    items: [
      {
        icon: <Download className="w-4 h-4" />,
        title: 'Export',
        titleRu: 'Экспорт',
        description: 'Export all your quests, notes, routines, and settings as a JSON backup file.',
        descriptionRu: 'Экспортируй все квесты, заметки, программы и настройки в JSON-файл.',
      },
      {
        icon: <Upload className="w-4 h-4" />,
        title: 'Import',
        titleRu: 'Импорт',
        description: 'Import a previously exported backup to restore your data.',
        descriptionRu: 'Импортируй ранее сохранённый бэкап для восстановления данных.',
      },
    ],
  },
  {
    title: 'Shortcuts',
    titleRu: 'Клавиши',
    items: [
      {
        icon: <Keyboard className="w-4 h-4" />,
        title: 'Global Search',
        titleRu: 'Глобальный поиск',
        description: 'Press to open search across all quests, notes, and sections.',
        descriptionRu: 'Нажми для поиска по всем квестам, заметкам и разделам.',
        shortcut: 'Ctrl+K',
      },
      {
        icon: <Keyboard className="w-4 h-4" />,
        title: 'Close / Cancel',
        titleRu: 'Закрыть / Отменить',
        description: 'Close any open modal, search overlay, or cancel an action.',
        descriptionRu: 'Закрыть модальное окно, поиск или отменить действие.',
        shortcut: 'Esc',
      },
    ],
  },
];

export const FeatureGuide: React.FC<FeatureGuideProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isRU = language === 'ru';
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setAnimate(true));
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#050508]/85 backdrop-blur-sm"
        onClick={onClose}
        style={{
          opacity: animate ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] mx-4 flex flex-col overflow-hidden rounded-2xl border border-[#1E1E2E] bg-[#0A0A0F]/98 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(12px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E2E] px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#5DAEFF20] bg-[#5DAEFF08]">
              <BookOpen className="w-4 h-4 text-[#5DAEFF]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#F2F1EE]">
                {isRU ? 'Руководство по функциям' : 'Feature Guide'}
              </h2>
              <p className="text-[10px] text-[#55556A] uppercase tracking-[0.2em] font-semibold">
                Eclipse Valhalla
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E1E2E] bg-[#12121A] text-[#55556A] transition-all hover:border-[#2A2A3C] hover:text-[#8888A0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
          {GUIDE_SECTIONS.map((section) => (
            <div key={section.title}>
              {/* Section title */}
              <div className="mb-3 flex items-center gap-2">
                <div className="h-[1px] w-3 bg-[#5DAEFF40]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5DAEFF80]">
                  {isRU ? section.titleRu : section.title}
                </span>
                <div className="h-[1px] flex-1 bg-[#1E1E2E]" />
              </div>

              {/* Items */}
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="group flex items-start gap-3 rounded-xl border border-[#1E1E2E] bg-[#0C0C14]/60 p-3.5 transition-all hover:border-[#2A2A3C] hover:bg-[#12121A]/80"
                  >
                    {/* Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#1E1E2E] bg-[#0A0A0F] text-[#8888A0] group-hover:text-[#B4B0A7] transition-colors">
                      {item.icon}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-semibold text-[#F2F1EE]">
                          {isRU ? item.titleRu : item.title}
                        </h4>
                        {item.shortcut && (
                          <span className="rounded border border-[#1E1E2E] bg-[#0A0A0F] px-1.5 py-0.5 text-[9px] font-mono text-[#55556A]">
                            {item.shortcut}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#8888A0]">
                        {isRU ? item.descriptionRu : item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[#1E1E2E] px-6 py-3.5 shrink-0 flex items-center justify-between">
          <p className="text-[10px] text-[#3A3A4A]">
            {isRU ? 'Подсказки можно сбросить в настройках' : 'Tips can be reset in settings'}
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#5DAEFF] px-5 py-2 text-[12px] font-bold text-[#0A0A0F] transition-all hover:bg-[#6DB8FF] shadow-[0_0_20px_rgba(93,174,255,0.15)]"
          >
            {isRU ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTip;
