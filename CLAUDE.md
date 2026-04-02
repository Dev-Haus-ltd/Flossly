# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on http://0.0.0.0:3000
npm run build      # Production build
npm run generate   # Static site generation
npm run preview    # Preview production build
```

No lint or test scripts are configured.

## Stack

- **Nuxt 3** (full-stack, monolithic) — frontend + backend server routes in one repo
- **Vue 3** Composition API + **Vuetify 3** UI components + **Pinia** state management
- **PostgreSQL** via **Sequelize ORM** (Neon serverless Postgres)
- **Primary colour:** `#0061FB` — use this for brand-consistent UI

Auto-imported (no explicit imports needed): `ref`, `reactive`, `computed`, `watch`, `onMounted`, `defineStore`, `acceptHMRUpdate`, all components in `components/`, all stores in `stores/`

## Architecture

### Data Flow

```
Component
  → Service (services/featureService.js)
    → apiWrapper.Get/Post("/api/feature/endpoint")
      → Nuxt Server Route (server/api/feature/endpoint.js)
        → Sequelize ORM → PostgreSQL
        → External APIs (Meta, Stripe, Firebase, S3, OpenAI, Redis)
```

### API Layer

**`services/apiWrapper.js`** — base HTTP client, all calls go through `/api`:
- `Get(url)` — GET request
- `Post(url, body)` — POST with JSON
- `Delete(url, itemId)` — POSTs `{id}` (non-standard, check before using)
- `PostFormData(url, body, onProgress)` — multipart/form-data with XHR progress

Feature services (e.g. `services/taskService.js`) wrap these and return `new Promise((resolve, reject) => Get/Post(...).then(resolve).catch(reject))`.

API responses use `{ code: 0, data: ... }` — always check `res?.code === 0`.

### State Management

Pinia stores in `stores/` follow the **options API** pattern: `defineStore('name', { state, getters, actions })`.

Key stores:
- `stores/index.js` (`useMainStore`) — global snackbar, roles, license-gated menu (`getManagerOptions`)
- `stores/auth.js` (`useAuthStore`) — logged user, org details, auth actions
- `stores/diary.js`, `stores/charting.js`, `stores/crm.js`, etc. — feature stores

### License System

Feature access is gated by license type stored in `useMainStore`. Types: `SYSTEM`, `TRIAL`, `DRIFT`, `GLIDE`, `SOAR`. The `getManagerOptions` getter filters menu items by license. Do not add features to protected routes without checking license gating.

### Authentication

Global middleware (`middleware/auth.global.js`) runs on every client-side route change — redirects unauthenticated users to `/login`. Org creators with incomplete profiles are redirected to `/onboarding`. JWT secret is server-side only.

### Server Routes

`server/api/[domain]/[name].js` — organized by feature domain (auth, crm, diary, tasks, dms, stripe, meta, whapi, etc.). Each file is a Nuxt server route handler. Dynamic routes use `[name].js` pattern.

### Multi-tenancy

Organization-based. Users belong to orgs. Role-based access (roles from `useMainStore.getRoles`). Developer mode via `useDeveloperAccess.js` (`DEVELOPER_EMAILS` allowlist).

## Key Integrations

| Service | Purpose |
|---------|---------|
| Meta / Facebook | Lead generation, Instagram DMs, Messenger |
| Whapi (`gate.whapi.cloud`) | WhatsApp Business messaging |
| Stripe | Subscription billing |
| AWS S3 (`flossly` bucket, `us-east-2`) | File storage |
| Firebase FCM | Push notifications (`composables/useFCM.js`) |
| Google Cloud Speech | Audio transcription |
| OpenAI | AI summarization features |
| Redis (ioredis) | Session caching |

All credentials are in `runtimeConfig` — public config (client-accessible) vs private config (server-only). Never access private config in `pages/` or `components/`.

## UI Conventions

- Use **Vuetify 3** components throughout — `v-btn`, `v-dialog`, `v-card`, etc.
- Global snackbar: `useMainStore().setSnackbar({ message, color })` — do not create custom toast implementations
- Currency: **GBP (£)** — this is UK dental practice software
- Terminology: "diary" = appointment calendar, "patient journey" = patient sidebar workflow

## Charting Module

Located in `components/diary/charting/`. FDI notation by default (Palmer and UNS toggle). Tooth SVGs use 44×44 viewBox with 5 surface polygons. The `charting.js` store manages full-mouth state; always call `store.reset()` before `loadChart()` when switching patients.

## CRM / DM Module

Meta (Facebook/Instagram) and WhatsApp messaging in `pages/crm/dms.vue`. Uses `server/api/dms/` and `server/api/meta/` routes. Webhook verification tokens are in private runtimeConfig.
