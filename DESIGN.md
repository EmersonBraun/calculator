# Design context

## Direction

Restrained, Apple-inspired precision: warm off-white canvas, ink-forward type,
one quiet blue accent, thin borders, generous rhythm, and a compact focused
work surface. The memorable detail is the calm result state and excellent error
recovery, not decoration.

## Tokens

- Display: `Sora` or another distinctive geometric sans available locally.
- Body: `DM Sans` or another readable sans available locally.
- Mono: `IBM Plex Mono` for operation labels and API-oriented details.
- Surfaces: warm white canvas, white work surface, cool tinted secondary surface.
- Text: deep navy ink, muted slate secondary text.
- Accent: accessible blue for primary actions and focus rings.
- Status: distinct accessible green for success and red/amber for errors/warnings.
- Spacing: 4/8/12/16/24/32/48px rhythm; controls at least 44px tall.
- Radius: one restrained medium radius for surfaces and controls.

## Composition

One responsive page: a quiet header, a short explanatory hero, then the
calculator work surface. On desktop the operation rail and form share a clear
grid; on mobile they stack. Result and error states are announced accessibly.

## Interaction rules

- Show exactly the operands needed by the selected operation.
- Keep labels visible; placeholders never carry meaning alone.
- Disable submission only while a request is in flight.
- Use inline validation and preserve values after API failures.
- Use CSS-only motion sparingly and honor `prefers-reduced-motion`.
- Never use gradients, glassmorphism, gratuitous cards, or fake dashboard chrome.
