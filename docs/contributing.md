# Contributing

## Principles

- Keep the MVP small and modular.
- Prefer thin route handlers and pure service functions.
- Add one simulation type at a time behind stable interfaces.
- Keep frontend state shallow and serializable.

## Backend conventions

- `routes/` owns HTTP concerns only.
- `services/` owns orchestration.
- `simulation/` owns computation.
- `models/` owns request and response contracts.

## Frontend conventions

- `app/` owns routing and page composition.
- `components/` owns reusable UI.
- `lib/` owns API utilities, types, and session helpers.

## Commit style

- Use small, milestone-oriented commits.
- Prefer commit messages that describe user-visible capability or architectural progress.
