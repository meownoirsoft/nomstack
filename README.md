# NomStack

> AI-powered meal planning. Photograph a recipe, get a shopping list.

**Stack:** SvelteKit · Supabase · Gemini Vision · Dexie · Stripe · Playwright

---

## Overview

NomStack is a production full-stack meal planning application that lets users photograph physical recipe cards, printed recipes, or any dish image and have the full recipe — ingredients, steps, timing, servings — extracted automatically using computer vision.

Extracted recipes feed into a structured meal planning workflow: select meals for the week, navigate to the shopping page, and receive a unified categorized ingredient list aggregated across all selected recipes. No manual list-building. No duplicate entries.

The application is deployed as a PWA with offline capability via IndexedDB, and includes a Stripe-based subscription system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | SvelteKit 2, Svelte 5, TypeScript |
| Styling | Tailwind CSS 3, DaisyUI 4 |
| Backend | SvelteKit server routes (Node.js) |
| Database | Supabase (PostgreSQL + Auth) |
| Local Storage | Dexie 4 (IndexedDB) |
| Primary Vision Model | Google Gemini 1.5 Pro Vision |
| Fallback Vision Model | OpenAI GPT-4o |
| Restaurant Discovery | Google Places API |
| Payments | Stripe |
| Build | Vite 5, vite-plugin-pwa |
| Testing | Playwright (e2e) |
| Analytics | Vercel Analytics |

---

## Architecture

### API Surface

All endpoints live under `src/routes/api/` as SvelteKit server handlers. Every protected route validates the Supabase JWT server-side via `getUserIdFromRequest()` before returning any data.

| Endpoint | Description |
|---|---|
| `POST /api/parse-recipe-photo` | Vision model pipeline — core AI feature |
| `POST /api/meal-add` | Add a meal/recipe |
| `GET /api/meal-get` | Fetch meals |
| `POST /api/meal-del` | Delete a meal |
| `GET /api/meal-filters` | Filter and search support |
| `POST /api/meal-plans` | Meal plan management |
| `POST /api/adjust-recipe-servings` | LLM-assisted serving size scaling |
| `GET /api/ingredients` | Ingredient management |
| `POST /api/cat-add` | Add category |
| `GET /api/cat-get` | Get categories |
| `POST /api/cat-upd` | Update category |
| `POST /api/cat-del` | Delete category |
| `GET /api/google-places-search` | Restaurant search |
| `GET /api/google-places-details` | Restaurant detail lookup |
| `POST /api/login` | Supabase Auth session |
| `POST /api/logout` | Session teardown |
| `GET /api/debug-subscription` | Stripe subscription state |

---

## AI Vision Pipeline

The recipe photo parser is the core technical feature. A user photographs a recipe and the server returns a fully structured JSON recipe object ready for the database.

### Provider Strategy

The pipeline uses a two-provider fallback architecture:

1. **Primary:** Google Gemini 1.5 Pro Vision
2. **Fallback:** OpenAI GPT-4o

Provider selection is determined at runtime by environment variable presence. If Gemini errors or returns non-200, the pipeline silently retries with OpenAI before surfacing any failure to the client.

### Image Handling

Images arrive as multipart form data. The server reads to `ArrayBuffer`, converts to base64, and preserves MIME type. No intermediate file storage — the image lives in memory for the duration of the request only.

### Prompt Engineering

Both providers receive the same structured prompt, engineered for deterministic output:

- **Explicit JSON schema** with field names, types, and defaults — reduces hallucination and format drift
- **Temperature 0.1** on both providers for consistent, low-variance parsing
- **Canonical ingredient format:** `amount → unit → adjective → noun → action`
  - e.g. `3 cloves garlic, peeled and minced`
  - e.g. `1/2 cup brown sugar, lightly packed`
- **Time extraction rules** explicitly exclude non-cooking times (chill, rest, marinate) to prevent inflated estimates
- **1500 max tokens** — sufficient for any recipe, prevents runaway responses

### Response Parsing & Validation

- Markdown code fences stripped before JSON parsing (models occasionally wrap output despite instructions)
- Required fields (`ingredients`, `instructions`) validated after parse
- Numeric fields (`prepTime`, `cookTime`, `servings`) coerced via `parseInt` with safe defaults
- `totalTime` computed server-side as `prepTime + cookTime`

### Error Tiers

