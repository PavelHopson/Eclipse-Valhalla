# Oracle System

## Architecture

```
User Message + Quest Context → System Prompt → Gemini API → Response → UI
```

## Model
- Chat: `gemini-2.5-flash-preview-05-20`
- Image: `gemini-3-pro-image-preview`
- TTS: `gemini-2.5-flash-preview-tts`

## System Prompt Design

The Oracle has a defined personality:
- Cold, disciplined, Nordic-warrior tone
- Short sentences, no fluff
- Battle/conquest metaphors
- Direct about failures
- Brief acknowledgment of success
- Always ends with a clear next action

## Quest Context Injection

Every Oracle message includes live quest data:
```
[QUEST STATUS]
Total: 15 | Pending: 8 | Completed: 7 | Overdue: 2

OVERDUE QUESTS:
- "Deploy API" (due: 2025-03-15T14:00)

ACTIVE QUESTS:
- "Review PR" [High] (due: 2025-03-16T10:00)
- "Write tests" [Medium] (due: 2025-03-17T18:00)
```

## Capabilities

| Function | Purpose | Input |
|----------|---------|-------|
| `sendOracleMessage` | Free-form chat | History + message + quests |
| `oraclePlanDay` | Day planning | Active quests |
| `oracleAnalyze` | Productivity analysis | All quests |
| `oracleBreakdown` | Task decomposition | Quest title + description |
| `oracleMotivate` | Anti-procrastination | Quest title |

## Tone Examples

```
"Your schedule is fractured. Rebuild it."
"Three critical objectives remain unresolved."
"Delay increases resistance. Begin now."
"68% completion. Below standard. 4 overdue. Address immediately."
```

## API Key Management

Key stored in localStorage (`gemini_api_key`). Configurable via Settings UI. Never sent to our backend — direct client-to-Gemini communication.

## Rate Limits

- Free: 10 messages/day
- Pro: Unlimited
- Enforced via paywallService session counter
