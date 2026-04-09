import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Message, Reminder } from '../types';
import { sendOracleMessage, oraclePlanDay, oracleAnalyze, oracleMotivate } from '../services/oracleService';
import { Brain, Flame, Calendar, Send, Loader2, Sparkles, TriangleAlert, Trash2 } from 'lucide-react';
import { Seal } from '../brand/Seal';
import { useLanguage } from '../i18n';

interface OracleViewProps {
  quests: Reminder[];
}

/** Simple markdown to HTML renderer */
function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-[#D8C18E] mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-[#D8C18E] mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-[#F2F1EE] mt-5 mb-2">$1</h1>')
    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="text-[#F2F1EE]"><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#F2F1EE]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#B4B0A7] italic">$1</em>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-[#2A2A3C] my-3" />')
    // List items
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 ml-2"><span class="text-[#D8C18E]">•</span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 ml-2"><span class="text-[#5DAEFF] font-mono text-xs">$&</span></div>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

const MarkdownText: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
);

const QUICK_ACTIONS_EN = [
  { id: 'plan', label: 'Plan the next campaign', icon: Calendar, color: '#6C8FB8' },
  { id: 'analyze', label: 'Read my pattern', icon: Brain, color: '#B89B5E' },
  { id: 'motivate', label: 'Break my resistance', icon: Flame, color: '#A33036' },
];

const QUICK_ACTIONS_RU = [
  { id: 'plan', label: 'Планировать кампанию', icon: Calendar, color: '#6C8FB8' },
  { id: 'analyze', label: 'Прочитать паттерн', icon: Brain, color: '#B89B5E' },
  { id: 'motivate', label: 'Сломать сопротивление', icon: Flame, color: '#A33036' },
];

export const OracleView: React.FC<OracleViewProps> = ({ quests }) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const QUICK_ACTIONS = isRu ? QUICK_ACTIONS_RU : QUICK_ACTIONS_EN;
  const initialMessage: Message = {
    id: '1',
    role: 'model',
    text: isRu
      ? 'Оракул не болтает. Он интерпретирует давление, последовательность и слабость. Спрашивай с намерением.'
      : 'The Oracle does not chat. It interprets pressure, sequence, and weakness. Ask with intent.',
    timestamp: Date.now(),
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('eclipse_oracle_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [initialMessage];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manifesting, setManifesting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pendingCount = quests.filter(q => !q.isCompleted).length;
  const overdueCount = quests.filter(q => !q.isCompleted && new Date(q.dueDateTime) < new Date()).length;

  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('eclipse_oracle_history', JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, manifesting]);

  const latestOracleMessage = useMemo(() => [...messages].reverse().find(msg => msg.role === 'model'), [messages]);
  const recentInvocations = useMemo(() => messages.filter(msg => msg.role === 'user').slice(-4).reverse(), [messages]);

  const addRevelation = (text: string, isError = false) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}_${prev.length}`,
      role: 'model',
      text,
      timestamp: Date.now(),
      isError,
    }]);
  };

  const revealWithDelay = async (resolver: () => Promise<string | undefined>) => {
    setIsLoading(true);
    setManifesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 650));
      const response = await resolver();
      addRevelation(response || (isRu ? 'Оракул вернул тишину.' : 'The Oracle returned silence.'));
      import('../services/achievementService').then(({ trackEvent }) => {
        trackEvent('ai_chat');
      }).catch(() => {});
    } catch (error: any) {
      addRevelation(error?.message || (isRu ? 'Связь с Оракулом потеряна. Проверь настройки провайдера.' : 'Oracle connection lost. Check provider settings.'), true);
    } finally {
      setManifesting(false);
      setIsLoading(false);
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text || inputValue.trim();
    if (!msg || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: msg,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    await revealWithDelay(async () => {
      const history = messages.filter(m => !m.isError).map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      return sendOracleMessage(history, msg, quests);
    });
  };

  const handleQuickAction = async (actionId: string) => {
    if (isLoading) return;

    const labelMap: Record<string, string> = isRu
      ? { plan: 'Планировать кампанию', analyze: 'Прочитать паттерн', motivate: 'Сломать сопротивление' }
      : { plan: 'Plan the next campaign', analyze: 'Read my pattern', motivate: 'Break my resistance' };

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      text: labelMap[actionId] || actionId,
      timestamp: Date.now(),
    }]);

    await revealWithDelay(async () => {
      if (actionId === 'plan') return oraclePlanDay(quests);
      if (actionId === 'analyze') return oracleAnalyze(quests);
      const pending = quests.filter(q => !q.isCompleted);
      return oracleMotivate(pending[0]?.title || 'your next obligation');
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0A0A0A]">
      <div className="border-b border-white/8 bg-[#121212]/96 px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <div className="hidden rounded-[18px] border border-[#8E9B7926] bg-[#8E9B7910] p-3 md:block">
                <Sparkles className="h-6 w-6 text-[#8E9B79]" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#7F7A72]">{isRu ? 'Палата Оракула' : 'Oracle chamber'}</div>
                <h1 className="mt-2 font-ritual text-3xl text-[#F2F1EE] md:text-4xl">{isRu ? 'Оракул' : 'The Oracle'}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#B4B0A7]">
                  {isRu ? 'Откровение, не беседа. Спроси план, чтение или вердикт.' : 'Revelation, not conversation. Ask for a plan, a reading, or a verdict. The answer should feel like a system seeing through you.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#6C8FB82A] bg-[#6C8FB810] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9AB7D4]">
                {pendingCount} {isRu ? 'активных' : 'active'}
              </span>
              {overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#7A1F2430] bg-[#7A1F2412] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#C05A60]">
                  <TriangleAlert className="h-3 w-3" />
                  {overdueCount} {isRu ? 'просрочено' : 'overdue'}
                </span>
              )}
              {messages.length > 1 && (
                <button
                  onClick={() => {
                    setMessages([initialMessage]);
                    localStorage.removeItem('eclipse_oracle_history');
                  }}
                  className="rounded-lg p-2 transition-colors hover:bg-white/5"
                  style={{ color: '#5F5A54' }}
                  title={isRu ? 'Очистить' : 'Clear'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-white/8 bg-[#171717] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#B4B0A7] transition-all hover:border-white/14 hover:text-[#F2F1EE] disabled:opacity-40"
                >
                  <Icon className="h-4 w-4" style={{ color: action.color }} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center">
          <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-white/6" />
            <div className="absolute inset-[12px] rounded-full border border-[#8E9B7920]" />
            <div className="absolute inset-[24px] rounded-full border border-[#6C8FB820]" />
            <div className={`${manifesting ? 'ring-pulse' : 'system-idle'} flex h-14 w-14 items-center justify-center rounded-full border border-[#B89B5E28] bg-[#B89B5E0D]`}>
              <Seal size={24} variant="watching" color="#B89B5E" />
            </div>
          </div>

          <div className="w-full rounded-[28px] border border-white/8 bg-[#121212]/92 p-6 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#7F7A72]">{isRu ? 'Текущее откровение' : 'Current revelation'}</div>
            <MarkdownText
              text={latestOracleMessage?.text || ''}
              className="mx-auto mt-5 max-w-3xl text-left text-sm leading-7 text-[#B4B0A7] md:text-base"
            />
            {latestOracleMessage?.isError && (
              <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#C05A60]">{isRu ? 'Ошибка передачи' : 'Transmission fault'}</div>
            )}
            {manifesting && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#6C8FB826] bg-[#6C8FB80D] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#9AB7D4]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {isRu ? 'Откровение формируется' : 'Revelation is forming'}
              </div>
            )}
          </div>

          {recentInvocations.length > 0 && (
            <div className="mt-8 w-full max-w-3xl">
              <div className="mb-3 text-center text-[10px] uppercase tracking-[0.24em] text-[#7F7A72]">{isRu ? 'Недавние воззвания' : 'Recent invocations'}</div>
              <div className="space-y-3">
                {recentInvocations.map(msg => (
                  <div key={msg.id} className="rounded-[18px] border border-white/8 bg-[#171717] px-4 py-3 text-sm text-[#B4B0A7]">
                    {msg.role === 'model' ? (
                      <MarkdownText text={msg.text} className="text-left leading-6" />
                    ) : (
                      <div className="text-center">{msg.text}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/8 bg-[#121212]/96 px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[22px] border border-[#6C8FB824] bg-[#0F0F0F] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#7F7A72]">{isRu ? 'Спроси Оракула' : 'Ask the Oracle'}</div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isRu ? 'Назови паттерн, препятствие или решение.' : 'Name the pattern, obstacle, or decision.'}
                className="flex-1 bg-transparent px-2 py-3 text-sm text-[#F2F1EE] placeholder-[#5F5A54] outline-none"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputValue.trim()}
                className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#8E9B7928] bg-[#8E9B79] text-[#0A0A0A] transition-all hover:bg-[#9AA786] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OracleView;
