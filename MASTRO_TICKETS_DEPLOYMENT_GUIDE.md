# Mastro Tickets — Deployment, DevOps & Operational Guide

> **Active Runtime**: Node.js `v22+` + Express (`server.ts`) + Vite 8 static bundle (`dist/`) + Firebase (`mastro-tickets`) + Cloudinary.
> **Legacy Alternative**: Hostinger VPS Apache 2.4 + PHP 8.2 + MySQL 8.0 (`/backend/` — inactive).

---

## 1. Build & Run Scripts (`/package.json`)

| Script | Command | Purpose & Operational Notes |
|---|---|---|
| `npm run dev` | `tsx server.ts` | Starts Express on `0.0.0.0:${PORT || 3000}` with Vite dev middleware (`middlewareMode: true`). |
| `npm run build` | `vite build` | Compiles React/TS/Tailwind SPA into `/dist`. Does **not** compile `/server.ts` to `.js`. |
| `npm run start` | `node server.ts` | **CRITICAL DEVOPS WARNING**: Runs raw TypeScript `server.ts` directly with `node`. Works **only** on Node.js `>= 22.6` with native TypeScript type-stripping (current container is `v22.23.2`), and fails on older Node 18/20 LTS hosts unless changed to `tsx server.ts` or bundled with `esbuild` (`server.ts` -> `dist/server.mjs`). Note also that `server.ts` uses `import.meta.url` (ESM) and `package.json` sets `"type": "module"`. |
| `npm run preview` | `vite preview` | Previews static `dist/` build **without** `/api/uploads/cloudinary` routes (not suitable for production uploads). |
| `npm run lint` | `tsc --noEmit` | Runs TypeScript static type checking only (does **not** run ESLint). |
| `npm run clean` | `rm -rf dist` | Deletes build artifacts. |

---

## 2. Deployment Architecture (Active Node.js + Firebase + Cloudinary)

### Step 1: Node.js Application Host (Cloud Run, Render, Railway, Fly.io, or VPS)
1. **Runtime Requirement**: Node.js `>= 22.14.0` (verified with `v22.23.2`) or invoke `npx tsx server.ts`.
2. **Install Dependencies**:
   ```bash
   npm install   # or bun install (bun.lock is committed)
   ```
3. **Configure Environment Variables**:
   - Set `NODE_ENV=production`
   - Set `PORT=3000` (or platform-assigned `PORT`)
   - Set Cloudinary secrets: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (or `CLOUDINARY_URL`)
   - Optional build-time Firebase overrides: `VITE_FIREBASE_*` (baked into `dist/` during `vite build`)
4. **Build SPA Bundle**:
   ```bash
   npm run build
   ```
   Verifies `/dist/index.html` and `/dist/assets/*` are generated.
5. **Start Production Server**:
   ```bash
   NODE_ENV=production npm start
   ```
   `server.ts` detects `NODE_ENV=production`, serves `/dist` statically, exposes `/api/uploads/cloudinary*`, and routes all non-API paths to `/dist/index.html` for SPA client routing.

### Step 2: Firebase Project Configuration (`mastro-tickets`)
The application connects directly from the browser to Firebase project `mastro-tickets`. Before going live, complete these Firebase Console steps:
1. **Enable Authentication Providers**:
   - Firebase Console -> Authentication -> Sign-in method:
     - Enable **Google** provider.
     - Enable **Email/Password** provider.
   - Add production domain(s) under **Authentication -> Settings -> Authorized domains** (required for `signInWithPopup` Google OAuth!).
2. **Create Cloud Firestore Database**:
   - Provision Firestore in Native mode (default database, or set `VITE_FIREBASE_DATABASE_ID` if using a named database).
