/**
 * Eclipse Valhalla — Onboarding Flow
 *
 * 5-step guided setup for new users.
 * Goal: value in 2 minutes. First quest created. System understood.
 */

import React, { useState } from 'react';
import OnboardingStep from './OnboardingStep';
import { Hammer, Swords, Sparkles, Rss, Target, ChevronRight, Plus, X } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

export interface OnboardingData {
  focus: string;
  quests: { title: string; priority: 'high' | 'medium' | 'low' }[];
  enableWidgets: boolean;
  enableNexus: boolean;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [focus, setFocus] = useState('');
  const [quests, setQuests] = useState<{ title: string; priority: 'high' | 'medium' | 'low' }[]>([]);
  const [questInput, setQuestInput] = useState('');
  const [enableWidgets, setEnableWidgets] = useState(true);
  const [enableNexus, setEnableNexus] = useState(true);

  const totalSteps = 5;

  const next = () => {
    if (step < totalSteps) setStep(step + 1);
    else finish();
  };

  const finish = () => {
    onComplete({ focus, quests, enableWidgets, enableNexus });
  };

  const addQuest = () => {
    if (!questInput.trim()) return;
    setQuests(prev => [...prev, { title: questInput.trim(), priority: 'medium' }]);
    setQuestInput('');
  };

  const removeQuest = (idx: number) => {
    setQuests(prev => prev.filter((_, i) => i !== idx));
  };

  const focusOptions = [
    { id: 'work', label: 'Work', desc: 'Projects, deadlines, career', icon: '⚡' },
    { id: 'study', label: 'Study', desc: 'Learning, exams, skills', icon: '📚' },
    { id: 'life', label: 'Life', desc: 'Health, habits, goals', icon: '🎯' },
    { id: 'everything', label: 'Everything', desc: 'Total life control', icon: '◉' },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-[#0A0A0F] flex flex-col">
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onSkip} className="text-xs text-[#3A3A4A] hover:text-[#55556A] transition-colors px-3 py-1.5">
          Skip intro
        </button>
      </div>

      {/* ═══ STEP 1: Focus Selection ═══ */}
      {step === 1 && (
        <OnboardingStep
          step={1} totalSteps={totalSteps}
          title="What do you want to control?"
          subtitle="Choose your primary domain. You can expand later."
          icon={<Hammer className="w-8 h-8 text-[#5DAEFF]" />}
        >
          <div className="grid grid-cols-2 gap-3">
            {focusOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setFocus(opt.id); next(); }}
                className={`p-4 rounded-xl border text-left transition-all hover:border-[#5DAEFF40] active:scale-[0.98] ${
                  focus === opt.id
                    ? 'bg-[#5DAEFF08] border-[#5DAEFF40]'
                    : 'bg-[#12121A] border-[#1E1E2E]'
                }`}
              >
                <span className="text-xl mb-2 block">{opt.icon}</span>
                <div className="text-sm font-bold text-[#E8E8F0]">{opt.label}</div>
                <div className="text-[10px] text-[#55556A] mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </OnboardingStep>
      )}

      {/* ═══ STEP 2: Create First Quests ═══ */}
      {step === 2 && (
        <OnboardingStep
          step={2} totalSteps={totalSteps}
          title="Define your first objectives."
          subtitle="What needs to be done? Add 1-3 quests to start."
          icon={<Swords className="w-8 h-8 text-[#5DAEFF]" />}
          accentColor="#5DAEFF"
        >
          <div className="space-y-3">
            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={questInput}
                onChange={e => setQuestInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addQuest(); }}
                placeholder="What's your next objective?"
                className="flex-1 px-4 py-3 bg-[#12121A] border border-[#2A2A3C] rounded-xl text-sm text-[#E8E8F0] placeholder-[#3A3A4A] outline-none focus:border-[#5DAEFF40]"
                autoFocus
              />
              <button
                onClick={addQuest}
                disabled={!questInput.trim()}
                className="px-4 py-3 bg-[#5DAEFF] text-[#0A0A0F] rounded-xl font-bold disabled:opacity-30 transition-opacity"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quest list */}
            <div className="space-y-2">
              {quests.map((q, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#1A1A26] border border-[#2A2A3C] rounded-xl">
                  <Swords className="w-4 h-4 text-[#5DAEFF] shrink-0" />
                  <span className="text-sm text-[#E8E8F0] flex-1">{q.title}</span>
                  <button onClick={() => removeQuest(i)} className="text-[#3A3A4A] hover:text-[#FF4444]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {quests.length === 0 && (
                <p className="text-center text-[#3A3A4A] text-xs py-4">Type your first quest above.</p>
              )}
            </div>

            {/* Continue */}
            <button
              onClick={next}
              className="w-full py-3 mt-4 bg-[#1F1F2B] hover:bg-[#262636] text-[#E8E8F0] rounded-xl text-sm font-medium border border-[#2A2A3C] flex items-center justify-center gap-2 transition-colors"
            >
              {quests.length > 0 ? 'Continue' : 'Skip for now'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </OnboardingStep>
      )}

