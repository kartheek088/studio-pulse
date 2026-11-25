# Studio Pulse

A **UI prototype** for tracking shots through a VFX / animation pipeline: storyboard → previz → asset production → animation/layout → render & review.

I built it to think through how a small studio would see who is working on what, which shots are blocked, and what's waiting for a director's review. I'm interested in filmmaking, and the existing tools I looked at are built for large studios.

**Live demo:** https://studio-pulse-six.vercel.app (demo accounts are in `server/seedData.js`; they are fake).

## What's real and what's simulated

| Part | State |
|---|---|
| Five-stage pipeline view, shot/task/asset boards, role-based views (artist, director, production lead) | Implemented in the UI |
| REST API (`server/index.js`): projects, shots, tasks, assets, reviews | Implemented in Express, backed by a **JSON file (`server/data/`) seeded with sample data** |
| Creating a project with starter shots | Implemented |
| "Git / Git LFS" commits and file locks (`/api/git/*`) | **Simulated.** Records entries in the store; no git or LFS operations happen |
| "Kitsu" review and annotations (`/api/kitsu/*`) | **Simulated.** No connection to a Kitsu server |
| Unreal Engine viewport / playblasts | **Mock UI** only |
| Authentication | Demo email and password checked against seed data. Not secure, so don't reuse these passwords |

On Vercel the filesystem isn't persistent, so changes made in the live demo don't survive.

## Run locally

```bash
npm run install:all
npm run dev          # API on :4000, UI on :5173
```

## Stack

React 19 + Vite (frontend), Node + Express (API). No database.

## If I continue it

Ideas, **not implemented**: persist to SQLite/Postgres, real auth, and an actual Kitsu API client (Kitsu is open source, so this is feasible).
