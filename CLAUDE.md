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

Auto-imported (no explicit imports needed): `ref`, `reactive`, `computed`, `watch`, `onMounted`, `defineStore`, `acceptHMRUpdate`, all components in `components/`, all stores in `stores/`. Stores still need an explicit `import` statement despite auto-import, because `imports.dirs: ["./stores"]` only exposes them as composables.

## Architecture

### Data Flow

```
Component
  → Service (services/featureService.js)
    → apiWrapper.Get/Post("/api/feature/endpoint")
      → Nuxt Server Route (server/api/feature/[name].js)  ← switch/case on `name`
        → Controller (server/controllers/feature.js)
          → Sequelize ORM → PostgreSQL
          → External APIs (Meta, Stripe, Firebase, S3, OpenAI/Anthropic, Redis)
```

### API Layer

**`services/apiWrapper.js`** — base HTTP client, all calls go through `/api`:
- `Get(url)` — GET request
- `Post(url, body)` — POST with JSON
- `Delete(url, itemId)` — POSTs `{id}` (non-standard, check before using)
- `PostFormData(url, body, onProgress)` — multipart/form-data with XHR progress

Feature services (e.g. `services/taskService.js`) wrap these and return `new Promise((resolve, reject) => Get/Post(...).then(resolve).catch(reject))`.

API responses use `{ code: 0, data: ... }` — always check `res?.code === 0`.

### Server Route Pattern

Each domain has a single catch-all file `server/api/[domain]/[name].js` that dispatches via `switch(getRouterParam(event, "name"))`. Controllers live in `server/controllers/[domain].js`.

### State Management

Pinia stores in `stores/` follow the **options API** pattern: `defineStore('name', { state, getters, actions })`.

Key stores:
- `stores/index.js` (`useMainStore`) — global snackbar, roles, license-gated menu (`getManagerOptions`), `LICENSE_TYPES` constants
- `stores/auth.js` (`useAuthStore`) — logged user, org details, auth actions
- `stores/diary.js`, `stores/charting.js`, `stores/crm.js`, etc. — feature stores

### License / Entitlements System

Two layers of gating:

**Client-side (menu visibility):** `stores/index.js` → `LICENSE_FEATURES` map filters sidebar nav items by `featureKey`. License is read from `useAuthStore().loggedUser.licenseType`.

**Server-side (API enforcement):** `server/utils/requireFeature.js` and `server/utils/requireUsageAllowed.js` — call these at the top of any protected controller. Both read `licenseType` live from the DB so plan changes take effect without re-login.

Current tiers: `Lite`, `CRM`, `Pro`. Legacy DB values (`System`, `Trial`, `Drift`, `Glide`, `Soar`) are mapped to these by `server/config/entitlements.js` → `LEGACY_MAP`. Always import from `server/config/entitlements.js`, not `stores/index.js`, on the server side.

Feature flags: `whatsapp`, `automation`, `taskPool`, `patientBooking`, `googleAds`, `diary` (value `'view-only'` or `'full'`).

Usage limits (Lite only): `leads` (100), `storageMB` (1024), `members` (3). CRM and Pro have `Infinity` limits.

### Authentication

Global middleware (`middleware/auth.global.js`) runs client-side on every route change. Unauthenticated users go to `/login`. Org creators with an incomplete setup (role 8 or 1, `isOrganisationCreator`, `setupStepsCompleted === 0`) are redirected to `/setup`.

JWT is verified server-side only. `event.context.user` is populated by server middleware and contains `{ userId, orgId, roleId }`. Never read private runtimeConfig in `pages/` or `components/`.

Magic link auth: `sendMagicLink` / `verifyMagicLink` in `server/controllers/auth.js` — used for the Lite signup flow.

### Server Routes

`server/api/[domain]/[name].js` — organized by feature domain (auth, crm, diary, tasks, dms, stripe, meta, whapi, admin, lead). Dynamic routes use `[name].js` with a `switch` dispatch pattern.

### Background Schedulers

`server/plugins/scheduler.js` acquires a PostgreSQL advisory lock (`pg_try_advisory_lock`) so only one Nitro instance runs scheduled jobs. Schedulers are started in `server/utils/scheduler.js`:
- Lead & patient-journey automation
- Task overdue / due-reminder
- Onboarding email campaign
- DM queue flush
- Meta ad sync
- Shift reminders
- License expiry

### Multi-tenancy

Organization-based. Every DB model includes `organisationId`. Users belong to orgs via `UserOrganisation`. Role-based access via `useMainStore.getRoles`. Developer mode via `composables/useDeveloperAccess.js` (`DEVELOPER_EMAILS` allowlist in both client and server code).

### Shared Code

`shared/` directory is aliased as `@shared` and is accessible from both client and server. Used for constants and default data (e.g. `shared/defaults/onboardingCampaign.js`).

## Key Integrations

| Service | Purpose |
|---------|---------|
| Meta / Facebook | Lead generation, Instagram DMs, Messenger, Ad campaigns |
| Whapi (`gate.whapi.cloud`) | WhatsApp Business messaging (per-org channels) |
| Stripe | Subscription billing + webhook handling |
| AWS S3 (`flossly` bucket, `us-east-2`) | File storage |
| Firebase FCM | Push notifications (`composables/useFCM.js`) |
| Google Cloud Speech | Audio transcription |
| OpenAI / Anthropic (`@anthropic-ai/sdk`) | AI features — provider selected via `AI_LLM_PROVIDER` env var |
| Redis (ioredis) | Session caching, DM message queue |
| PostHog | Product analytics (`posthog-js`) |

All credentials are in `runtimeConfig` — public config (client-accessible) vs private config (server-only). Credentials are read from `NUXT_*` prefixed env vars with fallback to unprefixed names.

## UI Conventions

- Use **Vuetify 3** components throughout — `v-btn`, `v-dialog`, `v-card`, etc.
- Global snackbar: `useMainStore().setSnackbar({ message, color })` — do not create custom toast implementations
- Currency: **GBP (£)** — this is UK dental practice software
- Terminology: "diary" = appointment calendar, "patient journey" = patient sidebar workflow

## Charting Module

Located in `components/diary/charting/`. FDI notation by default (Palmer and UNS toggle). Tooth SVGs use 44×44 viewBox with 5 surface polygons. The `charting.js` store manages full-mouth state; always call `store.reset()` before `loadChart()` when switching patients.

## CRM / DM Module

Meta (Facebook/Instagram) and WhatsApp messaging in `pages/crm/dms.vue`. Uses `server/api/dms/` and `server/api/meta/` routes. Webhook verification tokens are in private runtimeConfig. WhatsApp channels are per-org via `WhapiChannelConfig` model.
