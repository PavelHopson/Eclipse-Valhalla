/**
 * Eclipse Valhalla - Quick Quest Input
 *
 * Fast, central, deliberate.
 */

import React, { useState, useRef } from 'react';
import { ArrowUpRight, Briefcase, HeartPulse, UserRound } from 'lucide-react';
import { useLanguage } from '../i18n';

type QuestTag = 'work' | 'health' | 'life';

interface QuickQuestInputProps {
  onCreateQuest: (title: string, tag?: string) => void;
  placeholder?: string;
  compact?: boolean;
}

const TAGS_EN: { id: QuestTag; icon: any; label: string; accent: string }[] = [
  { id: 'work', icon: Briefcase, label: 'Work', accent: '#6C8FB8' },
  { id: 'health', icon: HeartPulse, label: 'Health', accent: '#8E9B79' },
  { id: 'life', icon: UserRound, label: 'Life', accent: '#B89B5E' },
];

const TAGS_RU: { id: QuestTag; icon: any; label: string; accent: string }[] = [
  { id: 'work', icon: Briefcase, label: 'Работа', accent: '#6C8FB8' },
  { id: 'health', icon: HeartPulse, label: 'Здоровье', accent: '#8E9B79' },
  { id: 'life', icon: UserRound, label: 'Жизнь', accent: '#B89B5E' },
];

const QuickQuestInput: React.FC<QuickQuestInputProps> = ({
  onCreateQuest,
  placeholder,
  compact = false,
}) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const TAGS = isRu ? TAGS_RU : TAGS_EN;
  const defaultPlaceholder = isRu ? 'Назови цель. Нажми Enter.' : 'State the objective. Press Enter.';
  const [value, setValue] = useState('');
  const [flash, setFlash] = useState(false);
  const [tag, setTag] = useState<QuestTag | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const title = value.trim();
    if (!title) return;

    onCreateQuest(title, tag || undefined);
    setValue('');
    setFlash(true);
    window.setTimeout(() => setFlash(false), 700);
    inputRef.current?.focus();
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder={placeholder || defaultPlaceholder}
          className={`flex-1 rounded-[12px] border bg-[#121212] px-3 py-2.5 text-sm text-[#F2F1EE] outline-none transition-all ${
            flash ? 'border-[#8E9B793D] shadow-[0_0_16px_rgba(142,155,121,0.12)]' : 'border-white/10 focus:border-[#6C8FB855]'
          }`}
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="rounded-[12px] bg-[#6C8FB8] px-3 py-2.5 font-bold text-[#0A0A0A] transition-all disabled:opacity-20"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-[24px] border bg-[#121212]/96 transition-all ${
        flash ? 'border-[#8E9B793D] shadow-[0_0_24px_rgba(142,155,121,0.12)]' : 'border-white/8'
      }`}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.02), transparent 28%),
            radial-gradient(circle at 50% 0%, rgba(108, 143, 184, 0.08), transparent 32%)
          `,
        }}
      />
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#6C8FB833] to-transparent" />

      <div className="relative px-5 py-5 md:px-6 md:py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#7F7A72]">{isRu ? 'Ввод цели' : 'Quest input'}</div>
            <div className="mt-2 font-ritual text-lg text-[#F2F1EE]">{isRu ? 'Отдай приказ дню.' : 'Give the day a command.'}</div>
          </div>
          <div className="rounded-full border border-[#B89B5E24] bg-[#B89B5E10] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8C18E]">
            {isRu ? 'Сигнал → Квест' : 'Signal → Quest'}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[12px] uppercase tracking-[0.24em] text-[#5F5A54]">
              ///
            </div>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder={placeholder || defaultPlaceholder}
              className="w-full rounded-[16px] border border-[#6C8FB826] bg-[#0F0F0F] py-5 pl-16 pr-5 text-[16px] font-semibold text-[#F2F1EE] placeholder-[#5F5A54] outline-none transition-all focus:border-[#B89B5E40] focus:shadow-[0_0_0_1px_rgba(184,155,94,0.25)]"
            />
          </div>

          <button
            onClick={submit}
            disabled={!value.trim()}
            className="inline-flex h-[60px] items-center justify-center gap-2 rounded-[16px] border border-[#B89B5E30] bg-[#B89B5E] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A] transition-all hover:-translate-y-0.5 hover:bg-[#C5A76A] disabled:cursor-not-allowed disabled:opacity-25"
          >
            {isRu ? 'Создать квест' : 'Seal quest'}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {TAGS.map(item => {
            const Icon = item.icon;
            const active = tag === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTag(active ? null : item.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition-all ${
                  active ? '' : 'border-white/8 bg-white/[0.02] text-[#7F7A72] hover:text-[#B4B0A7]'
                }`}
                style={active ? { borderColor: `${item.accent}40`, backgroundColor: `${item.accent}12`, color: item.accent } : undefined}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#5F5A54]">
            {isRu ? 'Enter подтверждает сразу' : 'Enter confirms immediately'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default QuickQuestInput;
