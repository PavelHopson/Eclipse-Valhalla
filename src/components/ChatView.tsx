import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types/index';
import { sendChatMessage } from '../services/geminiService';
import { useLanguage } from '../i18n';

export const ChatView: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const initialMessage = isRu ? 'Привет! Я Valhalla, твой AI-ассистент. Чем могу помочь?' : "Hello! I'm Valhalla, your AI assistant running on Gemini 3 Pro. How can I help you today?";
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: initialMessage,
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Convert current messages to history format for the API
      // Filter out error messages if any
      const history = messages.filter(m => !m.isError).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(history, userMsg.text);

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I couldn't generate a response.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: isRu ? 'Ошибка подключения к сервисам.' : "Sorry, I encountered an error connecting to Valhalla services.",
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
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

  return (
    <div className="flex flex-col h-full bg-[#1A1A26]/80 rounded-2xl border border-[#2A2A3C] overflow-hidden shadow-xl">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-[#E8E8F0] rounded-br-none'
                  : msg.isError
                    ? 'bg-red-900/50 text-red-200 border border-red-700'
                    : 'bg-[#1A1A26] text-[#E8E8F0] rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1A1A26] text-[#55556A] rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#55556A] rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></span>
              <span className="w-2 h-2 bg-[#55556A] rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></span>
              <span className="w-2 h-2 bg-[#55556A] rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#12121A] border-t border-[#2A2A3C]">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRu ? 'Спроси Valhalla...' : 'Ask Valhalla...'}
            className="flex-1 bg-[#12121A] border border-[#2A2A3C] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5DAEFF] text-[#E8E8F0] placeholder-[#3A3A4A] transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-[#E8E8F0] rounded-xl px-4 py-2 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
