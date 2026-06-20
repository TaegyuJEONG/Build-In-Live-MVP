# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server on all network interfaces (0.0.0.0)
npm run build    # Production build (TypeScript errors are ignored via next.config.mjs)
npm run start    # Production server
npm run lint     # ESLint
```

No test suite is configured.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in values:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY
```

## Architecture

**BUILD_IN_LIVE** is a real-time collaborative feedback platform. Users can annotate live websites with markers and comments, and showcase projects on a 3D desk workspace.

### Tech Stack
- **Next.js** (App Router) + TypeScript + Tailwind CSS 4
- **Firebase**: Auth, Firestore (projects/markers/comments/users), Realtime Database (live cursors/presence)
- **Liveblocks**: Alternative real-time presence layer (used in FeedbackSystem alongside Firebase RTDB)
- **Zustand** (`lib/store.ts`): Single global store managing auth state, projects, markers, comments, polaroids, and real-time cursor positions
- **Three.js / @react-three/fiber**: 3D desk workspace visuals

### State Management Pattern
`lib/store.ts` is the central hub. It:
- Subscribes to Firebase Auth via `onAuthStateChanged` in `init()`
- Manages Firestore real-time listeners for projects and per-project markers
- Manages Firebase RTDB listeners for live cursor positions per project room
- Cleans up listeners when switching projects (`setProject`) to prevent permission errors after logout

Call `store.init()` once at app bootstrap (in the root layout).

### Authentication
- Firebase Auth (email/password + Google OAuth)
- Auth is **client-side only** — middleware (`middleware.ts`) is a pass-through; protection is handled by `AuthGuard.tsx` and `AuthPromptModal.tsx`
- Public routes: `/auth`, `/feedback/[projectId]`
- `showAuthModal` in the store gates actions requiring login

### Data Model (Firestore)
```
/projects/{projectId}
  /markers/{markerId}
    /comments/{commentId}
/users/{uid}
  /polaroids/{polaroidId}
```

### Key Pages & Their Roles
- `/dashboard` — Project showcase grid; browse, create, manage projects
- `/desk/[uid]` — 3D isometric desk workspace with polaroids, rolling paper, 3D objects
- `/feedback/[projectId]` — Embedded iframe of the target site with live annotation overlay
- `/project/[id]` — Individual project detail view
- `/onboarding` — New user onboarding flow

### Dual Real-Time Systems
The codebase uses **two** real-time collaboration layers simultaneously:
1. **Firebase RTDB** (`cursors/{projectId}/{uid}`) — live cursor positions, tracked in Zustand store
2. **Liveblocks** (`liveblocks.config.ts`) — presence, markers, and comments in `FeedbackSystem.tsx` via `RoomProvider`

Be aware of which layer a component uses when debugging real-time features.

### Design System
"The Architectural Monolith" — defined in `DESIGN.md`:
- Colors: black (`#000000`), white (`#FFFFFF`), red accent (`#F95A56`)
- Hard edges — 0px border radius throughout
- Isometric 3D styling, no drop shadows
- 1px grid alignment discipline

### Polaroid Types
The `Polaroid` type in the store has a `type` field: `'POLAROID' | 'YOUTUBE' | 'LINK' | 'POSTIT'` and a `scope` field: `'PROFILE' | 'ROLLING_PAPER'`. Legacy data defaults `type` to `'POLAROID'`.
