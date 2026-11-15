Paste this into Claude Code from the root of the Habitflower repo, after copying the `habitflower-handoff` folder into the repo (for example as `docs/handoff/`).

---

We're rebuilding Habitflower from a new design. The current code is an older concept and should be scrapped: don't keep its screens, navigation, naming or styling. Keep only project setup and build config if they still fit.

Read `docs/handoff/HANDOFF.md` first. It's the source of truth for how the app works, the design system and the release scope. The `docs/handoff/design/` folder has one HTML mockup per screen (`.dc.html`). Use them as the visual spec for exact colours, sizes, spacing, copy and states. They use a small custom template syntax (`{{ }}`, `<sc-for>`, `<sc-if>`, `<dc-import>`, a `Component` class with sample data); don't port that syntax, rebuild the screens natively. `design/Flower.dc.html` is the flower drawing used everywhere (kind, stage, health, size), so port it first as a reusable component.

How to work:
1. Start with a plan: propose the folder structure, navigation, state and data layer, and the order you'll build v1 in. Wait for my OK before deleting the old code.
2. Build v1 (the solo MVP in section 3) first. Keep the v1.1 and v1.2 data shapes in mind so the schema doesn't need rewriting later.
3. Put the design tokens from section 5 in one theme file and use them everywhere. No outlines for selection, tinted fills instead.
4. Implement the flower rules in section 6 as pure, unit-tested functions (growth, wilting, dried up, rest/pause/away days, the day-reset hour).
5. Follow the copy rules exactly: usernames only, "HabitFlowers", "check in", no em dashes or "·".
6. Add a CLAUDE.md that summarises these conventions for future sessions.

Ask me if anything in the handoff is ambiguous before guessing.
