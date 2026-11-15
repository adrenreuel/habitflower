# HabitFlower — Product & Design Context

Briefing for an agent responsible for UI design, UX, feature planning, branding, and user research.
Snapshot as of 2026-11-14 (branch `develop`). Code lives in `app/HabitFlower/`.

Statements are tagged where it matters:
- **[Fact]** — true in the current code/repo.
- **[Inferred]** — reasonable reading of the evidence, not confirmed by the owner.
- **[Open]** — undecided; yours to propose, owner to confirm.

---

## 1. Product in one paragraph

HabitFlower is a **social habit tracker where growth is visible**. Users create daily routines, invite friends into their "circle", and stay accountable together. Each completed habit helps the user's flower bloom — blending discipline with encouragement into a simple, motivating experience built for consistency. (Owner's own pitch, from `README.md`.)

Three pillars:
1. **Habits** — recurring routines with visible daily/weekly progress.
2. **Tasks** — one-off to-dos with optional date/time and subtasks.
3. **Circle** — friends and an activity feed for accountability.

The **flower metaphor** is the brand's core idea: progress = growth. It is only lightly expressed in the UI so far (see §6).

## 2. Platform & constraints

- **[Fact] Mobile-first native app** (iOS + Android) built with Expo 54 / React Native 0.81 / expo-router / TypeScript. The owner considered a web-first build and **explicitly chose mobile**; Expo's web output may serve as a secondary surface (e.g. invite links), not a separate product.
- **[Fact] Portrait only.** Light/dark follows the system setting automatically.
- **[Fact] Data is stored locally on the device** (AsyncStorage). No accounts, no backend, no sync yet — social features are mock data.
- **[Fact] Icon set: FontAwesome 6 (solid).** Fonts: system default only; no custom typeface.
- Designs should be implementable with React Native primitives (View/Text/Pressable, flexbox, `react-native-svg`, `react-native-reanimated` available). Avoid effects that need heavy native modules unless justified.

## 3. Audience & user needs

- **[Open] No target demographic has been defined.** No personas, research, or analytics exist.
- **[Inferred]** Sample content (gym splits, "finish the math assignment before class", practicing music scales, grocery runs) and the friend-accountability angle suggest **students and young adults** building self-improvement routines, likely motivated by social encouragement rather than quantified-self rigor.
- **[Inferred] Core jobs-to-be-done:**
  - "Check off today's habits in a few seconds."
  - "See at a glance whether I'm keeping up this week."
  - "Feel rewarded for consistency, not punished for a miss."
  - "Know my friends are doing it too / have someone notice."
  - "Capture a to-do quickly without a heavy planner."
- Suggested first deliverable for you: proposed personas + confirm/refute the inferred audience with the owner.

## 4. Information architecture (current)

Bottom tab bar, **icons only, no labels** [Fact]:

| Tab | Icon (FA6) | Screen title | File |
|---|---|---|---|
| Overview / Habits | `repeat` | "My Habits" | `app/(tabs)/index.tsx` |
| Tasks | `list` | "My Tasks" | `app/(tabs)/tasks.tsx` |
| My Circle | `circle` | "My Circle" | `app/(tabs)/circle.tsx` |
| Settings | `gear` | "Settings" | `app/(tabs)/settings.tsx` |

Plus a full-screen **Create Task** page (`app/create-task.tsx`) pushed from Tasks.

## 5. Screens & features — what exists

### 5.1 My Habits
- Header: small date label ("Sat 14 Nov") above a 28pt bold title.
- **Today / Upcoming** segmented toggle (two pill buttons). *Visual only — both show all habits; no scheduling filter.*
- One **card per habit**, containing:
  - **Weekly strip**: 7 pill-shaped cells Sun→Sat with day labels. Today's label is bold + tinted with a small chevron; today's cell is outlined. Each cell's fill opacity = that day's completion (0.2 + 0.8 × fraction); empty days are a faint 4–6% tint.
  - Seedling icon (same for every habit), title, "X days completed" (sum of daily fractions, e.g. 12.5), and a schedule line ("5 days / week", "Mon: 2x, Wed: 3x").
  - A control on the right that depends on habit type.
