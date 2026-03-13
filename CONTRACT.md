# Component Contract — Startup Job Aggregator

This document is the **SOURCE OF TRUTH** for all React component interfaces, shared types, API routes, state management, and localStorage keys.

---

## 1. Shared TypeScript Types

**File: `src/types/index.ts`**

```typescript
export type Job = {
  id: string;
  source_name: string;
  source_url: string;
  company: string;
  role_title: string;
  listing_url: string;
  url_hash: string;
  date_posted: string | null;
  date_scraped: string;
  week_key: string;
  tags: string[];
  is_filtered_in: boolean;
  raw_snippet: string | null;
};

export type FilterState = {
  keyword: string;
  weekKey: string;
  curatedOnly: boolean;
};

export type PipelineRun = {
  id: string;
  run_date: string;
  total_scraped: number;
  new_listings: number;
  duplicate_count: number;
  filtered_count: number;
  error_count: number;
  errors_json: string[] | null;
};

export type AppSource = {
  name: string;
  url: string;
  type: 'vc_board' | 'newsletter';
};
```

---

## 2. Component Contracts

### Sidebar
- **File:** `src/components/Sidebar.tsx`
- **Directive:** `'use client'`
- **Props:** none
- **Imports:** `usePathname` from `next/navigation`, `Briefcase`, `Bookmark`, `Settings` from `lucide-react`, `FilterPanel` from `@/components/FilterPanel`, `getSavedIds` from `@/lib/savedJobs`
- **Behavior:** Renders nav links (Browse `/`, Saved `/saved`, Admin `/admin`), saved count badge from localStorage `sja_saved`, and `<FilterPanel />` below nav.

### FilterPanel
- **File:** `src/components/FilterPanel.tsx`
- **Directive:** `'use client'`
- **Props:** none
- **Imports:** `usePathname`, `useSearchParams`, `useRouter` from `next/navigation`, `Switch`, `SwitchThumb` from `@radix-ui/react-switch`, `Search` from `lucide-react`, `createBrowserClient` from `@/lib/supabase-browser`, `weekKeyToLabel` from `@/lib/weekKey`
- **Behavior:** Returns `null` if `pathname !== '/'`. Otherwise renders Week select, Curated toggle, Search input with 300ms debounce, and optional Reset filters button. Reads/writes URL search params.

### JobListView
- **File:** `src/components/JobListView.tsx`
- **Directive:** `'use client'`
- **Props:**
  ```typescript
  {
    jobs: Job[];
    total: number;
    availableWeeks: string[];
    currentFilters: FilterState;
  }
  ```
- **Imports:** `Job`, `FilterState` from `@/types`, `JobRow` from `@/components/JobRow`, `JobDetailPanel` from `@/components/JobDetailPanel`, `getSavedIds`, `toggleSave` from `@/lib/savedJobs`, `Briefcase` from `lucide-react`, `useRouter` from `next/navigation`
- **State:** `selectedJob: Job | null`, `savedIds: string[]`
- **Behavior:** Renders results bar, scrollable job list with JobRow components, empty state, Load more button, and JobDetailPanel.

### JobRow
- **File:** `src/components/JobRow.tsx`
- **Directive:** `'use client'`
- **Props:**
  ```typescript
  {
    job: Job;
    isSelected: boolean;
    isSaved: boolean;
    onSelect: (job: Job) => void;
  }
  ```
- **Imports:** `Job` from `@/types`
- **Behavior:** Renders a single job row (44px height) with new dot, role title, company, source badge, relative date. Calls `onSelect(job)` on click.

### JobDetailPanel
- **File:** `src/components/JobDetailPanel.tsx`
- **Directive:** `'use client'`
- **Props:**
  ```typescript
  {
    job: Job | null;
    savedIds: string[];
    onClose: () => void;
    onToggleSave: (id: string) => void;
  }
  ```
- **Imports:** `Job` from `@/types`, `X`, `ExternalLink`, `Bookmark` from `lucide-react`
- **Behavior:** Returns `null` when `job` is null. Otherwise renders fixed side panel (desktop) or bottom sheet (mobile) with job details, source link, dates, tags, raw snippet, bookmark button, and open listing button.

### AdminView
- **File:** `src/components/AdminView.tsx`
- **Directive:** `'use client'`
- **Props:**
  ```typescript
  {
    runs: PipelineRun[];
    sources: AppSource[];
    filterConfig: Record<string, string[]>;
  }
  ```
- **Imports:** `PipelineRun`, `AppSource` from `@/types`
- **State:** `localSources: AppSource[]`, `localFilterConfig: Record<string, string[]>`, `saving: boolean`
- **Behavior:** Renders pipeline history table and config editor (sources list + add form, filter config textareas). Saves via POST to `/api/admin`.

---

## 3. Page Contracts

### Home Page (`src/app/page.tsx`)
- **Type:** async Server Component (no `'use client'`)
- **Props:** `{ searchParams: { week?: string; curated?: string; keyword?: string; page?: string } }`
- **Imports:** `createServerClient` from `@/lib/supabase-server`, `currentWeekKey` from `@/lib/weekKey`, `JobListView` from `@/components/JobListView`, `Job` from `@/types`
- **Behavior:** Fetches jobs from Supabase filtered by week, curated, keyword. Passes data to `<JobListView />`.

