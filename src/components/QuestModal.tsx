import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { X } from 'lucide-react';
import { Category, Priority, Reminder, RepeatType } from '../types';
import type { QuestTemplate } from '../constants/questTemplates';

export interface QuestModalData {
  title: string;
  desc: string;
  date: string;
  repeat: RepeatType;
  priority: Priority;
  category: Category;
  subtasks: { id: string; title: string; isCompleted: boolean }[];
  estimatedMinutes: number;
  tags: string[];
  project: string;
}

interface QuestModalProps {
  isOpen: boolean;
  editingId: string | null;
  modalData: QuestModalData;
  setModalData: Dispatch<SetStateAction<QuestModalData>>;
  questTemplates: QuestTemplate[];
  setQuestTemplates: Dispatch<SetStateAction<QuestTemplate[]>>;
  defaultQuestTemplates: QuestTemplate[];
  reminders: Reminder[];
  onSave: (partial: Partial<Reminder>) => void;
  onClose: () => void;
  isRussian: boolean;
  language: string;
}

export function QuestModal(props: QuestModalProps): React.ReactElement | null {
  const {
    isOpen,
    editingId,
    modalData,
    setModalData,
    questTemplates,
    setQuestTemplates,
    defaultQuestTemplates,
    reminders,
    onSave,
    onClose,
    isRussian,
    language,
  } = props;

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: QuestTemplate) => {
    setModalData((prev) => ({
      ...prev,
      title: tmpl.title,
      desc: tmpl.desc || '',
      priority: tmpl.priority as Priority,
      category: tmpl.category as Category,
      repeat: tmpl.repeat as RepeatType,
    }));
  };

  const handleResetTemplates = () => setQuestTemplates(defaultQuestTemplates);

  const handleAddSubtask = () => {
    const newSub = { id: `sub_${Date.now()}`, title: '', isCompleted: false };
    setModalData((p) => ({ ...p, subtasks: [...(p.subtasks || []), newSub] }));
  };

  const handleUpdateSubtaskTitle = (index: number, title: string) => {
    const updated = [...(modalData.subtasks || [])];
    updated[index] = { ...updated[index], title };
    setModalData((p) => ({ ...p, subtasks: updated }));
  };

  const handleRemoveSubtask = (index: number) => {
    const updated = (modalData.subtasks || []).filter((_, j) => j !== index);
    setModalData((p) => ({ ...p, subtasks: updated }));
  };

  const handleAddTag = (rawValue: string, input: HTMLInputElement) => {
    const val = rawValue.trim().replace('#', '');
    if (val && !(modalData.tags || []).includes(val)) {
      setModalData((p) => ({ ...p, tags: [...(p.tags || []), val] }));
      input.value = '';
    }
  };

  const handleRemoveTag = (index: number) => {
    setModalData((p) => ({
      ...p,
      tags: (p.tags || []).filter((_, j) => j !== index),
    }));
  };

  const handleSaveAsTemplate = () => {
    if (!modalData.title) return;
    const template: QuestTemplate = {
      id: `tmpl_${Date.now()}`,
      title: modalData.title,
      desc: modalData.desc,
      priority: modalData.priority,
      category: modalData.category,
      repeat: modalData.repeat,
    };
    setQuestTemplates((prev) => [...prev, template]);
  };

  const handleSave = () => {
    onSave({
      id: editingId || undefined,
      title: modalData.title,
      description: modalData.desc,
      dueDateTime: modalData.date,
      priority: modalData.priority,
      category: modalData.category,
      repeatType: modalData.repeat || RepeatType.NONE,
      subtasks: modalData.subtasks?.filter((s) => s.title.trim()),
      estimatedMinutes: modalData.estimatedMinutes || undefined,
      tags: modalData.tags?.filter((t) => t.trim()),
      project: modalData.project?.trim() || undefined,
    } as Partial<Reminder>);
  };

  const existingProjects = Array.from(
    new Set(
      reminders
        .map((r) => (r as unknown as { project?: string }).project)
        .filter((p): p is string => !!p),
    ),
  );

  return (
    <div key="reminder-modal" className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-[#050508]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-[#12121A] border border-[#2A2A3C] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#1E1E2E] flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#EAEAF2]">
            {editingId
              ? isRussian
                ? 'Редактировать'
                : 'Edit Quest'
              : isRussian
                ? 'Новый квест'
                : 'New Quest'}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-[#55556A]" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {questTemplates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#55556A]">
                  {isRussian ? 'Шаблоны' : 'Templates'}
                </label>
                <button
                  type="button"
                  onClick={handleResetTemplates}
                  className="text-[9px] font-bold text-[#3A3A4A] hover:text-[#55556A] transition-colors uppercase tracking-wider"
                >
                  {isRussian ? 'Сбросить' : 'Reset'}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {questTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#5DAEFF] bg-[#5DAEFF10] border border-[#5DAEFF20] hover:bg-[#5DAEFF15] transition-colors"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            value={modalData.title}
            onChange={(e) => setModalData((p) => ({ ...p, title: e.target.value }))}
            placeholder={isRussian ? 'Цель квеста...' : 'Quest objective...'}
            autoFocus
            onFocus={(e) => {
              e.target.style.borderColor = '#5DAEFF40';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#2A2A3C';
            }}
            className="w-full px-4 py-3 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-[#EAEAF2] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF40]"
          />

          <textarea
            value={modalData.desc}
            onChange={(e) => setModalData((p) => ({ ...p, desc: e.target.value }))}
            placeholder={isRussian ? 'Детали...' : 'Details...'}
            className="w-full px-4 py-3 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] h-20 text-sm text-[#8888A0] placeholder-[#3A3A4A] outline-none resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                {language === 'ru' ? 'Дата и время' : 'Date & Time'}
              </label>
              <input
                type="datetime-local"
                value={modalData.date}
                onChange={(e) => setModalData((p) => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                {language === 'ru' ? 'Приоритет' : 'Priority'}
              </label>
              <select
                value={modalData.priority}
                onChange={(e) => setModalData((p) => ({ ...p, priority: e.target.value as Priority }))}
                className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]"
              >
                {Object.values(Priority).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                {language === 'ru' ? 'Категория' : 'Category'}
              </label>
              <select
                value={modalData.category}
                onChange={(e) => setModalData((p) => ({ ...p, category: e.target.value as Category }))}
                className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]"
              >
                {Object.values(Category).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                {isRussian ? 'Повтор' : 'Repeat'}
              </label>
              <select
                value={modalData.repeat || 'none'}
                onChange={(e) => setModalData((p) => ({ ...p, repeat: e.target.value as RepeatType }))}
                className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]"
              >
                <option value="None">{isRussian ? 'Без повтора' : 'No repeat'}</option>
                <option value="Daily">{isRussian ? 'Ежедневно' : 'Daily'}</option>
                <option value="Weekly">{isRussian ? 'Еженедельно' : 'Weekly'}</option>
                <option value="Monthly">{isRussian ? 'Ежемесячно' : 'Monthly'}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
                {isRussian ? 'Оценка времени (мин)' : 'Time estimate (min)'}
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={modalData.estimatedMinutes || ''}
                onChange={(e) =>
                  setModalData((p) => ({ ...p, estimatedMinutes: parseInt(e.target.value) || 0 }))
                }
                placeholder="30"
                className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
              {isRussian ? 'Подзадачи' : 'Subtasks'}
            </label>
            <div className="space-y-2 mb-2">
              {(modalData.subtasks || []).map((sub, i) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sub.title}
                    onChange={(e) => handleUpdateSubtaskTitle(i, e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0E0E16] rounded-lg border border-[#2A2A3C] text-sm text-[#8888A0] outline-none"
                    placeholder={isRussian ? 'Подзадача...' : 'Subtask...'}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(i)}
                    className="p-1.5 rounded text-[#55556A] hover:text-[#FF4444]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddSubtask}
              className="text-xs font-bold text-[#5DAEFF] hover:text-[#7DBEFF] transition-colors"
            >
              + {isRussian ? 'Добавить подзадачу' : 'Add subtask'}
            </button>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
              {isRussian ? 'Теги' : 'Tags'}
            </label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {(modalData.tags || []).map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-[#5DAEFF15] text-[#5DAEFF] border border-[#5DAEFF20]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(i)}
                    className="text-[#5DAEFF60] hover:text-[#5DAEFF]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              placeholder={isRussian ? 'Добавить тег (Enter)' : 'Add tag (Enter)'}
              className="w-full px-3 py-2 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag((e.target as HTMLInputElement).value, e.target as HTMLInputElement);
                }
              }}
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#55556A]">
              {isRussian ? 'Проект' : 'Project'}
            </label>
            <input
              list="project-list"
              value={modalData.project || ''}
              onChange={(e) => setModalData((p) => ({ ...p, project: e.target.value }))}
              placeholder={isRussian ? 'Без проекта' : 'No project'}
              className="w-full px-3 py-2.5 bg-[#0E0E16] rounded-xl border border-[#2A2A3C] text-sm text-[#8888A0] outline-none focus:border-[#5DAEFF40]"
            />
            <datalist id="project-list">
              {existingProjects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#1E1E2E] flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-[#55556A] text-sm">
            {isRussian ? 'Отмена' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!modalData.title}
            className="px-6 py-2.5 bg-[#5DAEFF] text-[#0A0A0F] rounded-xl font-semibold text-sm disabled:opacity-30"
          >
            {isRussian ? 'Сохранить' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleSaveAsTemplate}
            className="px-4 py-2 text-[10px] font-bold text-[#D8C18E] hover:text-[#F2F1EE] transition-colors uppercase tracking-wider"
          >
            {isRussian ? '💾 Как шаблон' : '💾 As Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
