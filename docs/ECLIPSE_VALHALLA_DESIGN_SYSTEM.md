# Eclipse Valhalla Design System

## System Thesis

Eclipse Valhalla is not a productivity dashboard. It is a pressure architecture for execution.

The interface must communicate one idea at all times:

**The system expects action now.**

Design ratio:

- 80% minimal, readable, operational UI
- 20% symbolic, atmospheric, identity-shaping accents

Core behavioral loop:

- Signal
- Decision
- Quest
- Action
- Completion

## Visual System

### Color Tokens

Base surfaces:

- `void.black`: `#0A0A0A`
- `void.graphite`: `#121212`
- `void.steel`: `#2A2A2A`

Operational accents:

- `accent.cold`: `#6C8FB8`
- `danger.red`: `#7A1F24`
- `gold.pale`: `#B89B5E`

Usage rules:

- Cold blue marks systems, focus, active intent, and navigational guidance.
- Deep red marks failure, breach, overdue state, and return pressure.
- Pale gold is reserved for identity, seal moments, completion, and ritual emphasis.
- Avoid bright gradients and decorative rainbow logic.

### Typography Tokens

Primary body:

- `Manrope`
- Use for navigation, lists, utility labels, body copy, and data

Secondary ritual face:

- `Cinzel`
- Use only for high-impact headers, completion, and confrontation states

Behavior:

- Sans carries control and legibility
- Serif carries ceremony and consequence

## Components

### Buttons

Primary button:

- Heavy weight
- Uppercase tracking
- Sharp but not cartoon-aggressive radius
- Slight lift on hover

Rules:

- Gold buttons: commitment and state transitions
- Blue buttons: operational continuation
- Red buttons: punishment or destructive confirmation only

### Cards

Cards should feel almost structural, not decorative.

Rules:

- Low-contrast borders
- Dark, nearly matte surfaces
- Occasional top hairline or circular geometry
- No soft “SaaS card grid” feeling

### Inputs

Inputs are command channels, not forms.

Rules:

- Strong contrast
- Low chrome
- Large vertical padding for authority
- Focus state shifts from blue to gold to indicate commitment

## Key Screen Layouts

### Dashboard

Composition:

- Dominant pressure hero at top
- Quick quest input directly below hero as the central action
- Active quests rendered as a clean list of pressure carriers
- Tertiary stats and navigation only after the action surfaces

Hero contents:

- Discipline score
- Streak
- Active and overdue counts
- Immediate next pressure point
- Focus-entry CTA

### Focus Mode

Composition:

- Fullscreen chamber
- Central quest title
- Circular timer geometry
- Minimal controls
- Nearly static environment

Behavior:

- Blue indicates controlled execution
- Gold appears on threshold and completion
- Escaping focus triggers red breach state

### Completion State

Composition:

- Large centered seal
- Ritual headline
- Identity reinforcement copy
- Immediate next-objective CTA

Purpose:

- Completion should feel consequential, not celebratory in a playful way
- The user should feel recorded, not entertained

### Return Overlay

Composition:

- Confrontational centered panel
- Seal state switches between watching and broken
- One main sentence
- One detail sentence
- One forced action CTA

Purpose:

- The overlay exists to re-establish pressure
- It should never read like a welcome screen

## Symbolic Layer

Use symbolic elements sparingly and abstractly.

Approved elements:

- Circular geometry
- Broken-ring motifs
- Hairline sigil fields
- Rune-like separators
- Low-opacity engraved lines

Do not use:

- Literal medieval icons
- Decorative fantasy frames
- Clipart weapons, skulls, shields, dragons
- Texture-heavy faux parchment aesthetics

## Motion Principles

Motion must feel heavy and inevitable.

Rules:

- Slow fades
- Minimal pulse states
- Slight hover lift only on decisive actions
- Focus mode should feel almost still

Avoid:

- Bouncy easing
- playful motion
- high-frequency particle or glow effects

## UX Rules

- Readability always beats atmosphere
- Every accent must support pressure, action, or identity
- The user should always know the next action without interpretation
- Decorative elements must never sit between the user and execution

## Final Litmus Test

If the user opens the app and feels judged into motion, the system is working.

If the user opens the app and only thinks “this theme looks cool,” the system has failed.