### Saved Page (`src/app/saved/page.tsx`)
- **Directive:** `'use client'`
- **Imports:** `createBrowserClient` from `@/lib/supabase-browser`, `getSavedIds`, `toggleSave` from `@/lib/savedJobs`, `Job` from `@/types`, `JobRow` from `@/components/JobRow`, `JobDetailPanel` from `@/components/JobDetailPanel`, `Bookmark` from `lucide-react`
- **State:** `jobs: Job[]`, `loading: boolean`, `selectedJob: Job | null`, `savedIds: string[]`
- **Behavior:** Reads saved IDs from localStorage, fetches matching jobs from Supabase, renders list with JobRow and JobDetailPanel.

### Admin Page (`src/app/admin/page.tsx`)
- **Type:** async Server Component (no `'use client'`)
- **Imports:** `createClient` from `@supabase/supabase-js`, `AdminView` from `@/components/AdminView`, `PipelineRun`, `AppSource` from `@/types`
- **Behavior:** Fetches pipeline_runs, sources config, and filter_config from Supabase using service role key. Passes to `<AdminView />`.

### Layout (`src/app/layout.tsx`)
- **Type:** Server Component
- **Imports:** `Inter` from `next/font/google`, `Sidebar` from `@/components/Sidebar`, `./globals.css`
- **Exports:** `metadata` via Next.js Metadata API
- **Behavior:** Renders `<html className="dark bg-zinc-950 text-zinc-50 antialiased">`, `<body className={inter.className}>`, flex layout with Sidebar (240px) and main content area.

---

## 4. API Route Contracts

### POST `/api/admin` (`src/app/api/admin/route.ts`)
- **Export:** `async function POST(req: Request)`
- **Request body:**
  ```typescript
  {
    action: 'save_sources' | 'save_filter_config';
    payload: AppSource[] | Record<string, string[]>;
  }
  ```
- **Response (success):** `NextResponse.json({ ok: true })`
- **Response (error):** `NextResponse.json({ error: string }, { status: 500 })`
- **Auth:** Uses `createClient` from `@supabase/supabase-js` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## 5. Utility Module Contracts

### `src/lib/supabase-server.ts`
- **Export:** `function createServerClient()`
- **Uses:** `createServerClient` from `@supabase/ssr`, `cookies` from `next/headers`
- **Returns:** Supabase client configured with anon key and cookie access

### `src/lib/supabase-browser.ts`
- **Export:** `function createBrowserClient()`
- **Uses:** `createBrowserClient` from `@supabase/ssr`
- **Returns:** Supabase browser client configured with anon key

### `src/lib/savedJobs.ts`
- **Exports:**
  - `function getSavedIds(): string[]` — reads localStorage key `sja_saved`, returns parsed array or `[]`
  - `function toggleSave(id: string): void` — adds/removes ID from saved list (cap 200), dispatches `storage` event
- **localStorage key:** `sja_saved`

### `src/lib/weekKey.ts`
- **Exports:**
  - `function weekKeyToLabel(weekKey: string): string` — converts `'2026-W11'` to `'Week of Mar 9, 2026'`
  - `function currentWeekKey(): string` — returns current ISO week as `'YYYY-WNN'`

---

## 6. State Management

| State | Mechanism | Details |
|-------|-----------|---------|
| Filter state (week, curated, keyword) | URL search params | Read via `useSearchParams()`, write via `router.push()` |
| Saved job IDs | localStorage key `sja_saved` | JSON string of `string[]`. Read via `getSavedIds()` in `useEffect` only. |
| Selected job | React `useState<Job \| null>` | Local to `JobListView` and `SavedPage` |
| Admin local edits | React `useState` | `localSources`, `localFilterConfig` in `AdminView` |

---

## 7. localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `sja_saved` | `string` (JSON array of `string`) | Array of saved job IDs. Max 200 entries. |

---

## 8. Import Path Map

All imports use the `@/*` alias which maps to `./src/*`:

| Import | File Path |
|--------|-----------|
| `@/types` | `src/types/index.ts` |
| `@/components/Sidebar` | `src/components/Sidebar.tsx` |
| `@/components/FilterPanel` | `src/components/FilterPanel.tsx` |
| `@/components/JobListView` | `src/components/JobListView.tsx` |
| `@/components/JobRow` | `src/components/JobRow.tsx` |
| `@/components/JobDetailPanel` | `src/components/JobDetailPanel.tsx` |
| `@/components/AdminView` | `src/components/AdminView.tsx` |
| `@/lib/supabase-server` | `src/lib/supabase-server.ts` |
| `@/lib/supabase-browser` | `src/lib/supabase-browser.ts` |
| `@/lib/savedJobs` | `src/lib/savedJobs.ts` |
| `@/lib/weekKey` | `src/lib/weekKey.ts` |
