# HabitFlower

HabitFlower is a social habit tracker where growth is visible. Create daily routines, invite friends into your circle, and stay accountable together. Each completed habit helps your flower bloom, blending discipline and encouragement into a simple, motivating experience built for consistency.

## Features

- **Habits:** Create and track habits with multiple interaction types:
  - Checkbox habits: mark a habit complete for today and watch the "contribution" cell for today fill with the habit's color.
  - Count-based habits: record a number (e.g. 1/3) for today's progress — the app maps the fraction to the cell opacity so partial completion is visible.
  - Per-habit colors, a compact contribution visualizer, and a concise summary (days completed).

- **To-dos:** Lightweight to-do list with useful fields:
  - Title, optional date/time, optional description.
  - Optional sublists (checklist items) — each subitem has its own checkbox.
  - Toggle between showing pending or completed items; friendly empty states guide the user when there are no items.

- **Social / Friends:** Basic social features for accountability:
  - A Friends view to see people in your circle and recent activity.
  - Designed to be extended with invites, activity feeds, and sharing in future updates.

## Running locally

1. Install dependencies (from the `app/HabitFlower` folder):

```bash
npm install
```

2. If you want to use local SVGs, install the native SVG packages:

```bash
npm install react-native-svg react-native-svg-transformer --save
```

3. Start the Expo dev server:

```bash
npx expo start --clear
```

## Notes & next steps

- Persistence (saving habits and to-dos) and a create/edit flow for items are not yet implemented — these are logical next steps.
- The UI is intentionally compact and designed for easy extension (animations, persistence, cloud sync, and richer social features can be added).

Contributions and issues are welcome.
