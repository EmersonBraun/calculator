# Design context

## Direction

Restrained, Apple-inspired precision: a soft neutral canvas around one compact
charcoal calculator, circular gray keys, orange operation keys, clear focus
rings, and no surrounding product chrome. The memorable detail is familiar
calculator behavior and excellent error recovery, not decoration.

## Tokens

- Display and keys: native system monospace stack for consistent, offline rendering.
- Body: native system sans-serif stack.
- Surfaces: soft gray canvas and charcoal calculator body.
- Text: near-white primary text and muted gray secondary text.
- Accent: orange operation keys and accessible blue focus rings.
- Status: distinct accessible green for success and red/amber for errors/warnings.
- Spacing: 4/8/12/16/24/32/48px rhythm; controls at least 44px tall.
- Radius: one restrained medium radius for surfaces and controls.

## Composition

One responsive page centered on a focused calculator surface with a large
display and familiar four-column keypad. The required operations are visible
at a glance; power and square root sit in a small secondary strip below the
primary controls. Result and error states are announced accessibly.

## Interaction rules

- Keep the display and keypad behavior familiar: clear, backspace, sign,
  decimal, chained binary operations, and equals.
- Submit each confirmed operation to the Go API; never calculate a different
  result locally and silently replace the service result.
- Disable controls only while a request is in flight.
- Use inline validation and preserve the current display after API failures.
- Use CSS-only motion sparingly and honor `prefers-reduced-motion`.
- Never use gradients, glassmorphism, gratuitous cards, or fake dashboard chrome.
