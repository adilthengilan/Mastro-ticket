# Mastro Tickets — System Architecture & Technical Diagrams

> **Architecture Classification**: Hybrid Client-Heavy React SPA + Cloud Firestore Direct SDK + Minimal Node.js/Express Media Proxy (`server.ts`), with an optional dormant legacy PHP/MySQL REST API (`/backend/`).

---

## 1. Executive Architecture Summary

The active Mastro Tickets runtime consists of three tiers:

1. **Frontend SPA (React 19 + TypeScript + Vite 8 + Tailwind CSS v4)**
   - Bootstrapped via `/index.html` and `/src/main.tsx`, routed via a custom History API router in `/src/App.tsx`.
   - Centralized state container in `/src/services/store.tsx` (2,596 lines) combining:
     - **Firebase Web SDK** (`auth` + `firestore` with real-time `onSnapshot` listeners and `runTransaction`).
     - **Browser `localStorage`** mirror/fallback for catalog, cart, reservation hold, orders, audit logs, email jobs, inventory ledger, and admin UI session flag.
     - **Optional Remote PHP REST API adapter** (`/src/services/apiClient.ts`) which is **inactive** in standard development/AI Studio deployments (activates only when `VITE_API_BASE_URL` is set or hostname is `mastrotickets.co` / `mastrotickets.ae`).

2. **Active Node.js / Express Server (`/server.ts`, 205 lines)**
   - Runs on `0.0.0.0:${PORT || 3000}`.
   - In development: mounts Vite via `createServer({ server: { middlewareMode: true }, appType: 'spa' })`.
   - In production (`NODE_ENV=production`): serves static assets from `/dist` with SPA fallback to `/dist/index.html`.
   - Exposes **only two active REST API routes**:
     - `GET /api/uploads/cloudinary/status`
     - `POST /api/uploads/cloudinary` (signed SHA-1 upload proxy to Cloudinary API)
   - Does **not** host payment, email, auth, or Firestore Admin SDK routes.

3. **Cloud Services (Direct Client Integration)**
   - **Firebase Project `mastro-tickets`**:
     - Firebase Authentication (Google OAuth popup + Email/Password + password reset + email verification).
     - Cloud Firestore (13 collections accessed directly from browser via `src/services/firestoreRepository.ts`).
     - Firebase Analytics (browser-guarded via `isSupported()`).
   - **Cloudinary**: Admin image uploads signed server-side by `/server.ts` (or optional unsigned preset fallback via `VITE_CLOUDINARY_*`), returning HTTPS CDN URLs stored in Firestore documents.
   - **External QR Generator**: `https://api.qrserver.com/v1/create-qr-code/` invoked directly via `<img src>` on `OrderConfirmationPage.tsx`.

4. **Legacy / Dormant Backend (`/backend/`)**
   - Self-contained PHP 8.2 + MySQL/MariaDB REST API designed for Hostinger VPS + Apache 2.4 (`api.mastrotickets.co`).
   - Implements server-side Stripe Checkout Sessions, Stripe webhook fulfillment, Resend transactional email dispatch, and MySQL `FOR UPDATE` ticket holds.
   - **Not running** in the active Node.js runtime; documented separately to avoid confusion between intended PHP capabilities and active Node+Firestore behavior.

---

## 2. Technology Stack & Exact Resolved Versions

Extracted from `/package.json` and `/bun.lock` (Node runtime observed: `v22.23.2`):

