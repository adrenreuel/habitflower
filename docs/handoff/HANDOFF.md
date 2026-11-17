# Habitflower: build handoff

This is the source of truth for building Habitflower. It replaces the older concept version of the app completely. Do not reuse its screens, navigation, naming or styles. Reuse low-level plumbing (project setup, build config) only if it fits what is described here.

Design references live in `design/` (one `.dc.html` file per screen). They are HTML mockups written in a small custom template language (`{{holes}}`, `<sc-for>`, `<sc-if>`, `<dc-import>`, and a `class Component` with `renderVals()` holding sample data and interactions). Treat them as the visual and behavioural spec: read them for exact colours, sizes, spacing, copy and states. Do not port that template syntax; rebuild the screens natively.

**Latest changes:** see `UPDATES-2026-11-16.md`. Where it differs from this file, the updates file wins.

---

## 1. Product in one paragraph

Habitflower is a habit and task app where every habit grows a flower. Check in and it grows from sprout to bud to bloom; miss days and it wilts, then dries up. Tasks are separate from habits (one-off or repeating, no streaks). Friends can see each other's HabitFlowers, react to photo check-ins, share tasks and grow a habit together. The app is anonymous by default and only ever uses usernames, never real names.

## 2. Tech direction

- Expo (React Native) with TypeScript, iOS first. Dev builds required (HealthKit, widgets).
- Widgets: WidgetKit via `@bacons/apple-targets`, sharing data through an App Group.
- Apple Health: `@kingstinct/react-native-healthkit`.
- Camera: in-app capture only (no photo library picker for check-ins). `expo-camera` or `react-native-vision-camera`.
- Backend: a small custom API on AWS EC2 (t4g.small): Node + TypeScript with Hono, Postgres, Docker Compose, Caddy for HTTPS. Anonymous accounts issued by the server on first launch; Sign in with Apple and Google linked by verifying their identity tokens and attaching them to the same account. S3 with presigned uploads for check-in photos (v1.1). Expo push service for remote notifications.
- v1 is local-first (SQLite); the backend is only needed from Account backup onward. The app talks to it through one API client module with URLs in env config.
- Push notifications: Expo Notifications (local for reminders; remote for social).
- Offline first for solo features: check-ins and tasks work offline and sync later.

## 3. Release scope

**v1 (MVP): solo app**
- Home grid, habit pages, check-in types: Check off, Count, List
- Check-in windows, schedules, reminders, edit, pause, Away mode
- Flowers: 8 kinds, growth, wilting, dried up, check-in celebration
- Tasks: list, detail, create, edit, repeat, checklist
- Widgets: small, medium, large
- First launch: anonymous account, Welcome, first habit, notification prompt
- Settings, Account (Apple/Google backup, delete account), Notification settings, Widgets help, Help and feedback
- Empty states

**v1.1: Friends**
- Usernames, add friend (search, invite link, QR), requests, close friends, manage, remove
- Friend's HabitFlowers page, Updates feed, reactions, Activity tab
- Photo check-in type and in-app camera, per-photo audience
- Report and block everywhere (Apple guideline 1.2), blocked list
- Back-up-first gate before any social action

**v1.2: Extras**
- Grow together (group habits), Apple Health check-in type, shared tasks and friend view
- Later: Lock Screen widget, interactive widget check-ins, Live Activity for windows

Build in this order. Keep v1.1/v1.2 data shapes in mind when designing the v1 schema.

---

## 4. Screen map

Tabs (bottom bar, 5 slots): **Habits**, **Tasks**, **+** (centre, raised), **Friends**, **Activity**. Settings is not a tab: it opens from the user's avatar in the top right of Home.

