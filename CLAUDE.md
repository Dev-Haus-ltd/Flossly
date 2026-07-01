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
      → Nuxt Server Route (server/api/feature/resource/[id].get.js)
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

Routes use Nitro's file-based routing with HTTP method suffixes. Each route file is a thin wrapper that calls a controller function:

```
server/api/feature/resource/index.get.js     → GET /api/feature/resource
server/api/feature/resource/index.post.js    → POST /api/feature/resource
server/api/feature/resource/[id].get.js      → GET /api/feature/resource/:id
server/api/feature/resource/[id].patch.js    → PATCH /api/feature/resource/:id
server/api/feature/resource/[id].delete.js   → DELETE /api/feature/resource/:id
server/api/feature/resource/[id]/action.post.js  → POST /api/feature/resource/:id/action
```

Route files contain only the handler delegation:
```js
import { myController } from '~/server/controllers/feature';
export default defineEventHandler((event) => myController(event));
```

Controllers live in `server/controllers/[domain].js`. Admin routes (`server/api/admin/**`) are protected by `server/middleware/adminAuth.js`.

**Response utilities** (`server/utils/response.js`) — always use these in controllers:
- `success(data)` — returns `{ code: 0, success: true, data }`
- `error(statusCode, message)` — throws a `createError()` with normalized message

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

### Key Composables

Beyond auto-imported Vue/Pinia primitives, notable composables in `composables/`:
- `useBus()` — global event bus (mitt). Use for cross-component communication without props/emits.
- `useUser()` — user state with localStorage persistence (complements `useAuthStore`)
- `useCrmFeatureAccess()` — CRM feature flags scoped to current user/org
- `useDeveloperAccess()` — dev-only mode; checks `DEVELOPER_EMAILS` allowlist
- `usePricingModal()` — triggers the upgrade/pricing modal
- `useUsageSummary()` — current org usage vs. limits (leads, storage, members)
- `useWhapiStream()` — SSE stream for real-time WhatsApp messages

### Client Utilities

`lib/` directory contains shared client-side utilities (not auto-imported, must be explicitly imported):
- `lib/dateFormatter.js`, `lib/timeFormatters.js` — date/time formatting
- `lib/crm/automation.js`, `lib/crm/placeholders.js` — CRM automation helpers
- `lib/chatMappers.js`, `lib/chatShared.js` — DM/chat display logic
- `lib/auth.js` — auth checks, profile completion, role helpers
- `lib/normalizers/lead.js` — lead data normalization

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