### Runtime & Core Dependencies
| Package | `package.json` Range | Resolved (`bun.lock`) | Actual Codebase Usage |
|---|---|---|---|
| `react` | `^19.0.1` | `19.3.1` | Core UI framework |
| `react-dom` | `^19.0.1` | `19.3.1` | DOM renderer (`createRoot`) |
| `firebase` | `^13.4.0` | `13.4.0` | Auth, Firestore, Analytics (`src/firebase.ts`, `firestoreRepository.ts`, `store.tsx`) |
| `express` | `^4.21.2` | `4.22.3` | Active Node server (`server.ts`) |
| `multer` | `^2.5.0` | `2.5.0` | Multipart image upload parsing (`server.ts`) |
| `dotenv` | `^17.2.3` | `17.4.2` | Env loading in `server.ts` (`import 'dotenv/config'`) |
| `lucide-react` | `^0.546.0` | `0.546.0` | UI icons across all pages & components |
| `motion` | `^12.23.24` | `12.43.0` | Installed; check active imports (CSS transitions used primarily) |
| `@tailwindcss/vite` | `^4.3.3` | `4.3.5` | Tailwind v4 Vite plugin (`vite.config.ts`) |
| `@vitejs/plugin-react` | `^6.1.1` | `6.3.0` | React Vite plugin (`vite.config.ts`) |
| `vite` | `^8.3.0` | `8.3.8` | Bundler & dev middleware (`server.ts`, `vite.config.ts`) |
| `@google/genai` | `^2.4.0` | `2.32.0` | **UNUSED** — 0 imports anywhere in `src/` or `server.ts` |
| `eslint` | `^10.15.0` | `10.15.0` | Listed in `dependencies` (should be devDependency); only lints `firestore.rules` |
| `@firebase/eslint-plugin-security-rules` | `^0.0.2` | `0.0.2` | Listed in `dependencies`; used in `eslint.config.js` |
| `@types/multer` | `^2.3.0` | `2.3.0` | Listed in `dependencies` (type definitions) |

### Dev Dependencies
| Package | `package.json` Range | Resolved (`bun.lock`) | Actual Codebase Usage |
|---|---|---|---|
| `typescript` | `^7.0.2` | `7.0.2` | Type checking (`npm run lint` -> `tsc --noEmit`) |
| `tailwindcss` | `^4.3.3` | `4.3.5` | CSS utility framework (`src/index.css`) |
| `tsx` | `^4.21.0` | `4.23.15` | TypeScript runtime for `npm run dev` (`tsx server.ts`) |
| `esbuild` | `^0.25.0` | `0.25.12` | Build toolchain dependency |
| `autoprefixer` | `^10.4.21` | `10.7.0` | Unused directly (Tailwind v4 handles prefixing) |
| `@types/node` | `^22.14.0` | `22.20.5` | Node types |
| `@types/express` | `^4.17.21` | `4.17.25` | Express types |
| `@types/react` / `@types/react-dom` | `^19.3.0` | `19.3.0` | React types |

---

## 3. Architectural Diagrams (Mermaid)

### 3.1 System Architecture Diagram
```mermaid
flowchart TB
    User["Customer / Admin Browser"]

    subgraph SPA["Frontend React 19 SPA (Vite 8)"]
        Router["src/App.tsx (History API Router)"]
        Pages["12 Pages (Home, Races, RaceDetail, Cart, Checkout, OrderConfirmation, PrintableTicket, Verification, Auth, Account, Help, AdminPanel)"]
        Store["src/services/store.tsx (Monolithic Context)"]
        Repo["src/services/firestoreRepository.ts"]
        CloudSvc["src/services/cloudinaryService.ts"]
        ApiClient["src/services/apiClient.ts (Optional Legacy Adapter)"]
        LS[("Browser localStorage")]
    end

    subgraph NodeServer["Active Node.js Server (server.ts :3000)"]
        Express["Express 4.22"]
        UploadAPI["GET /api/uploads/cloudinary/status\nPOST /api/uploads/cloudinary"]
        Static["Vite Middleware (dev) /\ndist/ Static + SPA Fallback (prod)"]
    end

    subgraph Firebase["Firebase Project: mastro-tickets"]
        FBAuth["Firebase Authentication\n(Google OAuth + Email/Password)"]
        Firestore[("Cloud Firestore\n13 Collections + Security Rules")]
        FBAnalytics["Firebase Analytics"]
    end

    subgraph External["External Services"]
        Cloudinary["Cloudinary Upload API\napi.cloudinary.com"]
        QRServer["QR Code Image API\napi.qrserver.com"]
        LegacyPHP["Legacy PHP API (Dormant)\napi.mastrotickets.co (MySQL + Stripe + Resend)"]
    end

    User --> Router --> Pages --> Store
    Store <--> LS
    Store <--> Repo
    Store <--> FBAuth
    Repo <--> Firestore
    Store --> FBAnalytics
    Pages --> CloudSvc --> UploadAPI --> Cloudinary
    Pages -.->|"img src"| QRServer
    Store -.->|"Only if VITE_API_BASE_URL set"| ApiClient -.-> LegacyPHP
    User --> Static
```