| Design file | Screen | Release |
|---|---|---|
| Welcome | First launch welcome | v1 |
| NotifPrompt | Pre-permission screen before the iOS notification prompt | v1 |
| Main | Home: My HabitFlowers | v1 |
| Detail | Habit page: Count (counter ring, celebration, offline banner tweak) | v1 |
| PushupsWindows | Habit page: Count with two check-in windows | v1 |
| ListDetail | Habit page: List check-in | v1 |
| HealthDetail | Habit page: Apple Health (auto check-in) | v1.2 |
| GroupDetail | Habit page: Grow together (your check-in, group list, nudge, leave) | v1.2 |
| GymDetail | Habit page: Photo, window open | v1.1 |
| GymClosed | Habit page: window not open yet (countdown) | v1 (pattern) |
| Camera | In-app camera for photo check-ins | v1.1 |
| ReviveDetail | Habit page: dried up, revive | v1 |
| EditHabit | Edit habit (incl. Pause, Delete) | v1 |
| Archived | Paused habits (glass dome, Restore) | v1 |
| CreateChooser | The + "Add new" bento sheet | v1 |
| NewHabit | New habit form | v1 |
| NewTask | New task form | v1 |
| Tasks | Tasks list | v1 |
| TaskDetail | Task detail | v1 |
| EditTask | Edit task (incl. Delete) | v1 |
| Friends | Friends: requests, invites, HabitFlowers cards, Updates feed | v1.1 |
| FriendFlowers | A friend's HabitFlowers (tweak: shares nothing) | v1.1 |
| SharedTask | Friend's read-only view of a shared task | v1.2 |
| AddFriend | Search by username, invite card with QR (tweak: no results) | v1.1 |
| FriendsGate | Pick username + back up, shown before first social action | v1.1 |
| ManageFriends | Close friends, friends list, remove/report/block | v1.1 |
| Notifications | Activity tab | v1.1 (personal notices can ship in v1) |
| Settings | Settings | v1 |
| Account | Account: backup card, username, blocked, delete | v1 |
| ChangeUsername | Change username (tweak: taken) | v1.1 |
| NotifSettings | Notification settings | v1 |
| WidgetsHelp | How to add the widget | v1 |
| HelpFeedback | FAQ + send feedback | v1 |
| HabitsEmpty / TasksEmpty / FriendsEmpty / ActivityEmpty | Empty states | v1 / v1.1 |
| WidgetSmall / WidgetMedium / WidgetLarge | iOS widgets | v1 |
| FlowerSheet / FlowerStates / Flower | Every flower in every state; the shared flower drawing | v1 |

"Tweak" means the mockup has a toggle (`data-props`) for an alternate state.

---

## 5. Design system

**Typefaces:** Young Serif (Google Fonts, single weight 400, letter-spacing -0.3px) for display text only: page titles, the habit name on habit pages, celebration headlines, Welcome and notification prompt headlines, camera "Checked in" and empty-state titles. Plus Jakarta Sans (400 to 800) for everything else. Page titles 30 to 32px. Section headings on pages 18px/700 sentence case. Small labels in forms, grouped lists and card labels 13px/800 uppercase, letter-spacing 0.6px.

**Colours**
| Token | Value | Use |
|---|---|---|
| bg | #1F1023 | Screen background |
| bg-deep | #180B1B | Tab bar |
| sheet | #241628 | Bottom sheets, widgets |
| card | #2A1C2F | Cards, rows, inputs |
| raised | #3A2A40 | Chips, secondary buttons, controls on cards |
| divider | #3D2D43 | Dividers, count pills, tracks |
| text | #F6EEF8 | Primary text |
| text-2 | #B9A8C0 | Secondary text |
| text-3 | #8C7992 | Tertiary text (consider #A895AE for small text contrast) |
| accent | #74D447 | Primary actions, done, brand |
| accent-tint | rgba(116,212,71,0.22) bg, #B8EE98 text | Selected state, secondary positive buttons |
| missed | rgba(255,158,107,0.24) bg, #FFB894 text | Missed days (filled, never outlined) |
| wilting text | #FFB894 | |
| dried up | #FF7B7B | Dried up, destructive actions |
| paused | blue diagonal stripes rgba(122,167,255,0.26/0.10), #A9C6FF | Paused / Away days |
| away / info | rgba(122,167,255,0.14 to 0.22), #A9C6FF | Away mode, nudge |

