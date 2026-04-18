# Career Quest — модуль автоматизации карьерного трека

> Концепт модуля для Eclipse Valhalla. Превращает поиск работы / рост внутри
> компании в игровой трек с квестами, XP и тайм-трекингом.
> Вдохновлён проектом [job-ops](https://github.com/DaKheera47/job-ops).

**Статус:** 📋 Концепт, planned for v5.0
**Размер:** ~2 недели разработки (1 спринт)
**Приоритет:** Medium — нишевый, но высоко-ценный для активных соискателей

---

## Зачем

Valhalla уже закрывает дисциплину, тренировки, фокус. Career Quest закрывает
следующий слой — **профессиональный рост**. Это самый высокий уровень
"дисциплины актива": человек сам инвестирует в свою карьеру по расписанию,
не откладывая.

Продуктовый тезис: *"превратить хаотичный поиск работы в структурированный
квест-трек с измеримым прогрессом"*.

---

## MVP scope (V1)

### 1. Quest templates — типы карьерных квестов

| Тип | Пример | XP | Интервал |
|---|---|---:|---|
| `apply-3` | Подать резюме на 3 вакансии | 50 | daily |
| `interview-prep` | Подготовиться к интервью (LeetCode / STAR) | 30 | on-demand |
| `interview-done` | Пройти собеседование | 100 | on-trigger |
| `cv-update` | Обновить CV под конкретную вакансию | 20 | per apply |
| `learn-hour` | 1 час обучения (курс / книга / документация) | 25 | daily |
| `network-reach` | Написать одному рекрутёру / hiring-менеджеру | 15 | daily |
| `project-commit` | Коммит в pet-project для портфолио | 20 | daily |
| `reflect` | Записать саммари недели поиска | 40 | weekly |

### 2. Новая вкладка `/career` в навигации

- Список активных карьерных квестов с прогрессом
- Счётчик: *"заявок подано на этой неделе"*, *"собеседований запланировано"*,
  *"офферов получено"*
- Кнопка "New Application" → быстрый ввод (компания, позиция, зарплата, ссылка)
- История всех поданных заявок в таблице со статусами

### 3. Application tracker

Структура записи:
```ts
interface Application {
  id: string;
  company: string;
  position: string;
  source: 'linkedin' | 'hh.ru' | 'referral' | 'direct' | 'other';
  salary?: { min: number; max: number; currency: string };
  status: 'applied' | 'hr-screen' | 'tech-screen' | 'onsite' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt: number;
  nextStepAt?: number;
  notes: string;
  cvVersion?: string;
}
```

Pipeline kanban: *Applied → HR → Tech → Onsite → Offer/Rejected*
Drag-n-drop между колонками, XP начисляется при переходе в следующий этап.

### 4. Streaks & anti-burnout (используем существующие системы)

- "Applied streak" — количество дней подряд с хотя бы одной поданной заявкой.
  Рвётся если пропуск > 1 день (даёт паузу на выходные).
- "Interview streak" — количество недель с хотя бы одним собеседованием.
- Anti-burnout: если больше 5 rejected подряд → Oracle предлагает
  *"пересмотреть стратегию"*, генерит чеклист (CV, резюме, навыки, подход).

---

## V2 — integrations

### AI-powered (через существующий aiService)
- **CV tailoring** — дать URL вакансии → AI перепишет твоё CV под требования
  (используем уже подключённый Gemini / Claude / GPT / Ollama)
- **Rejection analysis** — суммаризировать причины отказов, предложить
  навыки для прокачки
- **Interview simulation** — чат-режим, AI играет роль интервьюера по
  конкретной вакансии и компании

### Browser automation (Electron-only)
- Puppeteer-скрипт, который открывает сайты (hh.ru, LinkedIn) и
  **помогает** заполнить форму отклика (не автоподача — пользователь
  контролирует submit, ассистент экономит клики)
- Экспорт всех заявок в CSV / Notion / Google Sheets

### Notifications
- Push "пора готовиться" за 1 час до интервью
- Weekly digest в пятницу: *"эта неделя: 7 заявок, 2 интервью, 0 офферов"*
- Streak broken alert как у обычных квестов

---

## Техническая архитектура

### Новые файлы
```
src/
├── services/
│   └── careerService.ts          # Applications CRUD, stats
├── views/
│   ├── CareerView.tsx            # Главный экран
│   ├── ApplicationKanban.tsx     # Kanban pipeline
│   └── ApplicationForm.tsx       # Быстрый ввод заявки
├── components/
│   ├── CareerStats.tsx           # Счётчики недели/месяца
│   └── ApplicationCard.tsx       # Карточка заявки в kanban
└── store/
    └── careerStore.ts            # Zustand slice для applications
```

### Схема данных
- Локально: IndexedDB (через существующую storageService)
- Облако (Pro-tier): Supabase table `applications` + Realtime sync между устройствами
- Экспорт: JSON / CSV / Notion API

### Интеграция с существующими системами
- **Gamification** — `careerService.awardXP(userId, questType, amount)` → уже
  существующий `progressionService`
- **Achievements** — новые ачивки:
  - "First Application" — первая поданная заявка
  - "Serial Applier" — 50 заявок за месяц
  - "Interview Champion" — 10 пройденных интервью
  - "Offer Magnet" — 3 оффера одновременно
  - "Career Pivot" — поменял специализацию (сменил тэг позиции)
- **Oracle** — уже существующий AI-ассистент получает новый prompt-контекст:
  `{ applications: [...], streaks: {...}, blockers: [...] }`

---

## Why shipping this

1. **Rarely-shipped feature** — немногие todo / habit-трекеры имеют полноценный
   ATS (applicant tracking system) внутри. Это отличительная черта.
2. **High engagement window** — активные соискатели используют такой трекер
   каждый день 2-3 раза → retention × 3
3. **B2C + B2B потенциал** — эту же функциональность можно адаптировать для
   HR-команд (отслеживать кандидатов → уже другой продукт, но same codebase)
4. **AI-native fit** — все существующие 6 AI-провайдеров Valhalla сразу
   используются для CV-rewrite, interview-prep, rejection-analysis

---

## Not in scope (yet)

- ❌ Автоподача резюме без подтверждения пользователя (этические риски + ToS hh.ru/LinkedIn)
- ❌ Скрейпинг вакансий с сайтов (может нарушать ToS, использовать официальные API)
- ❌ Salary negotiation assistant — слишком чувствительная область для V1
- ❌ Referral tracking с денежными выплатами — отдельный legal слой

---

## Open questions

- Free vs Pro? Vanilla tracker — free. AI-фичи (CV rewrite, interview sim) — Pro.
- Импорт из LinkedIn export? Возможно но потребует CSV parser.
- Multi-role search? Человек может искать 2 роли параллельно (backend + devops).
  В V1 — один общий pipeline, в V2 — tagging применений.

---

## Ссылки

- [job-ops](https://github.com/DaKheera47/job-ops) — вдохновение (OSS CV-автоматизация)
- [Huntr](https://huntr.co/) — commercial reference ($19/mo)
- [Teal](https://www.tealhq.com/) — Chrome extension approach
- Существующие Valhalla модули: [`docs/INTELLIGENCE_ENGINE.md`](./INTELLIGENCE_ENGINE.md), [`docs/GROWTH.md`](./GROWTH.md)