### 3.2 Frontend Architecture & State Flow Diagram
```mermaid
flowchart LR
    subgraph Bootstrap["App Initialization (StoreProvider)"]
        A1["Load localStorage snapshots"] --> A2["Register onAuthStateChanged()"]
        A2 --> A3["Attach 11 Firestore onSnapshot listeners"]
        A3 --> A4["If events empty -> seedInitialCatalogIfEmpty()"]
        A3 --> A5["Start 1s setInterval reservation expiry timer"]
    end

    subgraph State["Centralized React State (store.tsx)"]
        Catalog["events, tickets, categories, concerts, premiumPackages, discounts"]
        Commerce["cart, activeReservation, reservations, orders"]
        Identity["currentUser, isAuthenticated, isFirebaseAdmin"]
        Ops["emailJobs, inventoryLedger, auditLogs"]
    end

    subgraph Consumers["Pages & Components"]
        Storefront["HomePage, RacesPage, RaceDetailPage"]
        Funnel["CartPage, CheckoutPage, OrderConfirmationPage"]
        Customer["AuthPage, AccountPage, TicketVerificationPage, PrintableTicketPage"]
        Admin["AdminPanel (11 tabs)"]
    end

    Bootstrap --> State
    State --> Consumers
    Consumers -->|"Actions (reserve, checkout, CRUD)"| State
    State -->|"Async write-through"| Firestore[("Firestore")]
    State -->|"useEffect sync"| LS[("localStorage")]
```

### 3.3 Backend Architecture Diagram (`server.ts`)
```mermaid
flowchart TD
    Req["Incoming HTTP Request (:3000)"] --> JsonMW["express.json({ limit: '1mb' })"]
    JsonMW --> RouteCheck{"Route Match?"}

    RouteCheck -->|"GET /api/uploads/cloudinary/status"| StatusH["resolveCloudinaryConfig()\nReturn { configured, cloudName, allowedFolders, maxBytes }"]
    RouteCheck -->|"POST /api/uploads/cloudinary"| Multer["multer memoryStorage\nmax 10MB, 1 file, JPG/PNG/WebP/AVIF"]
    Multer --> FolderVal["Validate folder in 4 allowed prefixes"]
    FolderVal --> Sign["SHA-1 Sign(folder, timestamp + apiSecret)"]
    Sign --> CloudFetch["POST api.cloudinary.com/v1_1/:cloud/image/upload"]
    CloudFetch --> Resp201["201 JSON { url, publicId, width, height, format, bytes }"]

    RouteCheck -->|"Other paths (Dev)"| ViteMW["Vite Dev Middleware (SPA)"]
    RouteCheck -->|"Other paths (Prod)"| DistStatic["express.static(dist/) + fallback dist/index.html"]
```

