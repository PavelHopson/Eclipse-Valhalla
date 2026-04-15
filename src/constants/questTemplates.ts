import type { Priority, Category, RepeatType } from '../types';

export interface QuestTemplate {
  id: string;
  title: string;
  desc: string;
  priority: Priority | string;
  category: Category | string;
  repeat: RepeatType | string;
}

export const QUEST_TEMPLATES_STORAGE_KEY = 'eclipse_quest_templates';

export function buildDefaultQuestTemplates(isRussian: boolean): QuestTemplate[] {
  return [
    {
      id: 'tmpl_morning',
      title: isRussian ? 'Утренняя рутина' : 'Morning Routine',
      desc: isRussian ? 'Зарядка, душ, завтрак' : 'Exercise, shower, breakfast',
      priority: 'Medium',
      category: 'Health',
      repeat: 'daily',
    },
    {
      id: 'tmpl_workout',
      title: isRussian ? 'Тренировка' : 'Workout',
      desc: '',
      priority: 'High',
      category: 'Health',
      repeat: 'none',
    },
    {
      id: 'tmpl_read',
      title: isRussian ? 'Чтение 30 минут' : 'Read 30 minutes',
      desc: isRussian ? 'Книга или статьи по специальности' : 'Book or professional articles',
      priority: 'Low',
      category: 'Education',
      repeat: 'daily',
    },
    {
      id: 'tmpl_water',
      title: isRussian ? 'Выпить 2л воды' : 'Drink 2L water',
      desc: '',
      priority: 'Medium',
      category: 'Health',
      repeat: 'daily',
    },
    {
      id: 'tmpl_report',
      title: isRussian ? 'Отчёт по работе' : 'Work report',
      desc: '',
      priority: 'High',
      category: 'Work',
      repeat: 'weekly',
    },
    {
      id: 'tmpl_clean',
      title: isRussian ? 'Уборка' : 'Cleaning',
      desc: '',
      priority: 'Low',
      category: 'Personal',
      repeat: 'weekly',
    },
    {
      id: 'tmpl_plan',
      title: isRussian ? 'Планирование недели' : 'Weekly planning',
      desc: isRussian ? 'Цели, приоритеты, дедлайны' : 'Goals, priorities, deadlines',
      priority: 'High',
      category: 'Work',
      repeat: 'weekly',
    },
    {
      id: 'tmpl_budget',
      title: isRussian ? 'Проверить бюджет' : 'Check budget',
      desc: '',
      priority: 'Medium',
      category: 'Finance',
      repeat: 'monthly',
    },
  ];
}

export function loadQuestTemplates(defaults: QuestTemplate[]): QuestTemplate[] {
  try {
    const saved = JSON.parse(localStorage.getItem(QUEST_TEMPLATES_STORAGE_KEY) || '[]');
    return saved.length > 0 ? saved : defaults;
  } catch {
    return defaults;
  }
}