- **Three habit types** [Fact]:
  | Type | Control | Today's fraction |
  |---|---|---|
  | Check | 32px round checkbox | 0 or 1 |
  | Count | −  `cur/target`  + (28px rounded-square buttons; disabled state = outline) | cur / target |
  | Checklist | "2/3" text; list of today's items below, each with a checkbox + strike-through. "Rest day" when no items today. | done / items |
  - Count targets can vary by weekday; checklist items are defined per weekday (e.g. a gym split).
- **Each habit has its own colour** (used for strip, checkbox, counter). Current palette: `#6B3F69` plum, `#4BAF17` green, `#FFB020` amber, `#3B82F6` blue.
- Floating "+ New Habit" pill button bottom-right. *Placeholder — no create-habit flow exists.*

### 5.2 My Tasks
- Same header pattern; **Pending / Completed** toggle.
- Task card: clipboard icon tile, title, formatted date/time, description, optional subtasks with their own checkboxes.
- **Completion micro-interaction**: ticking a task makes the card blink 3× (~0.9s) then it moves to Completed after 1.3s; un-ticking during the blink cancels. Completed tasks can be un-ticked back to Pending.
- Empty state: large inbox icon + "No pending tasks" / "No completed tasks".
- Floating "+ New Task" button → Create Task.
- *Missing:* edit, delete, sorting/grouping by date, overdue state.

### 5.3 Create Task
- iOS-style header: Cancel · "New Task" · Save (tinted, bold).
- Title (required, 100 chars), Notes (500 chars, multiline).
- **Date** card with a custom toggle switch → reveals a date picker button (inline spinner on iOS, dialog on Android).
- **Time** card with toggle (turning time on also turns date on).
- **Subtasks**: add/edit/remove rows (red trash icon), outlined "+ Add subtask" button.
- Validation is a native `alert()` for missing title.

### 5.4 My Circle *(all mock data)*
- Title + "+ Add Friend" button (placeholder).
- Horizontal carousel of friend cards (140×160): grey placeholder avatar, username, "5 habits".
- "Activity" list: text rows like "batman completed a streak" with "2h ago". Names are placeholders.

### 5.5 Settings
- Unstyled placeholder text. Nothing implemented.

## 6. Brand & visual language

### 6.1 Colour tokens (`constants/theme.ts`) [Fact]

| Token | Light | Dark |
|---|---|---|
| background | `#FEF3FF` pale pink-lilac | `#1F0F20` deep plum-black |
| text | `#6B3F69` plum | `#FEF3FF` |
| tint (primary accent) | `#6B3F69` plum | `#4BAF17` leaf green |
| navbar | `#6B3F69` | `#190C1A` |
| icon / muted | `#9B6B8F` | `#B99FC0` |

Surfaces: cards are `rgba(255,255,255,0.9)` (light) / `rgba(255,255,255,0.06)` (dark), 12px radius, no shadow, no border (except Create Task cards, which have a 1px 10% border).

**Brand reading [Inferred]:** plum + pale lilac = soft, warm, petal-like; leaf green = growth. Note the primary accent **switches identity between modes** (plum in light, green in dark) — worth a deliberate decision.

### 6.2 Flower assets (`assets/images/sprites/`, 32×32 SVG, gradient-rich illustrative style)
- Growth stages: `0.svg` seedling (the only one in use), `1.svg` sprout/young plant (greens `#7AAD33`, `#497426`).
- Bloomed flowers: `blossom_color` (soft lilac `#D2B9DA`), `hibiscus_color` (magenta `#F03EBD`/`#EA2195`), `hyacinth_color` (violet `#802AFC`/`#522699`), `rose_color` (red `#EB4A49`/`#C42A3D`), `sunflower_color` (brown centre `#63332A`, yellow), `tulip_color`.
- **[Open] The growth system is not designed yet**: how many stages, what drives progression (streak? days completed? weekly target hit?), whether each habit has its own flower or the user has one garden, what happens on missed days (wilt? pause?), and how flower type is chosen. This is the biggest brand opportunity.

