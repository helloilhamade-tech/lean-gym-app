# LEAN — Personalized Gym & Body Lean Tracker

> *"Don't make the user think too much — tell them what to do today."*

**LEAN** is a mobile-first PWA personal gym companion designed specifically for a lean body goal (fat loss / athletic recomposition). Built to feel like a modern health/fitness utility rather than a gamified spreadsheet or bodybuilder dashboard.

---

## 1. Product Philosophy & Key Highlights

- **Mobile-First PWA Baseline**: Optimized strictly for **iPhone XR** (414 × 896 pt baseline), 44pt touch targets, generous spacing, high contrast, and zero visual clutter.
- **In-Gym High-Speed Logging**:
  - Prefilled weights and reps from prior sessions (Acceptance Test AT-01).
  - Floating persistent rest timer with auto-start upon checking a set complete (WO-05).
  - Web Audio chime + haptic feedback (works completely offline with zero external audio assets).
  - Instant local write with optimistic UI updates; zero lost sets inside the gym (WO-08, AT-04).
- **Progressive Overload Engine**:
  - Double progression evaluation: suggests load increase (+1.25 kg or +2.5 kg) when upper rep ceiling is hit at RPE ≤ 8 (AT-02).
  - Epley formula 1RM calculations.
  - Personal Record (PR) notifications.
- **Deterministic Recommendation Engine v1**:
  - Structured output (`Do`, `Eat`, `Recover`) with one visually dominant primary action.
  - 7-day rolling weight average calculation to filter single-day water spikes (AT-03).
  - Protein-deficit prioritization: ranks high-protein options higher when calories are limited (AT-05).
  - Readiness rule: adapts volume/rep intensity gracefully if sleep or energy is low.
- **Nutrition Tracking**:
  - Mifflin-St Jeor TDEE & macro calculations (1.8g–2.2g protein per kg for lean goal).
  - 5-second quick-add (direct Calorie & Protein numeric input).
  - Curated library of 20+ Indonesian & international fitness foods (Dada Ayam, Tempe, Telur, Whey, etc.).
  - Quick-increment water tracker (+250ml, +500ml).
- **Dual Persistence Architecture**:
  - Offline-first IndexedDB via **Dexie.js** for zero-latency in-gym operations.
  - PostgreSQL / Supabase schema & migrations matching the PRD ERD with full relational integrity (PK/FK).
- **Bilingual Support**:
  - Full Bahasa Indonesia default with English toggle (`ID` / `EN`).

---

## 2. Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (dark athletic theme with emerald & copper accents)
- **Local Database**: Dexie.js (IndexedDB wrapper for offline-first client storage)
- **Cloud Database (Optional)**: PostgreSQL / Supabase
- **Icons**: Lucide React
- **Test Runner**: Vitest

---

## 3. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js v24.19.0)
- npm 9+

### Installation & Local Run
```bash
# Clone or open the workspace
cd d:\APLIKASI\GYM

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile browser or toggle Device Emulation to **iPhone XR** (414 × 896 pt).

### Running Automated Tests
```bash
npm test
```

### Production Build
```bash
npm run build
npm start
```

---

## 4. Architecture & Directory Structure

```
d:\APLIKASI\GYM\
├── app/
│   ├── layout.tsx              # Root layout with viewport metadata & AppLayout wrapper
│   ├── page.tsx                # Smart redirect (/today or /onboarding)
│   ├── globals.css             # Dark theme athletic styles & safe areas
│   ├── today/page.tsx          # Today Command Center (TD-01 to TD-06)
│   ├── workout/page.tsx        # Program routine & PR records overview
│   ├── workout/active/page.tsx # Active in-gym logging with rest timer (WO-01 to WO-08)
│   ├── nutrition/page.tsx      # Daily macro budget, 5s quick add & food library
│   ├── progress/page.tsx       # 7-day rolling weight average, check-in, photos
│   ├── onboarding/page.tsx     # 7-step quick onboarding flow (< 3 mins)
│   └── profile/page.tsx        # Profile, target overrides, language & demo data switcher
├── components/
│   ├── shell/
│   │   ├── AppLayout.tsx       # Mobile 414px container, header, bottom nav
│   │   ├── Header.tsx          # App header, language switcher, profile link
│   │   ├── BottomNav.tsx       # 4 primary tabs + floating "+" action button
│   │   └── QuickActionModal.tsx# Instant log modal (workout, meal, weight, water)
│   └── workout/
│       └── RestTimer.tsx       # Floating persistent countdown with audio chime
├── lib/
│   ├── db/
│   │   ├── schema.ts           # ERD-compliant TypeScript interfaces
│   │   ├── dexie-db.ts         # IndexedDB client database with seed handlers
│   │   └── seed-data.ts        # Realistic sample user, exercises, and foods
│   └── domain/
│       ├── progressive-overload.ts # Double progression, 1RM Epley, volume, PR
│       ├── recommendations.ts      # Rule-based engine v1 (7d average, readiness, food)
│       ├── nutrition.ts            # Mifflin-St Jeor TDEE, protein & water calculation
│       └── i18n.ts                 # Bilingual dictionaries (Indonesian & English)
├── supabase/
│   └── migrations/
│       └── 20260908000001_initial_schema.sql # Complete PostgreSQL schema matching ERD
└── tests/
    ├── progressive-overload.test.ts  # Double progression & 1RM tests
    ├── recommendation-engine.test.ts # 7d average & nutrition prioritization tests
    └── nutrition.test.ts             # TDEE & macro budgeting tests
```

---

## 5. Acceptance Criteria Checklist (PRD Page 14)

| Test ID | Requirement | Status | Verification Detail |
|---|---|---|---|
| **AT-01** | Incline DB 15kg × 8 prefilled from previous session | ✅ PASSED | Prefilled in active workout from `SAMPLE_TODAY_WORKOUT_EXERCISES` & `exerciseHistory`. |
| **AT-02** | Load increase recommendation on top rep ceiling with RPE ≤ 8 | ✅ PASSED | Automated test in `tests/progressive-overload.test.ts` validates +2.5kg suggestion. |
| **AT-03** | 7-day rolling average ignores single-day weight spikes | ✅ PASSED | Automated test in `tests/recommendation-engine.test.ts` validates 78.9kg avg with 80.5kg spike. |
| **AT-04** | Workout sets preserved offline across closing/reopening | ✅ PASSED | IndexedDB local writes via Dexie persist sets synchronously without cloud latency. |
| **AT-05** | Ranks high-protein / low-calorie options higher when protein is deficient | ✅ PASSED | Automated test in `tests/recommendation-engine.test.ts` validates `rec-nutri-dense` suggestion. |

---

## 6. Seed Data & Demo Account

The app comes preloaded with realistic development data representing:
- **User**: Alex Pratama, 176 cm, 78.4 kg, Lean Recomposition goal (target 75.0 kg).
- **Training**: 4-day Upper / Lower Split.
- **Workout History**: Completed Upper Body session with Incline DB Press, Lat Pulldown, DB Shoulder Press, etc.
- **Measurements**: 7 daily weights showing smooth 7-day average decline (79.0 → 78.4 kg) and waist measurement.
- **Nutrition**: Today's logged meals (860 kcal, 76g protein) and remaining target calculations.

*To test fresh onboarding anytime:* Navigate to **Profile** → Tap **"Mulai Ulang Onboarding"**.
*To restore demo data:* Navigate to **Profile** → Tap **"Muat Ulang Data Sampel"**.
