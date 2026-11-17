# Habitflower

A habit and task app where every habit grows a flower. Check in and it grows from sprout to bud to bloom. Miss days and it wilts, then dries up. Tasks sit alongside, with dates, repeats and checklists. Anonymous by default, usernames only.

- **App**: `app/HabitFlower/` (Expo, React Native, TypeScript). iOS first, with Home Screen widgets.
- **Server**: `server/` (Node, Hono, Postgres) for backup and sync, deployed to AWS EC2. See [server/DEPLOY.md](server/DEPLOY.md).
- **Spec**: [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md) and the screen mockups in `docs/handoff/design/`.
- **Conventions**: [CLAUDE.md](CLAUDE.md).

## Run the app

```bash
cd app/HabitFlower
npm install
cp .env.example .env.local   # optional: set EXPO_PUBLIC_API_URL to enable backup and sync
npx expo run:ios             # builds a dev client (widgets and notifications need it)
npm test
```

## Run the server locally

```bash
cd server
npm install
DATABASE_URL=postgres://... JWT_SECRET=$(openssl rand -base64 48) APPLE_BUNDLE_ID=com.habitflower.app npm run dev
```

## Release plan

- **v1**: solo MVP (habits, flowers, tasks, widgets, backup).
- **v1.1**: friends, photo check-ins, Updates feed.
- **v1.2**: grow together, Apple Health, shared tasks.
