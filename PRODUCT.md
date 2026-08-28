# Product context

## Audience

A technical evaluator reviewing a full-stack calculator project. The
interface should communicate engineering judgment immediately: predictable
behavior, clear failure states, and no unnecessary product surface.

## Job to be done

Enter values with a familiar calculator keypad, chain operations, and receive a
precise result from a real Go service. The UI should make recovery from invalid
input effortless.

## Success

- A reviewer can understand and use the calculator without instructions.
- Required and optional operations behave deterministically.
- Invalid requests fail with useful, stable feedback.
- The same contract works from the browser and directly over HTTP.

## Explicitly not the product

No accounts, history, saved calculations, payments, database, analytics, chat,
agent runtime, or cloud deployment.