**Flower colours:** sunflower #FFC93C, daisy #F7F2EA, tulip #FF6B8A, rose #E8455A, spider lily #FF5A4E, lavender #A98BEA, blossom #FFB7C9, marigold #FF9F1C. A habit page uses its flower colour as its accent (ring, buttons, calendar fills).

**Shape and spacing:** page padding 20px. Cards radius 22 to 24. Chips radius 20, height 40. Pill buttons height 52 to 60, radius = half height. Sheets radius 28 top corners with a 40×5 grab handle. Tap targets at least 44×44.

**Rules**
- No outlines for selection or containers. Use tinted fills.
- Primary action: solid accent (or the habit's flower colour). Secondary: `raised`. Selected: accent-tint.
- Lists inside a card are separated by 1px `divider` lines.
- Choices with more than a few options or with sub-settings open a bottom sheet from a row (pattern used for check-in type, repeat, sharing, grow together).

**Copy rules**
- Minimal text. No em dashes and no "·" separators.
- Always say "HabitFlowers" (never garden, blooms list, circle).
- Say "check in", not "water". The only watering words left: the "Watered" reaction.
- Usernames only, written as `@username`. No real names anywhere, no initials suggesting names (letter avatars use the first letter of the username).
- Dates: "Sat, Nov 21", "Today, 6:00 PM". Week starts on Sunday by default.

---

## 6. Flowers and growth rules

- 8 flower kinds, all unlocked. User picks one per habit and can change it in Edit; progress stays with the habit.
- Stages: **sprout → bud → bloom**. Each scheduled day completed grows it one stage.
- Once in bloom, a **bloom count** shows days in bloom ("In bloom for 4 days" chip on habit pages; small number pill on home cards and widgets).
- **Wilting:** 1 missed scheduled day. The flower droops and fades; the bloom count pauses. Next check-in returns it to its previous state.
- **Dried up:** 2 missed scheduled days in a row. Drawn as a brown sprout for every kind. Bloom count resets. Next check-in brings it back as a **bud**.
- Days that never count against a flower: unscheduled (rest) days, paused habits, Away mode days.
- A partially completed day (e.g. 2 of 3, or 3 of 4 list items) counts as a miss.
- **New day starts at** 12, 2 or 4 AM (Settings). Check-ins before that time count for the previous day.
- Flower drawing: see `design/Flower.dc.html` (props `kind`, `stage` seed/bud/bloom, `health` ok/wilt/dormant, `size`, `soil` on/off). The soil stays level in every state; wilting is a dedicated drooping drawing, not a rotation.

**Check-in celebration:** when a check-in completes the day or grows a stage, show a full-screen moment (flower pops in with sparkles, short line, one button). Group habits show "You're checked in. 2 of 3 done. It grows when @x checks in." with a Nudge button.

---

## 7. Habits

**Create/Edit fields (in this order)**
1. Name (no visible label)
2. Your flower: 4×2 grid of the 8 kinds; "How to grow?" button opens the growing guide sheet
3. Grow together (v1.2): row showing "Just me" or "With @x" / "With N friends" with stacked avatars; opens a friend picker sheet
4. How you check in: a row that opens a sheet with 5 types, then the type's settings inline:
   - **Check off:** tap once
   - **Count:** times a day (or per window), stepper 2 to 20
   - **List:** editable list of items; every item must be checked
   - **Photo:** 1 to 8 photos (defaults to 1 when chosen), in-app camera only
   - **Health:** Apple Health metric (Steps, Exercise, Move, Distance) and a daily goal; checks in automatically
5. Schedule: Every day / Specific days / N days a week
6. Check-in window: optional, up to 3 windows. With 2+ windows: **Per window** (count/list/photos repeat in each window, e.g. "Photos per window" with a daily total) or **Any window**. Non-photo habits allow check-in up to 1 hour after a window ends. Photo habits only during the window ("Check-in is only available during these times.")
7. Reminders: up to 5 times
8. Sharing: **Progress** (Everyone or specific friends) and, for photo habits, **Check-in photos** (Same as above, Close friends, Only me). A single photo can be narrowed further, never widened.
9. Edit only: **Pause habit** (glass dome, restorable from Paused habits) and **Delete habit** (confirmation offers "Pause instead").

Sticky footer: Cancel / Create habit (or "Create and invite" for group habits, "Save changes" in Edit).

A habit with different lists per window should be two habits (e.g. Morning workout, Evening workout). Do not build per-window lists.

**Home (Main)**
- Header: date, "My HabitFlowers", avatar (opens Settings).
- Away mode banner when on: "Away mode is on / Nothing wilts while you're away" with Turn off.
- Sections: due now as a 2-column grid with no heading (wilting first, then dried up, then others); then horizontal rows "Later today (n)", "Complete (n)", "Another day (n)" (dimmed, no chip).
- Card: flower tile with bloom count pill, status chip (progress like 1/3, Done, Snap, a time with clock icon for later, hidden for rest days), name, meta line (schedule, or Wilting/Dried up in their colours), 7-day dots. Group habits show stacked member avatars on the meta line.
- Home is read-only: tapping a card opens the habit page. (Planned: long-press menu with Check in, Edit, Pause.)
- "Paused habits" link at the bottom.

**Habit page**: header (back, Edit with pencil), flower hero with "In bloom for X days" chip, type-specific Today card, This week strip, stats (Best streak "9 days", Days in Nov), month calendar with legend (Done, Partly, Missed, Paused) below the grid, settings rows (reminders, sharing, window).
- Count: ring with − / + buttons.
- List: progress bar and checkable rows.
- Photo: "Snap a photo" button, "Open until 8:00 PM", "Sharing with" picker; done state shows the photo with ⋯ menu (who can see it, retake, undo). Recent check-ins strip.
- Window not open yet: "Opens in 1h 24m" countdown (live, minutes only in the last hour) with the action button shown disabled.
- Health: ring with live value, "Synced 2 min ago", no button; "Checked in automatically" when reached.
- Group: your check-in card, then Group list with each member's status and a Nudge button (1 per person per day), Leave at the bottom (others keep growing; you keep your history; they see you left).
- Dried up: "Your Daisy dried up / You missed 6 days in a row", "Check in to revive".
- Offline: banner "You're offline. Check-ins will sync later."

**Camera**: close, habit name + window end time, flash; segmented progress for multi-photo; viewfinder with audience pill; thumbnail, shutter, flip; review with Retake / Next photo / Check in; finish screen with the flower.

**Away mode** (Settings): one switch; while on nothing wilts or dries up, bloom counts freeze, reminders pause, calendar marks those days as paused.

---

## 8. Tasks

- Separate from habits. No streaks or flowers.
- Fields: name, notes, **When** chips (Today, Tomorrow, Pick date which shows the chosen date once picked, No date) plus optional time, **Repeat** row opening a sheet (Never, Daily, Weekly with day picker, Monthly, Custom: every N days/weeks/months, count from due date or from when I finish), Checklist, Share with friends (v1.2).
- List sections with counts in brackets: Overdue (n), Today (n), Upcoming (n), Other (n). Repeating tasks show their next due. Checklist tasks expand.
- Detail: title and notes, Due / Repeats / Shared with rows, checkable checklist with Add item, footer "Mark as done" (repeating: "Done. Next one Sat, Nov 21" with Undo).
- Edit: same form as New, "Save changes", Delete with confirmation (mentions future repeats).
- Finished shared tasks post to friends' Updates feed (v1.2).

---

## 9. Friends (v1.1)

- Add by exact username, invite link, or QR code (Add a friend screen shows your own 3×2 HabitFlowers card with a QR toggle, Copy link, Invite). Requests must be accepted.
- Friends screen: pinned friend requests and grow-together invites (Join/Decline), "HabitFlowers" row of friend cards (3×2 flowers, "x of y today", sorted by completion, flowers sorted by bloom count with dried up last), "+ Add friend" card, then **Updates**: photo check-in posts and finished shared tasks only. No bloom posts.
- Posts: avatar, username, timestamp right-aligned, ⋯ (Report post, Block). React button opens a popup: Love, Fire, Sparkle, Watered; stacked reactions shown on the left.
- Close friends list (Manage friends). Friend's HabitFlowers page uses the home card style, view only, ⋯ menu (Remove friend, Report, Block).
- Report flow: "Thanks for telling us" plus option to block. Block confirmation explains they can't find, add or see you, and won't be told. Unblock from Account → Blocked.
- Only habits shared with a friend are visible to them.

## 10. Activity tab

Personal and social notifications in New / Earlier: nudges (with Check in), window closing (with Snap), wilting, milestones (blooms, bloom streaks 7/30/100), reactions (photo thumbnail), requests accepted, members joining or leaving a group habit, shared tasks finished. Tab badge shows the unread count. Empty state "All quiet".

## 11. Accounts and onboarding

- First launch silently creates an anonymous account. Flow: Welcome ("Grow your habits into flowers", "Check in regularly to help them bloom.", Get started, "I already have an account"; illustration is one sunflower as sprout, bud, bloom at 72/92/112px, centred in a 300×220 tile) → New habit → notifications prompt → Home.
- Backup: link Apple or Google from Account ("Back up your HabitFlowers", "Not backed up" until linked). Prompt to back up after the first bloom. Unlinked accounts are lost if the app is deleted.
- Social features require a username plus a linked account first (FriendsGate sheet).
- Username: changeable once every 30 days, shows available/taken, Save disabled while taken.
- Delete account available for every account, including anonymous ones.

## 12. Settings

Avatar card (opens Account); Notifications (opens Notification settings); Apple Health; Widgets (help page); Away mode switch; Paused habits; Week starts on (Sunday default); New day starts at; Help and feedback; Sign out.

Notification settings: Your habits (Reminders, Window closing, Wilting, Milestones) and Friends (Nudges, Reactions, Requests and invites, Friend posts off by default). No quiet hours (iOS Focus covers it).

## 13. Widgets

- Title "My HabitFlowers". Medium/large show "5 left today"; small shows no count.
- Six flowers in their real stage and health. No habit names.
- Due today: small green down chevron above the flower, no circle. Done: green check badge. Rest day: moon. Later today: clock. Count pills show bloom days. Large shows a status line under each flower ("Dried up" in red, "Wilting" in coral).
- Tap a flower to open that habit; tap elsewhere to open Habits.

---

## 14. Data model sketch

- `User`: id, username (unique, nullable until social), avatarSeed, linkedProviders, settings (weekStart, dayResetHour, away, notification prefs).
- `Habit`: id, ownerId, groupId?, name, flowerKind, checkinType, config (count target, list items, photoCount, healthMetric, healthGoal), schedule (daily/days/perWeek), windows[{start,end}] up to 3, windowMode (per/any), reminders[], sharing (progress audience, photo audience), pausedAt?, deletedAt?, createdAt.
- `CheckIn`: id, habitId, userId, localDay, windowIndex?, value (count / items / photoIds / healthValue), createdAt, syncedAt.
- `FlowerState` (derived, cached): stage, health, bloomDays, lastEvaluatedDay. Recompute from check-ins plus schedule, pause and away ranges.
- `AwayRange`, `PauseRange`: start, end.
- `Task`: id, ownerId, title, notes, due (date, time?), repeat rule, checklist[{label, done}], sharedWith[], completedAt, nextDue.
- `Friendship`: userA, userB, status (pending/accepted), closeFriend flags per side. `Block`, `Report`.
- `Group` (grow together): id, habitId, members[], createdBy. `Nudge`: from, to, habitId, day (unique per day).
- `Post` (photo check-in or finished shared task), `Reaction` (type: love/fire/sparkle/watered), `Notification`.

## 15. Deferred ideas (do not build yet)

- Generated abstract avatars from the username with a Shuffle option, replacing letter avatars.
- Long-press quick actions on home cards, swipe actions on tasks, undo toast after check-in.
- Lock Screen widget, interactive widget check-ins, Live Activity for windows.
- Monetization: no ads, no paywalls. Possibly an optional donation or cosmetic supporter tier (themes, app icons, an exclusive flower).
