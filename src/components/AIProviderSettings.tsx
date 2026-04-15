/**
 * Eclipse Valhalla — AI Provider Settings
 *
 * Configure AI providers: Gemini, OpenAI, Anthropic, custom endpoints.
 */

import React, { useState, useEffect } from 'react';
import { getAllProviders, addProvider, updateProvider, removeProvider, testProvider } from '../ai';
import type { AIProviderConfig, AIProviderType } from '../ai';
import { DEFAULT_MODELS, PROVIDER_CAPABILITIES, CAPABILITY_LABELS } from '../ai';
import { Plus, Trash2, Check, X, Loader2, Zap, Settings2, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import { useLanguage } from '../i18n';

const PROVIDER_LABELS: Record<AIProviderType, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI / Compatible',
  anthropic: 'Anthropic Claude',
  nvidia: 'NVIDIA NIM',
  custom: 'Custom Endpoint',
};

// Quick-add presets
const PRESETS = [
  {
    id: 'openrouter_qwen',
    label: 'Qwen 3 Next 80B (Free)',
    labelRu: 'Qwen 3 Next 80B (Бесплатно)',
    desc: 'OpenRouter · 80B params · Free tier',
    descRu: 'OpenRouter · 80B параметров · Бесплатно',
    type: 'openai' as AIProviderType,
    model: 'qwen/qwen3-next-80b-a3b-instruct:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai/workspaces/default/keys',
    color: '#FBBF24',
  },
  {
    id: 'openrouter_huihui',
    label: 'Huihui-Qwen 3.5 (No Limits)',
    labelRu: 'Huihui-Qwen 3.5 (Без цензуры)',
    desc: 'Via Ollama locally · Uncensored · Private',
    descRu: 'Через Ollama локально · Без ограничений · Приватно',
    type: 'openai' as AIProviderType,
    model: 'huihui-ai/Huihui-Qwen3.5-35B-A3B-abliterated',
    baseUrl: 'http://localhost:11434/v1',
    noKey: true,
    color: '#FF4444',
  },
  {
    id: 'gemini_free',
    label: 'Gemini 2.5 Flash',
    labelRu: 'Gemini 2.5 Flash',
    desc: 'Google · Free · Images + TTS',
    descRu: 'Google · Бесплатно · Картинки + Голос',
    type: 'gemini' as AIProviderType,
    model: 'gemini-2.5-flash-preview-05-20',
    keyUrl: 'https://aistudio.google.com/apikey',
    color: '#5DAEFF',
  },
];