      {/* ═══ STEP 3: Widgets ═══ */}
      {step === 3 && (
        <OnboardingStep
          step={3} totalSteps={totalSteps}
          title="Floating discipline."
          subtitle="Widgets pin your objectives to the screen. They escalate when you procrastinate."
          icon={<Target className="w-8 h-8 text-[#FBBF24]" />}
          accentColor="#FBBF24"
        >
          <div className="space-y-4">
            {/* Preview mock */}
            <div className="bg-[#12121A] border border-[#2A2A3C] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-[#55556A] uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-[#FBBF24]" />
                Quest Widget Preview
              </div>
              <div className="text-sm font-medium text-[#E8E8F0]">
                {quests[0]?.title || 'Your quest appears here'}
              </div>
              <div className="text-[10px] text-[#55556A]">
                Due: Tomorrow · Escalates if ignored
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => setEnableWidgets(!enableWidgets)}
              className={`w-full py-3 rounded-xl text-sm font-medium border transition-all ${
                enableWidgets
                  ? 'bg-[#FBBF2410] border-[#FBBF2430] text-[#FBBF24]'
                  : 'bg-[#12121A] border-[#1E1E2E] text-[#55556A]'
              }`}
            >
              {enableWidgets ? '◉ Widgets enabled' : '○ Widgets disabled'}
            </button>

            <button onClick={next} className="w-full py-3 bg-[#FBBF24] text-[#0A0A0F] rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </OnboardingStep>
      )}

      {/* ═══ STEP 4: Nexus ═══ */}
      {step === 4 && (
        <OnboardingStep
          step={4} totalSteps={totalSteps}
          title="Intelligence feed."
          subtitle="Nexus ingests news from your sources. AI ranks by importance. Signal becomes action."
          icon={<Rss className="w-8 h-8 text-[#7A5CFF]" />}
          accentColor="#7A5CFF"
        >
          <div className="space-y-4">
            <div className="bg-[#12121A] border border-[#2A2A3C] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#7A5CFF]">
                <Rss className="w-3.5 h-3.5" />
                <span className="font-medium">Nexus Feed</span>
              </div>
              <p className="text-[11px] text-[#55556A] leading-relaxed">
                Add RSS feeds, websites, or Telegram channels. Nexus ranks, deduplicates, and surfaces what matters. Convert any signal into a quest.
              </p>
            </div>

            <button
              onClick={() => setEnableNexus(!enableNexus)}
              className={`w-full py-3 rounded-xl text-sm font-medium border transition-all ${
                enableNexus
                  ? 'bg-[#7A5CFF10] border-[#7A5CFF30] text-[#7A5CFF]'
                  : 'bg-[#12121A] border-[#1E1E2E] text-[#55556A]'
              }`}
            >
              {enableNexus ? '◉ Nexus enabled' : '○ Nexus disabled'}
            </button>

            <button onClick={next} className="w-full py-3 bg-[#7A5CFF] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </OnboardingStep>
      )}

      {/* ═══ STEP 5: Oracle + Launch ═══ */}
      {step === 5 && (
        <OnboardingStep
          step={5} totalSteps={totalSteps}
          title="The Oracle awaits."
          subtitle="AI that plans your day, analyzes productivity, and calls out procrastination."
          icon={<Sparkles className="w-8 h-8 text-[#4ADE80]" />}
          accentColor="#4ADE80"
        >
          <div className="space-y-6">
            {/* Oracle preview */}
            <div className="bg-[#12121A] border border-[#4ADE8020] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4ADE80]" />
                <span className="text-xs font-bold text-[#4ADE80]">Oracle</span>
              </div>
              <div className="bg-[#1A1A26] border border-[#2A2A3C] rounded-lg px-3 py-2 text-xs text-[#8888A0] leading-relaxed">
                "You have {quests.length || 'no'} objectives defined. {quests.length > 0 ? 'Begin with the first. Delay increases resistance.' : 'Define your targets. A warrior without objectives is lost.'}"
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#0E0E16] border border-[#1E1E2E] rounded-xl p-4 space-y-2">
              <div className="text-[10px] text-[#55556A] uppercase tracking-wider font-bold">Your Setup</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#55556A]">Focus</span>
                  <span className="text-[#E8E8F0] font-medium capitalize">{focus || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#55556A]">Quests</span>
                  <span className="text-[#E8E8F0] font-medium">{quests.length} created</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#55556A]">Widgets</span>
                  <span className={enableWidgets ? 'text-[#4ADE80]' : 'text-[#3A3A4A]'}>{enableWidgets ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#55556A]">Nexus</span>
                  <span className={enableNexus ? 'text-[#7A5CFF]' : 'text-[#3A3A4A]'}>{enableNexus ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            {/* Launch */}
            <button
              onClick={finish}
              className="w-full py-4 bg-gradient-to-r from-[#5DAEFF] to-[#7A5CFF] text-white rounded-xl text-base font-bold shadow-[0_0_30px_rgba(93,174,255,0.2)] hover:shadow-[0_0_40px_rgba(93,174,255,0.3)] transition-shadow flex items-center justify-center gap-2"
            >
              Enter Eclipse Valhalla
            </button>
          </div>
        </OnboardingStep>
      )}
    </div>
  );
};

export default OnboardingFlow;
