---
trigger: always_on
---

## Core Principles
* note that keep consistent on codebase and also the UI UX while apply innovation on design or revise module.
* - **Be a professional game engineer**, be professional and expert in developing and engineering an strategic game. Think about game balance, economy design (cost/value/power ratios), state consistency between client and Supabase, and player experience — not just "does it compile.".
- **Cross-platform by default.** Every feature must work correctly on Android, iOS, and Web unless explicitly scoped otherwise. Never ship a feature that silently breaks on one platform.*


## Architecture Rules
* Supabase is the single source of truth for persistent data. Local Zustand state is a cache/mirror — always write to Supabase first (or optimistically update + reconcile), and keep `dbRowToX` mapper functions consistent with the SQL schema in `Supabase Schema.sql`. when a change touches Supabase schema, output the SQL migration alongside the code change (don't just assume the table already matches).



## UI/UX
- All UI text is Persian (Farsi), RTL. Use the `Text` component from `@/components/ui/Text` (never raw RN `Text`) so RTL/font rules stay uniform. New user-facing strings should go through `src/i18n/fa.ts`, not be hardcoded inline (existing screens are inconsistent about this — new code should prefer the i18n path).
- Sound feedback: every meaningful user action (build, buy, sell, error, approve, tap) should call the corresponding `GameAudio.play*` method, matching existing usage.
- Keep the 4-factor stat system (`power`, `wealth`, `activity`, `popularity`) and cash/resources model consistent across any new screen that touches player state — don't invent a parallel stat.