const AIProviderSettings: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { valid: boolean; error?: string }>>({});

  // Add form state
  const [newType, setNewType] = useState<AIProviderType>('openai');
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => { setProviders(getAllProviders()); }, []);

  const refresh = () => setProviders(getAllProviders());

  const handleAdd = () => {
    if (!newName.trim() || (!newKey.trim() && newUrl.trim() !== 'http://localhost:11434/v1')) return;
    addProvider({
      type: newType,
      name: newName.trim(),
      apiKey: newKey.trim(),
      model: newModel.trim() || DEFAULT_MODELS[newType],
      baseUrl: newUrl.trim() || undefined,
      enabled: true,
      isDefault: providers.length === 0,
      capabilities: PROVIDER_CAPABILITIES[newType] || ['chat'],
    });
    setNewName(''); setNewKey(''); setNewModel(''); setNewUrl('');
    setShowAdd(false);
    refresh();
  };

  const handleTest = async (p: AIProviderConfig) => {
    setTesting(p.id);
    const result = await testProvider(p);
    setTestResult(prev => ({ ...prev, [p.id]: result }));
    setTesting(null);
  };

  const handleRemove = (id: string) => {
    removeProvider(id);
    refresh();
  };

  const handleToggle = (id: string, enabled: boolean) => {
    updateProvider(id, { enabled });
    refresh();
  };

  const handleSetDefault = (id: string) => {
    updateProvider(id, { isDefault: true });
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#E8E8F0]">{isRu ? 'AI Провайдеры' : 'AI Providers'}</h3>
          <p className="text-[10px] text-[#55556A]">{providers.length} {isRu ? 'настроено · Gemini, OpenAI, Claude, свои эндпоинты' : 'configured · Supports Gemini, OpenAI, Claude, custom endpoints'}</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5DAEFF10] text-[#5DAEFF] border border-[#5DAEFF25] text-xs font-medium hover:bg-[#5DAEFF15] transition-colors">
          <Plus className="w-3.5 h-3.5" /> {isRu ? 'Добавить' : 'Add Provider'}
        </button>
      </div>

      {/* Quick presets */}
      {providers.length === 0 && !showAdd && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#55556A]">
            {isRu ? 'Быстрая настройка' : 'Quick Setup'}
          </p>
          {PRESETS.map(preset => (
            <div key={preset.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[#12121A]"
              style={{ backgroundColor: '#0C0C14', border: '1px solid #1E1E2E' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${preset.color}15`, border: `1px solid ${preset.color}25` }}>
                <Zap className="w-4 h-4" style={{ color: preset.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#E8E8F0]">{isRu ? preset.labelRu : preset.label}</div>
                <div className="text-[10px] text-[#55556A]">{isRu ? preset.descRu : preset.desc}</div>
              </div>
              <button onClick={() => {
                setNewType(preset.type);
                setNewName(isRu ? preset.labelRu : preset.label);
                setNewModel(preset.model);
                if (preset.baseUrl) setNewUrl(preset.baseUrl);
                if (preset.noKey) setNewKey('ollama');
                setShowAdd(true);
              }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0"
                style={{ backgroundColor: `${preset.color}15`, color: preset.color, border: `1px solid ${preset.color}25` }}>
                {isRu ? 'Настроить' : 'Setup'}
              </button>
              {preset.keyUrl && (
                <a href={preset.keyUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-medium text-[#5DAEFF] hover:underline shrink-0">
                  {isRu ? 'Ключ' : 'Key'} →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-[#0C0C14] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
          {/* Type */}
          <div className="flex gap-2">
            {(Object.keys(PROVIDER_LABELS) as AIProviderType[]).map(type => (
              <button key={type} onClick={() => { setNewType(type); setNewModel(DEFAULT_MODELS[type]); }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  newType === type ? 'bg-[#5DAEFF10] text-[#5DAEFF] border border-[#5DAEFF25]' : 'bg-[#12121A] text-[#55556A] border border-[#1E1E2E]'
                }`}>
                {PROVIDER_LABELS[type]}
              </button>
            ))}
          </div>

          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={isRu ? 'Название (напр., My GPT-4o)' : 'Display name (e.g., My GPT-4o)'}
            className="w-full px-3 py-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF30]" />

          <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder={isRu ? 'API Ключ' : 'API Key'} type="password"
            className="w-full px-3 py-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF30]" />

          <div className="grid grid-cols-2 gap-3">
            <input value={newModel} onChange={e => setNewModel(e.target.value)} placeholder={`Model (${DEFAULT_MODELS[newType]})`}
              className="px-3 py-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none" />
            {(newType === 'openai' || newType === 'custom') && (
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="Base URL (optional)"
                className="px-3 py-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none" />
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-[#55556A]">{isRu ? 'Отмена' : 'Cancel'}</button>
            <button onClick={handleAdd} disabled={!newName.trim() || !newKey.trim()}
              className="px-4 py-1.5 bg-[#5DAEFF] text-[#0A0A0F] rounded-lg text-xs font-bold disabled:opacity-30">
              {isRu ? 'Сохранить' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Provider list */}
      <div className="space-y-2">
        {providers.map(p => {
          const result = testResult[p.id];
          return (
            <div key={p.id} className="bg-[#0C0C14] border border-[#1E1E2E] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                  p.enabled ? 'bg-[#5DAEFF08] border-[#5DAEFF15]' : 'bg-[#12121A] border-[#1E1E2E]'}`}>
                  <Zap className={`w-4 h-4 ${p.enabled ? 'text-[#5DAEFF]' : 'text-[#3A3A4A]'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${p.enabled ? 'text-[#E8E8F0]' : 'text-[#55556A]'}`}>{p.name}</span>
                    {p.isDefault && <Star className="w-3 h-3 text-[#FFD700] fill-current" />}
                  </div>
                  <div className="text-[10px] text-[#3A3A4A]">{PROVIDER_LABELS[p.type]} · {p.model}</div>
                </div>

                {/* Test */}
                <button onClick={() => handleTest(p)}
                  className="px-2 py-1 rounded text-[10px] font-medium text-[#55556A] hover:text-[#8888A0] border border-[#1E1E2E] hover:border-[#2A2A3C] transition-colors">
                  {testing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (isRu ? 'Тест' : 'Test')}
                </button>

                {result && (
                  <span className={`text-[10px] font-bold ${result.valid ? 'text-[#4ADE80]' : 'text-[#FF4444]'}`}>
                    {result.valid ? '✓ OK' : '✗ Failed'}
                  </span>
                )}

                {/* Default */}
                {!p.isDefault && (
                  <button onClick={() => handleSetDefault(p.id)} className="text-[10px] text-[#3A3A4A] hover:text-[#FFD700]" title="Set as default">
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Toggle */}
                <button onClick={() => handleToggle(p.id, !p.enabled)}>
                  {p.enabled ? <ToggleRight className="w-5 h-5 text-[#5DAEFF]" /> : <ToggleLeft className="w-5 h-5 text-[#3A3A4A]" />}
                </button>

                {/* Delete */}
                <button onClick={() => handleRemove(p.id)}
                  className="p-1 rounded hover:bg-[#FF444410] text-[#3A3A4A] hover:text-[#FF4444] transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {providers.length === 0 && (
          <div className="text-center py-8 text-[#3A3A4A]">
            <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{isRu ? 'AI провайдеры не настроены.' : 'No AI providers configured.'}</p>
            <p className="text-xs mt-1">{isRu ? 'Добавьте API ключ для Oracle, Forge и AI-обогащения.' : 'Add your API key to use Oracle, Forge, and AI enrichment.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIProviderSettings;
