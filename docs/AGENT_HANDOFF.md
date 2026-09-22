> **AI AGENT INSTRUCTION:** Read this document before exploring the repository. Treat it as the current engineering state snapshot. Use the file paths and sections here to navigate directly to relevant code. Do NOT scan the entire repository unless the task genuinely requires it. Verify only the specific assumptions relevant to the requested task.

# Agent Handoff — Pratha

> Canonical continuation document for AI coding agents.

| Field | Value |
|---|---|
| Last updated | 2026-09-23 |
| Branch | `feat/expo-ios-migration` (synced to `main`) |
| Commit | `d94d0c2` (chore(branding): rename app from Sattva to Pratha) |
| Working tree | Clean |
| Current phase | Cross-platform migration and final polish |
| Overall status | Fully functional React Web App, Android App, and iOS Bridge |

---

## 2. READ THIS FIRST

**Product Description:** Pratha (formerly Sattva) is a digital sanctuary app offering remote Vedic rituals (Pujas), Gaushala interactions (cow adoption/feeding), Seva (donations), and AI-guided spiritual assistance (Rishi).
**Current State:** The core Web application (React+Vite) has been fully implemented, integrated with Firebase Auth & Firestore, and bundled natively into Android (via Capacitor) and iOS (via Expo DOM Components). The branding was just successfully renamed from Sattva to Pratha across all files, configurations, and Git remotes.
**What's Next:** There is no active implementation task. The application is in a stable state ready for distribution.
**Critical Constraints:** DO NOT rewrite the React DOM application into React Native primitives. The iOS build specifically relies on Expo SDK 57's `"use dom"` component architecture (`PrathaDomBridge.tsx`) to render the existing web app in-memory on iOS.

---

## 3. CURRENT TASK / NEXT ACTION

## Current Task

No active implementation task recorded.

## Immediate Next Step

No active implementation task recorded.

## Definition of Done

- [ ] N/A

---

## 4. PROJECT ARCHITECTURE

- **Frontend (`web/`)**: React 19 + Vite + Tailwind CSS + Lucide Icons + React Router DOM. State managed with TanStack Query. Uses Firebase Client SDK for Auth.
- **Android App (`web/android/`)**: Built via Capacitor 8, directly wrapping the `web/dist` assets.
- **iOS App (`expo/`)**: Isolated Expo project utilizing DOM components (`react-native-webview`) to render the `web` React app seamlessly without rewriting it in React Native.
- **Backend API (`backend/`)**: Cloudflare Worker (`src/index.ts`) acting as an API Gateway. Communicates directly with Firestore via Google Cloud REST API using Service Account logic/Project ID and handles Gemini AI requests.
- **Database**: Firebase / Google Cloud Firestore (Project ID: `sattva-utsavam-dev`).
- **AI**: Gemini 2.5 Flash API utilized in the Cloudflare worker for the "Rishi" AI guide interactions.

```text
Pratha/
├── backend/            → Cloudflare Worker API (TS)
├── expo/               → Expo iOS DOM Component Bridge
├── web/                → React Vite Frontend + Capacitor (Android)
└── docs/               → Handoff and docs
```

---

## 5. REPOSITORY MAP

```text
backend/
├── src/index.ts        → Cloudflare Worker entrypoint (Auth, Firestore, Gemini)
├── wrangler.jsonc      → Worker environment config & secrets config

expo/
├── src/PrathaDomBridge.tsx → The DOM bridge component that mounts the web app for iOS
├── App.tsx             → Expo root rendering the bridge
├── app.json / eas.json → Expo and EAS build configurations

web/
├── android/            → Capacitor generated Android studio project
├── src/
│   ├── App.tsx         → Main React entrypoint & routing setup
│   ├── components/     → Shared UI components (layout, dialogs, loaders)
│   ├── features/       → Feature modules (auth, ai, home, gaushala, profile, pujas, seva)
│   └── lib/            → Shared utilities, API clients, Firebase init
├── capacitor.config.ts → Capacitor config for Android
└── vite.config.ts      → Vite config
```

---

## 6. IMPLEMENTATION STATUS

| Area | Status | Relevant Files | Notes |
|---|---|---|---|
| Frontend Web UI | COMPLETE | `web/src/features/` | Polished design with sacred aesthetics |
| Authentication | COMPLETE | `web/src/features/auth/`, `web/src/lib/firebase.ts` | Enforced Firebase Google/Email login before accessing app |
| Database / Backend | COMPLETE | `backend/src/index.ts` | Cloudflare Worker REST endpoints mapping to Firestore |
| Capacitor Android | COMPLETE | `web/android/` | Builds cleanly (`npx cap sync android`) |
| Expo iOS Bridge | COMPLETE | `expo/src/PrathaDomBridge.tsx` | Expo DOM bridge fully implemented and bundles successfully |
| App Rename | COMPLETE | All files | Renamed Sattva -> Pratha completely |

---

## 7. RECENT CHANGES

### 2026-09-23 — Rename app from Sattva to Pratha
- Changed: Application branding, GitHub repository name, local directory.
- Files: `web/index.html`, `web/src/App.tsx`, `expo/app.json`, `expo/src/PrathaDomBridge.tsx`, etc.
- Why: User requested complete rebrand to "Pratha".
- Result: Clean git state, successful builds across Web, Android, and iOS Expo bundle.
- Remaining work: None.

