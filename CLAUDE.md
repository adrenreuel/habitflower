# Habitflower

Habit and task app where every habit grows a flower. **Source of truth: `docs/handoff/HANDOFF.md`, with `docs/handoff/UPDATES-2026-11-16.md` winning where they differ** (unzipped from `docs/habitflower-handoff.zip`). Mockups: `docs/handoff/design/*.dc.html`, one per screen. Read them for exact colours, sizes, copy and states, but never port their template syntax (`{{ }}`, `<sc-for>`, `<sc-if>`, `<dc-import>`); rebuild screens natively. `docs/design-context.md` describes the old, scrapped concept. Ignore it.

## Layout

- `app/HabitFlower/`: Expo SDK 54 (React Native, TypeScript, expo-router). iOS first; dev builds required (widgets, notifications, Sign in with Apple).
  - `app/`: routes only (thin). `(tabs)` = Habits, Tasks, Friends, Activity, with a custom bar and raised + in the middle. Settings opens from the gear button top right on Home (owner decision; HANDOFF says avatar).
  - `src/theme/tokens.ts`: **the only place raw colours live.** Everything else uses tokens.
  - `src/flower/Flower.tsx`: the shared flower drawing (kind, stage `seed|bud|bloom`, health `ok|wilt|dormant`, size). Ported from `Flower.dc.html`.
  - `src/domain/`: pure, unit-tested logic: `day.ts` (local day and reset hour), `schedule.ts` (day status), `flower.ts` (growth rules), `windows.ts`, `tasks.ts`, `checkin.ts`, `notifications.ts`, `rules.ts` (which schedule/windows applied on a day; edit rules), `moments.ts` (growth moments), `sharing.ts` (v1.1 name lists, history audience). No React or I/O here.
  - `src/data/`: SQLite (expo-sqlite). Each table stores the domain object as JSON plus sync columns.
  - `src/state/`: zustand store (writes through to SQLite), `selectors.ts` (derived views), `effects.ts` (notifications, Activity notices, widget snapshot, sync).
  - `src/api/`: **the only module that talks to the server** (`client.ts`), plus `sync.ts` and `auth.ts`. URLs and keys come from `EXPO_PUBLIC_*` env (`.env.example`), never hardcoded.
  - `src/ui/`: primitives (Text, Button, Card/Group/Row, Chip, Sheet, Stepper, Icon...). `src/features/`: screen bodies.
  - `targets/widget/`: SwiftUI WidgetKit extension (`@bacons/apple-targets` 4.x for SDK 54). Flower images are generated from the design file: `node scripts/gen-widget-flowers.mjs`.
- `server/`: Node + TypeScript + Hono + Postgres, Docker Compose + Caddy on AWS EC2 t4g.small. See `server/DEPLOY.md`. No Supabase or Firebase.

## Commands

```bash
cd app/HabitFlower
npm test            # domain rules, copy rules, token rule
npm run typecheck
npx expo lint
npx expo run:ios    # dev build (prebuild output in /ios is generated, git-ignored)

cd server
TEST_DATABASE_URL=postgres://... npm test   # integration tests need a Postgres
npm run typecheck
```

## Design rules

- Tokens from HANDOFF section 5 only. Page padding 20, cards radius 22 to 24, chips 40 tall with radius 20, pill buttons 52 to 60 tall with radius half the height, sheets with 28 top radius and a 40x5 handle, tap targets at least 44.
- **No outlines for selection or containers. Selected = tinted fill** (`accentTint` / `accentTintText`). Primary = solid accent (or the habit's flower colour on its page). Secondary = `raised`.
- Lists inside a card are separated by 1px `divider` lines.
- Options with sub-settings open a bottom sheet from a row.
- Fonts: **Young Serif** (one weight, 400, letter-spacing -0.3) for display text only, via `<Text display>`: page titles, the habit name on habit pages, celebration headlines, Welcome and notification-prompt headlines, the camera "Checked in" screen, empty-state titles. Sizes: page titles 30 to 32, empty-state titles 22, celebration 28. Everything else is **Plus Jakarta Sans** via `<Text weight=...>`: body, labels, buttons, chips, stats, section headings ("This week", "Checklist"). Labels are 13/800 uppercase via `<Text label>`.

## Copy rules (enforced by `src/domain/__tests__/copy.test.ts`)

- Say **"HabitFlowers"**, never garden, blooms list or circle.
- Say **"check in"**, never water. The only watering word is the "Watered" reaction.
- **Usernames only** (`@username`), never real names.
- Avatars are generated with DiceBear "Loops" (`src/ui/Avatar.tsx`, seeded from `user.avatarSeed`, Shuffle on Account; shown on Settings and Account, not on Home). No letter avatars. `@dicebear/core` needs the `structuredClone` polyfill in `src/polyfills/`.
- **No em dashes and no "·".** Keep text minimal.
- Dates: "Sat, Nov 21", "Today, 6:00 PM". Week starts Sunday by default.

## Flower rules (in `src/domain/flower.ts` + `schedule.ts`, tested)

- sprout -> bud -> bloom, one stage per completed scheduled day. The day it blooms counts as bloom day 1 but the habit page chip says "Just bloomed"; the next day is "In bloom for 2 days". Home cards and the widget show no number until day 2.
- 1 missed scheduled day: bud and bloom **wilt** (bloom count pauses). A **sprout has no wilting**: 1 miss dries it up.
- 2 misses in a row: **dried up** (bloom count resets). Revive: dried-up bud/bloom comes back as a bud, a dried-up sprout as a sprout.
- A recovery check-in (from wilting or dried up) only restores. Nothing extra that day.
- Partial days are misses. Rest days, paused days and Away days never count. The day a habit is planted can only help.
- "N days a week": a day is a miss only once the weekly target can no longer be reached. The target is capped by the days available that week.
- New day starts at 12, 2 or 4 AM; check-ins before that count for the previous day.
- Edits: check-in type is locked after creation; schedule changes start tomorrow; windows, count and list apply from today. Past days are always judged by the rules in force that day (`pastSchedules` / `pastSlots`, see `rules.ts`). Never recalculate past days.
- Check-ins are one row per habit, day and slot (window index in per-window mode). `complete` is stored at write time so later config edits don't rewrite history.

## Release scope

- Onboarding is Welcome -> notification prompt -> Home. **No habit form during onboarding** (owner decision; overrides HANDOFF section 11). New users land on the HabitsEmpty Home.
- **v1 (now)**: solo app, check-in types Check off, Count, List. Photo and Health are hidden. Friends tab shows "coming soon"; Activity shows personal notices only. Grow together and Sharing rows are hidden.
- **v1.1**: friends, photo check-ins and camera, feed, reactions, report/block. Server tables are drafted in `server/migrations/next/`.
- **v1.2**: grow together, Apple Health, shared tasks.
- Keep the v1.1/v1.2 fields in `src/domain/types.ts` when changing schemas (`groupId`, `sharing`, `sharedWith`, `photoAudience`, `username`).

## Working agreements

- Ask before guessing when the handoff is ambiguous.
- Commit only when asked. Work happens on `rebuild/v1`.
