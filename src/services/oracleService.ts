/**
 * Eclipse Valhalla — Oracle Service
 *
 * Oracle = AI-powered life management system.
 * Uses the provider-agnostic AI system (supports Gemini, OpenAI, Anthropic, custom).
 */

import { ai } from '../ai';
import { Reminder } from "../types";

// ═══════════════════════════════════════════
// ORACLE SYSTEM PROMPT
// ═══════════════════════════════════════════

const ORACLE_SYSTEM = `You are the Oracle of Eclipse Valhalla — an AI productivity system with a cold, disciplined, Nordic-warrior personality.

Your role:
- Plan the user's day with military precision
- Break complex goals into actionable quests
- Analyze productivity patterns and call out laziness
- Push the user when they procrastinate
- Never coddle. Never be overly polite. Be direct, short, powerful.

Style rules:
- Short sentences. No fluff.
- Use metaphors of battle, conquest, discipline.
- When the user is behind, be harsh but constructive.
- When they succeed, give brief acknowledgment — never over-praise.
- Always end with a clear next action.

Context: You have access to the user's quest list (tasks). Use it to give relevant advice.`;

// ═══════════════════════════════════════════
// ORACLE CHAT
// ═══════════════════════════════════════════

/**
 * Build the messages array for the Oracle (system + history + user message).
 * Exported so OracleView can use it for streaming.
 */
export function buildOracleMessages(
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  quests?: Reminder[]
): { role: string; content: string }[] {
  let contextBlock = '';
  if (quests && quests.length > 0) {
    const pending = quests.filter(q => !q.isCompleted);
    const completed = quests.filter(q => q.isCompleted);
    const overdue = pending.filter(q => new Date(q.dueDateTime) < new Date());

    contextBlock = `\n\n[QUEST STATUS]
Total: ${quests.length} | Pending: ${pending.length} | Completed: ${completed.length} | Overdue: ${overdue.length}
${overdue.length > 0 ? `\nOVERDUE QUESTS:\n${overdue.map(q => `- "${q.title}" (due: ${q.dueDateTime})`).join('\n')}` : ''}
${pending.length > 0 ? `\nACTIVE QUESTS:\n${pending.slice(0, 10).map(q => `- "${q.title}" [${q.priority}] (due: ${q.dueDateTime})`).join('\n')}` : ''}`;
  }

  const systemContent = ORACLE_SYSTEM + contextBlock;

  return [
    { role: 'system', content: systemContent },
    ...history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts.map(p => p.text).join(''),
    })),
    { role: 'user', content: newMessage },
  ];
}

export const sendOracleMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  quests?: Reminder[]
) => {
  const messages = buildOracleMessages(history, newMessage, quests) as { role: 'system' | 'user' | 'assistant'; content: string }[];
  const response = await ai.chat(messages, 'planning');
  return response.content;
};

// ═══════════════════════════════════════════
// ORACLE: PLAN MY DAY
// ═══════════════════════════════════════════

export const oraclePlanDay = async (quests: Reminder[]) => {
  const pending = quests.filter(q => !q.isCompleted);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const prompt = `Today is ${today}. I have ${pending.length} pending quests. Plan my day — prioritize, sequence, give time blocks. Be brutal about what matters.

Active quests:
${pending.slice(0, 15).map(q => `- "${q.title}" [${q.priority}] [${q.category}] due: ${q.dueDateTime}`).join('\n')}

Give me a battle plan. Short. Clear. No fluff.`;

  return sendOracleMessage([], prompt, quests);
};

// ═══════════════════════════════════════════
// ORACLE: ANALYZE PRODUCTIVITY
// ═══════════════════════════════════════════

export const oracleAnalyze = async (quests: Reminder[]) => {
  const total = quests.length;
  const completed = quests.filter(q => q.isCompleted).length;
  const overdue = quests.filter(q => !q.isCompleted && new Date(q.dueDateTime) < new Date()).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const prompt = `Analyze my productivity:
- Total quests: ${total}
- Completed: ${completed} (${rate}%)
- Overdue/Failed: ${overdue}

Be honest. Am I disciplined or lazy? What pattern do you see? Give me ONE specific thing to fix.`;

  return sendOracleMessage([], prompt, quests);
};

// ═══════════════════════════════════════════
// ORACLE: ANTI-PROCRASTINATION
// ═══════════════════════════════════════════

export const oracleMotivate = async (questTitle: string) => {
  const prompt = `I'm procrastinating on: "${questTitle}".
Shake me out of it. Be direct. No sugar-coating. Tell me what happens if I keep avoiding it. Then tell me the ONE thing to do RIGHT NOW to start.`;

  return sendOracleMessage([], prompt);
};