### 6.3 Typography [Fact]
System font. Sizes in use: 28 bold (screen titles), 20 (section), 18 (header/empty state), 16 bold (card titles), 15 (list items), 14 (labels/buttons), 12 (meta), 11 (day labels). No defined type scale or font tokens.

### 6.4 Recurring components
Screen header (date + title) · segmented pill toggle · content card · round checkbox (✓ text glyph) · counter stepper · floating action pill · toggle switch · picker button (icon + value) · empty state · weekly strip.

### 6.5 Spacing & shape
16px screen padding, 12px card padding and gaps, 8px small gaps. Radii: 8 (inputs/buttons), 12 (cards), full (checkbox, FAB, cells).

## 7. Known UX / UI issues to address

1. **Non-functional controls**: "+ New Habit", "+ Add Friend", Today/Upcoming toggle, Settings.
2. **No create/edit/delete for habits**; tasks can't be edited or deleted.
3. **Flower metaphor is barely present** — every habit shows the same seedling; nothing grows.
4. **Tab bar has no labels**; `circle` and `repeat` icons are ambiguous.
5. **Dark mode gaps**: inactive toggle-pill border is `rgba(0,0,0,0.2)` (invisible on dark); Settings screen ignores theme.
6. **Contrast**: white ✓ on amber `#FFB020` is low-contrast; habit palette isn't validated for either mode.
7. **Touch targets**: counter buttons are 28px (below 44pt iOS / 48dp Android guidance). No accessibility labels on checkboxes/steppers.
8. **No onboarding**, no first-run explanation of habit types or the flower concept.
9. **No reminders/notifications** — central to habit apps and to the decision to go native.
10. Week starts on Sunday (hardcoded) — may not suit all locales.
11. Validation uses a blocking system alert rather than inline feedback.

## 8. Roadmap signals

Owner-stated next steps (README / conversation): persistence ✅ (local, done) → **create-habit flow** (next) → richer social (invites, real feed, sharing) → cloud sync/accounts → animations.

**[Open] items to plan:**
- Create/edit habit UX for three types, incl. per-weekday counts and checklist items.
- Flower growth system & reward loop (see §6.2).
- Streaks and how misses are treated (supportive vs. strict tone).
- Circle: what's shared, privacy defaults, reactions/nudges, invite flow (likely via link).
- Reminders: per-habit times, notification tone/copy.
- Upcoming view semantics.
- Settings contents (theme, week start, notifications, account, data export).
- Brand: name treatment/logo, app icon (currently Expo default), splash, voice & tone, accent consistency across modes.

## 9. Data model (for feasibility)

```ts
Habit  { id, title, type: "check" | "count" | "checklist", color,
         daysPerWeek?, target?, timesByDay?: {Mon: 2, ...},
         tasksByDay?: {Mon: ["Bench press", ...]}, createdAt }
HabitLog  habitId → "YYYY-MM-DD" → { done?, count?, tasks?: {item: bool} }
Task   { id, title, description?, datetime?, subtasks: [{id, text, done}],
         done, completedAt?, createdAt }
```
Full history per day is stored, so designs may use streaks, monthly heatmaps, or growth based on cumulative completion.

## 10. How to hand work back

Engineering implements in React Native, so the most useful outputs are:
- Updated design tokens (colours for light + dark, type scale, spacing, radii) expressed as values that map onto `constants/theme.ts`.
- Screen specs/flows with states (empty, loading, error, completed, dark mode).
- Component specs reusing §6.4 where possible.
- Clear decisions on the **[Open]** items above, flagged when they need owner sign-off.
