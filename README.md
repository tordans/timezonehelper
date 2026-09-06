# Timing Sparks

A Vite + React 19 SPA for comparing timezones and dragging a meeting range. URL search params are the source of truth, so a link is a shareable view.

This is a **Vite SPA** (not TanStack Start, not Next.js). App runtime is **Bun**. Node is only documented for tools that still spawn Node (Prisma, Playwright) — this repo does not use those.

## Requirements

- [Bun](https://bun.sh) ≥ 1.3.14
- Optional: Node 24 LTS via `nvm use` (see `.nvmrc`) if you add Prisma or Playwright later

## Setup

```bash
bun install
bun run dev
```

## Scripts

| Script                    | Role                                                     |
| ------------------------- | -------------------------------------------------------- |
| `dev`                     | Vite dev server (`bun --bun`)                            |
| `build`                   | Production client build                                  |
| `preview`                 | Preview the production build                             |
| `type-check`              | `tsc --noEmit` (TypeScript 7)                            |
| `lint` / `lint-check`     | Oxlint (mutating / CI read-only)                         |
| `format` / `format-check` | oxfmt (mutating / CI read-only)                          |
| `test-run`                | Vitest                                                   |
| `knip` / `knip-warn`      | Unused files/deps (strict / advisory)                    |
| `check`                   | Local verify: type-check, lint, format, tests, knip-warn |
| `check-ci`                | Read-only CI verify                                      |
| `check-pre-push`          | Mutating verify including strict knip                    |

## Stack

- React 19 + Vite 8, React Compiler via `@vitejs/plugin-react` (`compiler: true`)
- TanStack Router search params (Zod 4) — not nuqs
- TanStack Query for timezone search
- Zustand for ephemeral UI (search box, drag, clock tick)
- Tailwind CSS v4