### 2026-09-23 — Expo iOS DOM Bridge Migration
- Changed: Created `expo/` isolated directory.
- Files: `expo/App.tsx`, `expo/src/PrathaDomBridge.tsx`, `web/src/App.tsx` (exported `PrathaAppContent`).
- Why: User requested iOS build without rewriting the React DOM app.
- Result: EAS iOS build architecture functional.

---

## 8. IMPORTANT TECHNICAL DECISIONS

### Decision: Use Expo DOM Components for iOS (Zero-Rewrite)
Reason: To deploy the web application to iOS without spending weeks rewriting DOM elements (`div`, `span`) to React Native primitives (`View`, `Text`).
Do not change this unless: The application's fundamental architecture shifts to pure React Native. Keep all web logic in `web/` and only mount it through `expo/src/PrathaDomBridge.tsx`.

### Decision: Direct Firestore REST API via Cloudflare Worker
Reason: The backend acts as a stateless gateway. Instead of using the Firebase Admin SDK (which is bloated for V8 workers), it makes raw REST calls to `firestore.googleapis.com`.
Do not change this unless: You are migrating away from Cloudflare Workers to a Node.js/Docker container backend.

---

## 9. KNOWN ISSUES / BUGS

No major unresolved functional bugs currently logged.

---

## 10. FAILED APPROACHES

None documented during the recent rename/Expo migration phase.

---

## 11. ENVIRONMENT / SETUP

* **Node.js**: v20+ recommended
* **Package Manager**: `npm` (Note: Run `npm install` inside `web/`, `expo/`, and `backend/` independently as there is no root package.json workspace setup yet).
* **Firebase**: Project `sattva-utsavam-dev`
* **Local Dev (Web)**: `cd web && npm run dev`
* **Local Dev (Expo)**: `cd expo && npm start`

---

## 12. IMPORTANT COMMANDS

```bash
# Start Web Frontend
cd web && npm run dev

# Build Web Frontend
cd web && npm run build

# Build Android (Capacitor)
cd web && npx cap sync android && cd android && ./gradlew assembleDebug

# Export Expo iOS Bundle
cd expo && npx expo export -p ios --clear

# Trigger Cloud iOS Simulator Build (EAS)
cd expo && npx eas build --platform ios --profile preview-simulator
```

---

## 13. DATA / DATABASE STATE

* **Technology**: Google Cloud Firestore (Firebase)
* **Location**: Configured in `web/src/lib/firebase.ts` (Client) and `backend/src/index.ts` (REST).
* **Key Collections**:
  - `users/{uid}/puja_bookings`
  - `users/{uid}/seva_contributions`
  - `users/{uid}/family_members`
* No raw credentials in code. `backend` relies on `wrangler.jsonc` secrets.

---

## 14. API / INTEGRATION MAP

| Integration | Location | Purpose | Status |
|---|---|---|---|
| Cloudflare Worker | `backend/src/index.ts` | Custom endpoints (`/api/v1/...`) | Active |
| Firestore API | `backend/src/index.ts` | Data persistence for bookings/seva | Active |
| Gemini API | `backend/src/index.ts` -> `/api/v1/ai/ask` | Rishi AI chatbot responses | Active |
| Firebase Auth | `web/src/lib/firebase.ts` | Client-side Google/Email authentication | Active |

---

## 15. TESTING STATUS

* **Frameworks**: None explicitly configured for unit testing in `web/` package.json.
* **Linter**: Oxlint configured (`npm run lint` in `web/`). Passes with 0 errors.
* **Builds**: `npm run build` (Vite/TSC) passes. Android Gradle build passes. Expo iOS export passes.

---

## 16. GIT / WORKING TREE CONTEXT

* **Branch**: `feat/expo-ios-migration`
* **Latest Commit**: `d94d0c2`
* **Uncommitted Changes**: None.
* **Remotes**: `origin` points to `marvelpokemaster/Pratha`.

---

## 17. DO NOT TOUCH / HIGH-RISK AREAS

* `expo/src/PrathaDomBridge.tsx`: Highly sensitive Expo `"use dom"` directive file. Do not alter the imports or mounting strategy without thoroughly understanding Expo SDK 57 DOM components.
* `web/android/`: Auto-generated and carefully synced Capacitor folder. Do not edit Android native files manually unless absolutely necessary (use `capacitor.config.ts` or plugins instead).

---

## 18. OPEN QUESTIONS

- [ ] Should a root workspace `package.json` (npm workspaces / turbo) be introduced to manage `web/`, `expo/`, and `backend/` scripts together?
- [ ] Will production builds require Apple Developer Program certificates in `eas.json`?

---

## 19. HANDOFF CHECKLIST

- [x] Current task documented
- [x] Architecture updated
- [x] Recent changes recorded
- [x] Known issues recorded
- [x] Failed approaches recorded
- [x] Important decisions recorded
- [x] Commands verified
- [x] Git state recorded
- [x] No secrets included
- [x] Next action clearly stated
