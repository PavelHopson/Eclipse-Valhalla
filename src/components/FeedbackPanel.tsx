/**
 * Eclipse Valhalla — Feedback Panel
 *
 * In-app feedback: bug reports, feature requests, general feedback.
 */

import React, { useState } from 'react';
import { MessageSquare, Bug, Lightbulb, Send, X } from 'lucide-react';

interface FeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

type FeedbackType = 'feedback' | 'bug' | 'feature';

const TYPES: { id: FeedbackType; label: string; icon: any; color: string }[] = [
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, color: '#5DAEFF' },
  { id: 'bug', label: 'Bug Report', icon: Bug, color: '#FF4444' },
  { id: 'feature', label: 'Feature', icon: Lightbulb, color: '#FBBF24' },
];

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ isOpen, onClose, userId }) => {
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;

    // Store locally
    try {
      const feedback = JSON.parse(localStorage.getItem('eclipse_feedback') || '[]');
      feedback.push({
        id: Date.now().toString(36),
        type,
        message: message.trim(),
        userId,
        platform: navigator.userAgent.slice(0, 100),
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('eclipse_feedback', JSON.stringify(feedback.slice(-50)));
    } catch {}

    // TODO: Send to backend
    // await fetch('/api/feedback', { method: 'POST', body: JSON.stringify({ type, message, userId }) });

    setSubmitted(true);
    setTimeout(() => {
      setMessage('');
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:max-w-md bg-[#12121A] border border-[#2A2A3C] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E1E2E] flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#E8E8F0]">Send Feedback</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#1F1F2B] text-[#55556A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-2xl mb-2">◉</div>
            <p className="text-sm text-[#E8E8F0] font-medium">Feedback received.</p>
            <p className="text-xs text-[#55556A] mt-1">Your signal strengthens the system.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Type selector */}
            <div className="flex gap-2">
              {TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                      type === t.id
                        ? 'border'
                        : 'bg-[#1A1A26] text-[#55556A] border border-[#1E1E2E]'
                    }`}
                    style={type === t.id ? {
                      backgroundColor: `${t.color}08`,
                      borderColor: `${t.color}30`,
                      color: t.color,
                    } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={
                type === 'bug' ? 'Describe the issue. What happened? What did you expect?' :
                type === 'feature' ? 'What would make Eclipse Valhalla more powerful?' :
                'Your thoughts, suggestions, or observations.'
              }
              className="w-full h-32 px-4 py-3 bg-[#0E0E16] border border-[#2A2A3C] rounded-xl text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF40] resize-none"
              autoFocus
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="w-full py-3 bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#0A0A0F] rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