### 3.4 Authentication & Guest Order Claiming Sequence
```mermaid
sequenceDiagram
    actor User
    participant UI as AuthPage / AccountPage
    participant Store as store.tsx
    participant FBAuth as Firebase Auth
    participant FS as Cloud Firestore

    alt Google Sign-In
        User->>UI: Click "Continue with Google"
        UI->>Store: loginWithGoogle()
        Store->>FBAuth: signInWithPopup(auth, googleProvider)
        FBAuth-->>Store: UserCredential (emailVerified=true)
        Store->>FS: saveUserProfileDoc(uid, profile)
        Store->>FS: claimGuestOrdersInFirestore(uid, email)
        FS-->>Store: claimedOrdersCount
        Store-->>UI: Navigate to /account
    else Email & Password Registration
        User->>UI: Submit Registration Form
        UI->>Store: registerWithEmail(...)
        Store->>FBAuth: createUserWithEmailAndPassword + updateProfile
        Store->>FBAuth: sendEmailVerification(user)
        Store->>FS: saveUserProfileDoc(uid, emailVerified=false)
        Note over Store,FS: Guest orders NOT claimed until emailVerified == true
    else Email Verification & Claim
        User->>UI: Click "Verify Email & Link Orders"
        UI->>Store: verifyAccountEmail()
        Store->>FBAuth: user.reload()
        alt emailVerified == true
            Store->>FS: claimGuestOrdersInFirestore(uid, email)
            FS-->>Store: Claimed orders updated (customerId=uid, isGuest=false)
        else emailVerified == false
            Store->>FBAuth: sendEmailVerification(user)
        end
    end
```

### 3.5 Ticket Reservation Lifecycle & Concurrency Diagram
```mermaid
sequenceDiagram
    actor Buyer
    participant RD as RaceDetailPage
    participant Store as store.tsx
    participant Repo as firestoreRepository.ts
    participant FS as Cloud Firestore

    Buyer->>RD: Choose quantity (1..8) + click "Reserve & Continue"
    RD->>Store: reserveSelectionForCheckout(ticket, qty)
    alt Previous active hold exists
        Store->>Repo: releaseReservationTransaction(prevId, 'replaced')
        Repo->>FS: runTransaction -> restore availableQuantity + status='released'
    end
    Store->>Repo: reserveTicketsTransaction(reservation, items)
    Repo->>FS: runTransaction:
    Note over FS: 1. Read ticket doc\n2. Verify availableQuantity >= qty & status != 'sold_out'\n3. Decrement availableQuantity & recompute status\n4. Write reservations/{id} (status='active', expiresAt=+10m)\n5. Write inventoryLedger/{id}
    alt Transaction Succeeds
        FS-->>Repo: Committed
        Store->>Store: Set cart & activeReservation (10-min countdown)
        Store-->>RD: Navigate to /checkout
    else Permission Error (Rules not published)
        FS-->>Repo: PERMISSION_DENIED
        Store->>Store: Silent fallback to browser-local createReservation()!
        Note over Store: WARNING: Local fallback provides ZERO multi-user concurrency protection
    end
```

### 3.6 Checkout & Payment Processing Flow (Actual Active Behavior vs Legacy PHP)
```mermaid
flowchart TD
    Start["CheckoutPage: Submit Payment"] --> Mode{"apiClient.isRemoteApiConfigured()?"}
    Mode -->|"YES (Legacy PHP API reachable)"| PHP["POST /api/v1/checkout/session"]
    PHP --> StripeRedirect["window.location.href = stripe checkoutUrl"]
    StripeRedirect --> Webhook["Stripe Webhook -> POST /api/v1/webhooks/stripe\n(Legacy PHP verifies HMAC & issues tickets)"]

    Mode -->|"NO (Active AI Studio / Node+Firestore mode)"| LocalSim["store.createOrder()"]
    LocalSim --> Delay["Simulated 600ms card processing\nFabricates pi_verified_* & cs_verified_*"]
    Delay --> Tx["completeOrderTransaction() in Firestore"]
    Tx --> WriteOrder["Write orders/{orderId} (status='confirmed')\nwith embedded IssuedTicket[]"]
    Tx --> UpdateRes["Update reservations/{id} -> status='confirmed'"]
    Tx --> EmailDoc["Write emailJobs/{id} (status='delivered')\nNO ACTUAL EMAIL SENT"]
    WriteOrder --> Confirm["Navigate to /order-confirmed/:orderId"]
```