| Tier | Behavior |
|---|---|
| Gemini API error | Silent fallback to OpenAI |
| Both providers fail | 500 with descriptive message |
| Unparseable JSON response | 500 with format error |

---

## Meal Plan & Shopping List Workflow

The planning workflow is the primary UX differentiator. It eliminates the most tedious part of meal planning: manually compiling a shopping list across multiple recipes.

### Flow

1. Browse saved recipes on the meals page (`/`)
2. Select meals via checkbox — selections persist across navigation
3. Navigate to `/shopping`
4. Shopping page aggregates all ingredients from selected meals, deduplicates shared ingredients, and organizes by category
5. Ingredients shared across multiple recipes display a meal count badge: `(2 meals)`
6. Update selections at any time — list updates reactively

### Ingredient Aggregation

The shopping list engine groups ingredients across recipes rather than listing per-meal. If two selected recipes both call for garlic, the user sees one entry with a badge indicating it spans multiple meals. Results are organized into category sections matching the app's category system.

---

## Data Layer

### Supabase (Remote)

Primary persistent store backed by PostgreSQL. Handles all meal, recipe, category, and ingredient data. Authentication uses Supabase Auth with JWT tokens validated server-side on every protected route. Subscription metadata is also stored here for Stripe integration.

### Dexie / IndexedDB (Local)

Dexie 4 wraps the browser's IndexedDB API for local-first data caching. Combined with the PWA service worker, this enables NomStack to function in offline or low-connectivity conditions — meaningful for a kitchen app.

---

## Progressive Web App

Configured via `vite-plugin-pwa`:

- **Installable** — add to home screen on mobile and desktop
- **Service worker** — background asset caching for offline access
- **App-like experience** — full-screen mode, splash screen, custom icons

---

## Shared Household Lists

NomStack supports collaborative shopping lists designed for household use. A shareable link grants household members access to view the list and submit items for review — without requiring a full account.

### How It Works

- The list owner (e.g. a parent) generates a shareable link for the household
- Household members open the link and can add items they need
- Submitted items go into a **review queue** rather than directly onto the list
- The owner reviews pending items and approves or vetoes each one — allowing them to reject items they already have at home
- Approved items are added to the active shopping list

### Design Intent

The veto step is intentional. It keeps the list owner in control of what actually gets purchased while still giving household members a low-friction way to contribute. Kids can add what they want; the parent decides what's actually needed.

This feature requires no account creation for contributors — the shareable link is the only credential needed to submit items.

---

## Restaurant Discovery

Two Google Places API endpoints extend NomStack into restaurant-aware planning:

- `/api/google-places-search` — query-based place search with basic metadata
- `/api/google-places-details` — full place details by `place_id` (address, hours, contact, ratings)

Users can incorporate restaurant meals into weekly plans alongside home-cooked recipes.

---

## Payments

Stripe is integrated server-side (not client-only) for subscription billing. A `debug-subscription` endpoint exposes live subscription state, suggesting feature gating tied to plan tier.

---

## Test Suite

End-to-end tests via Playwright, organized by feature domain.

| File | Coverage |
|---|---|
| `meal-plan-workflow.spec.ts` | Full planning flow, reactive updates, meal count badges |
| `ingredient-state.spec.ts` | Ingredient lifecycle and state transitions |
| `move-category.spec.ts` | Category management and reassignment |
| `data-persistence.spec.ts` | Data survival across sessions and reloads |
| `theme-changes.spec.ts` | UI theme switching |

### Running Tests

```bash
npm run test:e2e              # Full suite
npm run test:critical         # Core workflow tests only
npm run test:data             # Persistence tests
npm run test:theme            # Theme tests
npm run test:e2e:ui           # Playwright UI mode
npm run test:e2e:debug        # Debug mode with inspector
```

---

## Database Migrations

```bash
npm run migrate:add-categories
```

Backfills category data for existing records after the category system was added post-launch.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_AI_API_KEY` | Recommended | Gemini Vision API key (primary) |
| `OPENAI_API_KEY` | Fallback | GPT-4o API key (fallback if Gemini unavailable) |
| `SUPABASE_URL` | Required | Supabase project URL |
| `SUPABASE_ANON_KEY` | Required | Supabase anon/public key |
| `STRIPE_SECRET_KEY` | Required | Stripe server-side key |
| `GOOGLE_PLACES_API_KEY` | Optional | Google Places API key for restaurant discovery |

---

## Development

```bash
npm install
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
```

---

## License

Private.