3. **Publish Firestore Security Rules**:
   - Currently, `/firestore.rules` exists in the repo but is **not automatically deployed** to the external `mastro-tickets` project.
   - Deploy using Firebase CLI:
     ```bash
     firebase login
     firebase use mastro-tickets
     firebase deploy --only firestore:rules
     ```
   - **Important**: Review `MASTRO_TICKETS_SECURITY_AUDIT.md` before deploying `/firestore.rules` to production — harden `tickets`, `orders`, `reservations`, `emailJobs`, `inventoryLedger`, and `auditLogs` first!
4. **Seed Admin Document**:
   - Create an entry in Firestore `admins/{adminUid}` or `admins/{lowercaseEmail}` matching the admin account (`{ email, uid, role: "admin" }`).
5. **Initialize `test/connection` Document** (optional):
   - `testFirestoreConnection()` reads `test/connection` on startup; `firestore.rules` allows public `read` on `/test/connection`.

### Step 3: Cloudinary Configuration
1. Create a Cloudinary account and obtain `Cloud Name`, `API Key`, and `API Secret`.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` on the Node.js server environment (never prefix secrets with `VITE_`).
3. Verify readiness via `GET /api/uploads/cloudinary/status` -> `{ "configured": true, ... }`.
4. Ensure folders `mastrotickets/events`, `mastrotickets/tickets`, `mastrotickets/concerts`, and `mastrotickets/packages` are permitted in Cloudinary upload settings.

---

## 3. Infrastructure & DevOps Gaps Identified in Current Codebase

| Area | Current State | Production Requirement |
|---|---|---|
| Containerization (`Dockerfile`, `docker-compose.yml`) | **Not present** | Add multi-stage Node 22 Alpine Dockerfile for reproducible Cloud Run / VPS deployments |
| CI/CD Workflows (`.github/workflows/*`) | **Not present** | Add CI pipeline running `tsc --noEmit`, ESLint on `firestore.rules`, rules unit tests, and `vite build` |
| Firebase CLI Config (`firebase.json`, `.firebaserc`, `firestore.indexes.json`) | **Not present** | Create `firebase.json` & `.firebaserc` targeting `mastro-tickets` for deterministic rule/index deployments |
| Health Check Endpoint on `server.ts` | **Not present** | Add `GET /api/health` returning `200 OK` for load balancer / Cloud Run readiness probes |
| Reservation Expiry Worker | **Client-only `setInterval`** | Deploy a scheduled Cloud Function / cron worker to release abandoned holds every 1 minute |
| Process Manager / Graceful Shutdown | **Not present** | Handle `SIGTERM`/`SIGINT` in `server.ts` to drain active HTTP requests |
| Observability / Error Tracking | **`console.error` only** | Add structured JSON logging (Pino/Winston) and error monitoring (Sentry / Cloud Logging) |
| Lockfile Consistency | `bun.lock` committed (no `package-lock.json`) | Standardize package manager (`bun` vs `npm`) across CI and production builds |

---

## 4. Legacy PHP Backend Deployment Notes (`/backend/`)

The `/backend/` directory includes Hostinger VPS deployment artifacts:
- `/backend/apache/mastrotickets-api.conf` (Apache 2.4 VirtualHost for `api.mastrotickets.co` with Let's Encrypt SSL + HSTS)
- `/backend/public/.htaccess` (mod_rewrite to `index.php`, Bearer header passthrough)
- `/backend/database/schema.sql` (MySQL 8 / MariaDB 10.6 schema + Hungaroring seed data)
- `/backend/README.md` (Ubuntu 22.04/24.04 setup instructions)

> **Warning**: Do **not** deploy `/backend/` as-is without first fixing the 8 SQL schema-vs-controller mismatches and security gaps documented in `MASTRO_TICKETS_BACKEND_DOCUMENTATION.md` and `MASTRO_TICKETS_SECURITY_AUDIT.md`. If using Firebase + Node.js (`server.ts`) as the primary production stack, `/backend/` can be archived or removed after migrating Stripe webhook fulfillment and Resend email dispatch into `server.ts` (or Firebase Cloud Functions).