### 3.7 Reservation Expiry Lifecycle (State Machine)
```mermaid
stateDiagram-v2
    [*] --> active: reserveTicketsTransaction()
    active --> confirmed: completeOrderTransaction() before expiresAt
    active --> released: User clears cart / changes qty / cancels checkout
    active --> expired: Client 1s timer detects Date.now() >= expiresAt
    active --> orphaned_active: User closes browser tab (NO server-side TTL/cron!)
    confirmed --> [*]
    released --> [*]
    expired --> [*]
```

### 3.8 Order Fulfillment & Email Dispatch Flow (Active vs Legacy)
```mermaid
flowchart LR
    Order["Order Created (status='confirmed')"] --> Tickets["Generate IssuedTicket[]\nMST-HUN26-XXXXXXXX + BAR*"]
    Order --> Template["buildOrderConfirmationEmail()\n(orderConfirmationTemplate.ts)"]
    Template --> ActiveBranch["ACTIVE RUNTIME (Node+Firestore)"]
    ActiveBranch --> FSLog["saveEmailJobDoc() -> Firestore emailJobs\nstatus='delivered' (SIMULATED — No HTTP/SMTP call)"]
    Order --> LegacyBranch["LEGACY PHP RUNTIME (Inactive)"]
    LegacyBranch --> ResendAPI["POST https://api.resend.com/emails\n(EmailService.php via cURL)"]
```

### 3.9 Cloudinary Image Upload Architecture
```mermaid
sequenceDiagram
    actor Admin
    participant UI as AdminPanel.tsx
    participant Svc as cloudinaryService.ts
    participant API as server.ts (/api/uploads/cloudinary)
    participant Cloud as Cloudinary API
    participant FS as Cloud Firestore

    Admin->>UI: Select image file (Event Banner or Ticket Image)
    UI->>Svc: uploadImageToCloudinary(file, folder)
    Svc->>Svc: Validate MIME (JPG/PNG/WebP/AVIF) & size <= 10MB
    Svc->>API: POST multipart/form-data (file, folder)
    Note over API: WARNING: No Auth/CSRF/Rate-Limit middleware on endpoint
    API->>API: Validate folder in whitelist + Multer buffer check
    API->>API: Compute SHA-1 signature with CLOUDINARY_API_SECRET
    API->>Cloud: POST /v1_1/{cloudName}/image/upload
    Cloud-->>API: { secure_url, public_id, width, height, format, bytes }
    API-->>Svc: 201 JSON response
    Svc-->>UI: secure_url
    Admin->>UI: Click "Save Event" / "Save Ticket"
    UI->>FS: Save document with Cloudinary HTTPS URL
```

### 3.10 Admin Panel Workflow Diagram
```mermaid
flowchart TD
    Visit["Visit /admin"] --> CheckLS{"localStorage\nmastrotickets_admin_auth == 'true'?"}
    CheckLS -->|"No"| LoginGate["Admin Login Screen"]
    LoginGate --> Hardcoded["Username/Password hardcoded check\n(AdminPanel.tsx:138)"]
    LoginGate --> EmailLogin["Firebase Email/Password\n(BUG: does NOT verify admin role!)"]
    LoginGate --> GoogleLogin["Firebase Google Popup\n(Checks admin allowlist in store.tsx)"]
    Hardcoded --> Unlocked["Admin Workspace (11 Tabs)"]
    EmailLogin --> Unlocked
    GoogleLogin --> Unlocked
    CheckLS -->|"Yes"| Unlocked

    Unlocked --> T1["Dashboard Overview"]
    Unlocked --> T2["Grand Prix Events CRUD + Cloudinary"]
    Unlocked --> T3["Tickets Catalog + Issued Passes (Void/Reissue)"]
    Unlocked --> T4["Inventory Ledger"]
    Unlocked --> T5["Categories CRUD"]
    Unlocked --> T6["Bookings & Orders (Details, Refund, Resend)"]
    Unlocked --> T7["Email Writing & Queue (Simulated)"]
    Unlocked --> T8["Promo & Discounts CRUD"]
    Unlocked --> T9["Audit Security Log"]
    Unlocked --> T10["QA Lifecycle Audit (Stubs)"]
    Unlocked --> T11["System Health (Static Cards)"]
```

