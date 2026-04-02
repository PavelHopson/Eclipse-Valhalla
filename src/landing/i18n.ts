/**
 * Eclipse Valhalla — Landing Page i18n
 */

export type LandingLang = 'en' | 'ru';

export function detectLang(): LandingLang {
  const saved = localStorage.getItem('ev_landing_lang');
  if (saved === 'ru' || saved === 'en') return saved;
  const nav = navigator.language?.toLowerCase() || '';
  return nav.startsWith('ru') ? 'ru' : 'en';
}

export const t = (lang: LandingLang) => (key: string): string => {
  return (STRINGS[lang] as any)?.[key] || (STRINGS.en as any)?.[key] || key;
};

const STRINGS: Record<LandingLang, Record<string, string>> = {
  en: {
    // Nav
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.launch': 'Launch App',

    // Hero
    'hero.title': 'Eclipse Valhalla',
    'hero.tagline': 'The app that doesn\'t let you quit.',
    'hero.sub': 'Create a task. It follows you. Ignoring it makes it worse. Completing it earns XP. AI plans your day. You get disciplined or get punished.',
    'hero.cta': 'Try Free — No signup',
    'hero.secondary': 'See how it works',

    // Problem
    'problem.title': 'Your to-do app doesn\'t care if you fail.',
    'problem.sub': 'Eclipse Valhalla does.',
    'problem.p1': 'Tasks sit in lists forever. Nothing happens.',
    'problem.p2': 'You procrastinate. No consequences.',
    'problem.p3': 'You break streaks. Nobody notices.',
    'problem.p4': 'Your "productivity system" is a graveyard of good intentions.',

    // Solution
    'solution.title': 'Four systems. One command center.',
    'solution.valhalla.name': 'Valhalla',
    'solution.valhalla.desc': 'Quests, calendar, focus, desktop overlay widgets that enforce discipline.',
    'solution.oracle.name': 'Oracle',
    'solution.oracle.desc': 'AI that plans your day, analyzes productivity, and calls out procrastination.',
    'solution.nexus.name': 'Nexus',
    'solution.nexus.desc': 'Intelligence pipeline. RSS, Telegram, websites. AI ranking. News becomes action.',
    'solution.control.name': 'Control',
    'solution.control.desc': 'Desktop overlay. Mobile. Cross-device sync. Notifications that escalate.',

    // Demo
    'demo.title': 'Signal to action.',
    'demo.flow': 'Information → Intelligence → Decision → Quest → Execution → Progress',

    // Features
    'features.title': 'Built for control.',
    'feat.quests': 'Quest System',
    'feat.quests.d': 'Kanban, priorities, recurring objectives, smart parsing.',
    'feat.widgets': 'Overlay Widgets',
    'feat.widgets.d': 'Floating trackers. Blockers that can\'t be dismissed. Escalation on ignore.',
    'feat.oracle': 'Oracle AI',
    'feat.oracle.d': 'Day planning, task breakdown, productivity analysis. Gemini-powered.',
    'feat.nexus': 'Nexus Feed',
    'feat.nexus.d': '8-stage pipeline. RSS/Telegram/Web. AI enrichment. News-to-quest conversion.',
    'feat.gamification': 'Discipline System',
    'feat.gamification.d': 'XP, levels, streaks, discipline score. Penalties for failure.',
    'feat.sync': 'Cloud Sync',
    'feat.sync.d': 'Local-first. Supabase cloud. Conflict resolution. Cross-device.',
    'feat.desktop': 'Desktop Control',
    'feat.desktop.d': 'Electron overlay. System tray. Always-on-top. Click-through.',
    'feat.mobile': 'Mobile Ready',
    'feat.mobile.d': 'Capacitor. iOS + Android. Responsive. Push notifications.',

    // Pricing
    'pricing.title': 'Choose your path.',
    'pricing.free': 'Wanderer',
    'pricing.free.tag': 'Begin the path.',
    'pricing.free.price': 'Free',
    'pricing.pro': 'Valhalla Pro',
    'pricing.pro.tag': 'Total dominion.',
    'pricing.pro.price': '$12/mo',
    'pricing.cta.free': 'Start Free',
    'pricing.cta.pro': 'Enter Valhalla Pro',

    // CTA
    'cta.title': 'Your first quest in 30 seconds.',
    'cta.sub': 'No signup. No credit card. Create a task, watch it follow you.',
    'cta.btn': 'Start Free Now',

    // Footer
    'footer.copy': '© 2025 Eclipse Valhalla',
    'footer.built': 'Built with controlled fury.',
  },
  ru: {
    'nav.features': 'Возможности',
    'nav.pricing': 'Тарифы',
    'nav.launch': 'Открыть',

    'hero.title': 'Eclipse Valhalla',
    'hero.tagline': 'Приложение, которое не даёт тебе сдаться.',
    'hero.sub': 'Создай задачу. Она следует за тобой. Игнорирование делает хуже. Выполнение даёт XP. AI планирует день. Ты становишься дисциплинированным — или получаешь штраф.',
    'hero.cta': 'Попробовать бесплатно',
    'hero.secondary': 'Как это работает',

    'problem.title': 'Твоему списку задач плевать, если ты провалишься.',
    'problem.sub': 'Eclipse Valhalla — нет.',
    'problem.p1': 'Задачи лежат в списках вечно. Ничего не происходит.',
    'problem.p2': 'Ты прокрастинируешь. Без последствий.',
    'problem.p3': 'Ты ломаешь стрики. Никто не замечает.',
    'problem.p4': 'Твоя «система продуктивности» — кладбище добрых намерений.',

    'solution.title': 'Четыре системы. Один командный центр.',
    'solution.valhalla.name': 'Valhalla',
    'solution.valhalla.desc': 'Квесты, календарь, фокус, виджеты поверх рабочего стола, которые заставляют действовать.',
    'solution.oracle.name': 'Oracle',
    'solution.oracle.desc': 'AI, который планирует день, анализирует результаты и указывает на прокрастинацию.',
    'solution.nexus.name': 'Nexus',
    'solution.nexus.desc': 'Конвейер разведки. RSS, Telegram, сайты. AI-ранжирование. Новости становятся действиями.',
    'solution.control.name': 'Control',
    'solution.control.desc': 'Оверлей на рабочем столе. Мобильное приложение. Синхронизация. Уведомления с эскалацией.',

    'demo.title': 'От сигнала к действию.',
    'demo.flow': 'Информация → Разведка → Решение → Квест → Действие → Прогресс',

    'features.title': 'Создано для контроля.',
    'feat.quests': 'Система квестов',
    'feat.quests.d': 'Канбан, приоритеты, повторяющиеся цели, умный парсинг.',
    'feat.widgets': 'Виджеты-оверлеи',
    'feat.widgets.d': 'Плавающие трекеры. Блокеры, которые нельзя закрыть. Эскалация при игнорировании.',
    'feat.oracle': 'Oracle AI',
    'feat.oracle.d': 'Планирование дня, разбор задач, анализ продуктивности. На базе Gemini.',
    'feat.nexus': 'Nexus Feed',
    'feat.nexus.d': '8-стадийный конвейер. RSS/Telegram/Web. AI-обогащение. Новость → квест.',
    'feat.gamification': 'Система дисциплины',
    'feat.gamification.d': 'XP, уровни, стрики, оценка дисциплины. Штрафы за провалы.',
    'feat.sync': 'Облачная синхронизация',
    'feat.sync.d': 'Сначала локально. Облако Supabase. Разрешение конфликтов. Между устройствами.',
    'feat.desktop': 'Контроль рабочего стола',
    'feat.desktop.d': 'Electron-оверлей. Системный трей. Поверх всех окон. Прозрачность.',
    'feat.mobile': 'Мобильная версия',
    'feat.mobile.d': 'Capacitor. iOS + Android. Адаптивный дизайн. Push-уведомления.',

    'pricing.title': 'Выбери свой путь.',
    'pricing.free': 'Странник',
    'pricing.free.tag': 'Начало пути.',
    'pricing.free.price': 'Бесплатно',
    'pricing.pro': 'Valhalla Pro',
    'pricing.pro.tag': 'Полное господство.',
    'pricing.pro.price': '$12/мес',
    'pricing.cta.free': 'Начать бесплатно',
    'pricing.cta.pro': 'Войти в Valhalla Pro',

    'cta.title': 'Твой первый квест за 30 секунд.',
    'cta.sub': 'Без регистрации. Без карты. Создай задачу — она начнёт тебя преследовать.',
    'cta.btn': 'Начать бесплатно',

    'footer.copy': '© 2025 Eclipse Valhalla',
    'footer.built': 'Создано с контролируемой яростью.',
  },
};
