/**
 * Eclipse Valhalla — Oracle View
 *
 * The Oracle is not a chatbot. It's a disciplined AI system
 * that plans, analyzes, motivates, and pushes.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Message, Reminder } from '../types';
import { sendOracleMessage, oraclePlanDay, oracleAnalyze, oracleMotivate } from '../services/oracleService';
import { Swords, Brain, Flame, Calendar, Send, Loader2, Sparkles, TriangleAlert } from 'lucide-react';

interface OracleViewProps {
  quests: Reminder[];
}

const QUICK_ACTIONS = [
  { id: 'plan', label: 'Plan My Day', icon: Calendar, color: '#5DAEFF', desc: 'Battle strategy for today' },
  { id: 'analyze', label: 'Analyze Me', icon: Brain, color: '#7A5CFF', desc: 'Productivity verdict' },
  { id: 'motivate', label: 'Push Me', icon: Flame, color: '#FF6B35', desc: 'Anti-procrastination shock' },
];

export const OracleView: React.FC<OracleViewProps> = ({ quests }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "I am the Oracle. I see your quests. I see your failures. Ask, and I'll tell you what you need to hear — not what you want.",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const addBotMessage = (text: string, isError = false) => {
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text,
      timestamp: Date.now(),
      isError,
    }]);
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
    setIsLoading(true);

    try {
      const history = messages.filter(m => !m.isError).map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const responseText = await sendOracleMessage(history, msg, quests);
      addBotMessage(responseText || 'The Oracle is silent.');
    } catch (error: any) {
      addBotMessage(error?.message || 'Oracle connection lost. Check your API key in Settings.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionId: string) => {
    if (isLoading) return;
    setIsLoading(true);

    const actionLabels: Record<string, string> = {
      plan: 'Plan my day',
      analyze: 'Analyze my productivity',
      motivate: 'I need a push',
    };

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: actionLabels[actionId] || actionId,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      let response: string | undefined;

      switch (actionId) {
        case 'plan':
          response = await oraclePlanDay(quests);
          break;
        case 'analyze':
          response = await oracleAnalyze(quests);
          break;
        case 'motivate': {
          const pending = quests.filter(q => !q.isCompleted);
          const target = pending[0]?.title || 'your most important task';
          response = await oracleMotivate(target);
          break;
        }
      }

      addBotMessage(response || 'The Oracle is silent.');
    } catch (error: any) {
      addBotMessage(error?.message || 'Oracle connection lost.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const pendingCount = quests.filter(q => !q.isCompleted).length;
  const overdueCount = quests.filter(q => !q.isCompleted && new Date(q.dueDateTime) < new Date()).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Oracle Header */}
      <div className="shrink-0 px-6 py-5 border-b border-[#1E1E2E] bg-[#0E0E16]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4ADE8015] border border-[#4ADE8030] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#4ADE80]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E8E8F0] tracking-wide">The Oracle</h2>
              <p className="text-xs text-[#55556A]">Gemini AI &middot; Discipline System</p>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#5DAEFF10] text-[#5DAEFF] border border-[#5DAEFF30] font-medium">
              {pendingCount} active
            </span>
            {overdueCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#8B000020] text-[#FF4444] border border-[#8B000040] font-medium flex items-center gap-1">
                <TriangleAlert className="w-3 h-3" />
                {overdueCount} overdue
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1A1A26] border border-[#2A2A3C] hover:border-[#3A3A52] text-[#8888A0] hover:text-[#E8E8F0] transition-all text-xs font-medium disabled:opacity-40"
              >
                <Icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#5DAEFF] text-[#0A0A0F] rounded-br-sm font-medium'
                  : msg.isError
                    ? 'bg-[#8B000020] text-[#FF4444] border border-[#8B000040] rounded-bl-sm'
                    : 'bg-[#1A1A26] text-[#E8E8F0] border border-[#2A2A3C] rounded-bl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1A1A26] border border-[#2A2A3C] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#4ADE80] animate-spin" />
              <span className="text-xs text-[#55556A]">Oracle is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-[#1E1E2E] bg-[#0E0E16]">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Oracle..."
            className="flex-1 bg-[#12121A] border border-[#2A2A3C] rounded-xl px-4 py-3 text-sm text-[#E8E8F0] placeholder-[#55556A] outline-none focus:border-[#4ADE8060] focus:ring-1 focus:ring-[#4ADE8020] transition-all"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputValue.trim()}
            className="bg-[#4ADE80] hover:bg-[#3ACF70] disabled:opacity-30 disabled:cursor-not-allowed text-[#0A0A0F] rounded-xl px-4 py-2 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OracleView;