### 3.11 Firestore Data Model (ERD)
```mermaid
erDiagram
    EVENTS ||--o{ TICKETS : "eventId"
    CATEGORIES ||--o{ TICKETS : "slug = category"
    EVENTS ||--o{ RESERVATIONS : "eventId"
    RESERVATIONS ||--o| ORDERS : "reservationId"
    USERS ||--o{ ORDERS : "customerId = uid"
    ORDERS ||--o{ EMAIL_JOBS : "orderId"
    TICKETS ||--o{ INVENTORY_LEDGER : "ticketTypeId"
    ADMINS ||--o{ AUDIT_LOGS : "actorEmail"

    EVENTS {
        string id PK
        string slug
        string name
        string circuit
        string location
        string status
        number startingPrice
        boolean featured
    }
    TICKETS {
        string id PK
        string eventId FK
        string category
        string raceDay
        number price
        number fee
        number capacity
        number availableQuantity
        string status
    }
    RESERVATIONS {
        string id PK
        string reservationReference
        string eventId FK
        string status
        string expiresAt
        number total
    }
    ORDERS {
        string id PK
        string orderNumber
        string customerId
        string customerEmail
        boolean isGuest
        string status
        number total
        array tickets
    }
    USERS {
        string uid PK
        string email
        string role
        boolean emailVerified
        string authProvider
    }
```

### 3.12 Ticket Verification Flow
```mermaid
sequenceDiagram
    actor Verifier
    participant Page as TicketVerificationPage
    participant Store as store.tsx
    participant LocalOrders as In-Memory / Firestore Orders

    Verifier->>Page: Visit /verify-ticket/:ticketNumber or enter code
    Page->>Store: verifyTicketByNumber(code)
    Store->>LocalOrders: Search orders[].tickets[] for matching ticketNumber
    alt Match Found
        Store->>Store: Mask attendeeName ("John Doe" -> "J*** D***")
        Store-->>Page: { found: true, isValid: status==='issued', maskedAttendeeName, eventName, section, row, seat, status }
    else Not Found
        Store-->>Page: { found: false, isValid: false }
    end
    Note over Page,LocalOrders: LIMITATION: In Firestore, unauthenticated public users cannot read orders/{id} due to firestore.rules, so verification only works for orders loaded in the current browser session or admin session!
```

### 3.13 Deployment Architecture Diagram
```mermaid
flowchart LR
    subgraph Active["Active Target: Node.js + Firebase + Cloudinary"]
        Build["npm run build -> dist/"]
        Run["tsx server.ts (or Node 22+ w/ TS strip)"]
        FB["Firebase Hosting/Rules (mastro-tickets)\nfirestore.rules deployed manually"]
        CL["Cloudinary Account\nCLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET"]
        Build --> Run
        Run <--> CL
        Browser["Browser SPA"] <--> Run
        Browser <--> FB
    end

    subgraph Legacy["Dormant Alternative: Hostinger VPS (backend/)"]
        Apache["Apache 2.4 + mod_ssl + PHP 8.2"]
        MySQL[("MySQL 8 / MariaDB 10.6")]
        Stripe["Stripe API + Webhooks"]
        Resend["Resend API"]
        Apache <--> MySQL
        Apache <--> Stripe
        Apache <--> Resend
    end
```
