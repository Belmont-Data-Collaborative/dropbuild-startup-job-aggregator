# Startup Job Aggregator — Build Instructions

**App ID**: startup-job-aggregator
**Runtime**: nextjs

## Technology Constraints

RUNTIME CONSTRAINT -- THIS IS CRITICAL:
The spec declares runtime "nextjs". This means:
- techStack.frontend MUST be "Next.js + React + TypeScript".
- techStack.backend MUST be "Next.js API Routes".
- techStack.deployment MUST be "Vercel".
- Use Next.js 14+ with the App Router (app/ directory). Do NOT use the Pages Router (pages/ directory).
- Use React 18+ with functional components and hooks.
- Use TypeScript for ALL source files (.tsx, .ts). Do NOT use plain .js or .jsx files.
- Use Tailwind CSS for all styling. Do NOT use CSS modules, styled-components, Emotion, or other CSS-in-JS.
- Do NOT use other frameworks (Vue, Angular, Svelte, Solid, etc.).
- Do NOT use alternative meta-frameworks (Remix, Astro, Gatsby, etc.).
- Components that use hooks, event handlers, or browser APIs MUST include the "use client" directive at the top of the file.
- Server Components are the default in App Router. Only add "use client" when the component needs interactivity.

## Required Project Structure

Required directory structure (Next.js 14+ App Router):
- app/layout.tsx — Root layout (html/body tags, globals.css import, metadata export)
- app/page.tsx — Home page (Server Component by default)
- app/globals.css — Tailwind directives (@tailwind base; @tailwind components; @tailwind utilities;)
- app/components/ — React components (.tsx files)
- app/api/*/route.ts — API route handlers (export named HTTP methods: GET, POST, etc.)
- types/ or lib/ — Shared TypeScript types and utility functions
- package.json — Dependencies: next, react, react-dom, typescript, @types/react, @types/react-dom, @types/node, tailwindcss, postcss, autoprefixer
- tsconfig.json — TypeScript config (strict mode enabled)
- next.config.mjs — Next.js config
- tailwind.config.ts — Tailwind config (content paths must cover app/ directory)
- postcss.config.mjs — PostCSS config
- Optional: middleware.ts, app/loading.tsx, app/error.tsx

DO NOT include:
- pages/ directory (Pages Router) — use App Router only
- CSS modules, styled-components, Emotion, or CSS-in-JS libraries
- Plain .js or .jsx files (all code must be TypeScript)
- Vue, Angular, Svelte, or other frameworks

## Contract Rules

Contract type: `componentContract`

The componentContract is the SOURCE OF TRUTH for all React component interfaces. The architect teammate must define a componentContract in CONTRACT.md listing every component with its exact props and TypeScript types, shared type definitions, API route contracts (method, request/response shapes), state management approach, and localStorage keys. All teammates must match these interfaces exactly.

## Code Patterns and Anti-Patterns

- Use Next.js 14+ App Router (app/ directory). Do NOT use the Pages Router (pages/ directory).
- Use TypeScript for ALL source files (.tsx for components/pages, .ts for utilities and types).
- Use Tailwind CSS for ALL styling — no CSS modules, styled-components, or CSS-in-JS.
- Components using hooks, event handlers, or browser APIs MUST have "use client" at the top of the file.
- Server Components are the default — only add "use client" when the component needs interactivity.
- API route handlers MUST export named HTTP method functions (GET, POST, etc.), not default exports.
- CRITICAL: Component props must match the componentContract exactly — use the exact TypeScript types.
- CRITICAL: Import paths must match exact file paths from the manifest.
- Do NOT use Vue, Angular, Svelte, or any other framework.
- Do NOT use the Pages Router (pages/ directory).

## QA Validation Rules

RUNTIME COMPLIANCE CHECK (HIGH PRIORITY):
If the runtime is "nextjs", the app MUST use Next.js 14+ App Router, React 18+, TypeScript, and Tailwind CSS.
Flag as HIGH severity if you find ANY of the following:
  - A pages/ directory (Pages Router instead of App Router)
  - Plain .js or .jsx files instead of TypeScript (.ts/.tsx)
  - Vue (.vue), Svelte (.svelte), or other non-React framework files
  - CSS modules, styled-components, Emotion, or other CSS-in-JS solutions instead of Tailwind
  - Missing "use client" directive on components that use hooks, event handlers, or browser APIs
  - "use client" directive on components that do NOT need it (unnecessary client components)

TYPESCRIPT TYPE CONSISTENCY (HIGHEST PRIORITY):
For every component prop, shared type, and API route contract:
  - Verify that component props match the componentContract specification EXACTLY.
  - Verify that shared types/interfaces are imported from the correct paths and match their definitions.
  - Verify that API request/response types are consistent between route handlers and client-side fetch calls.
  - Flag as HIGH severity if a component accepts { title: string } but the parent passes { name: string }.

COMPONENT PROP VALIDATION:
For every component usage (<ComponentName prop={value} />):
  - Verify the component exists at the imported path.
  - Verify all required props are passed.
  - Verify prop types match the component definition.
  - Flag missing or extra props as MEDIUM severity.

IMPORT PATH CORRECTNESS:
For every import statement:
  - Verify the imported file exists in the file manifest.
  - Verify the import path is correct relative to the importing file.
  - Verify named imports match actual exports from the target file.
  - Flag as HIGH severity if an import references a non-existent file or export.

MISSING "use client" DIRECTIVES:
For every .tsx component file:
  - If the file uses useState, useEffect, useRef, useContext, or any React hook: MUST have "use client".
  - If the file uses onClick, onChange, onSubmit, or any event handler: MUST have "use client".
  - If the file uses window, document, localStorage, or any browser API: MUST have "use client".
  - Flag as HIGH severity if "use client" is missing when needed.

NEXT.JS APP ROUTER CONVENTIONS:
  - app/layout.tsx must export a default function that accepts { children }.
  - app/page.tsx must export a default function component.
  - API routes must export named HTTP method functions (GET, POST, etc.), not a default export.
  - API routes must use NextRequest/NextResponse or Web Request/Response APIs.
  - Metadata should use the Next.js Metadata API (export const metadata), not <Head> from next/head.

TAILWIND CLASS VALIDITY:
  - Verify that Tailwind utility classes are valid (e.g. "flex", "p-4", "text-lg", not "display-flex" or "padding-4").
  - Verify responsive prefixes are correct (sm:, md:, lg:, xl:, 2xl:).
  - Verify custom colors or values reference the Tailwind config if non-standard.

API ROUTE RESPONSE TYPES:
  - Verify that API route handlers return the response shape specified in the componentContract.
  - Verify that client-side fetch calls expect the correct response shape.
  - Verify proper error handling with appropriate HTTP status codes.

Additional cross-file checks:
- Verify that all components listed in the componentContract are actually created and exported.
- Verify that package.json includes all necessary dependencies (next, react, react-dom, typescript, tailwindcss, etc.).
- Verify that tsconfig.json has proper Next.js TypeScript settings.
- Verify that tailwind.config.ts content paths cover all component files.

STRUCTURED REQUIREMENT VERIFICATION (when structuredRequirements and fileRequirementMap are provided):
- For each file, check the requirements listed in its implementsRequirements.
- For each such requirement, verify every acceptance criterion against the source code.
- Populate requirementCoverage with per-requirement status.
- When an issue maps to a specific requirement, set requirementId and acceptanceCriterion on the issue.

ENVIRONMENT FILE SETUP:
- If .env.example exists but .env.local does not, flag as HIGH severity.
- The tester should copy .env.example to .env.local before building/running the app.
- Without .env.local, the app cannot read configuration and may crash at runtime.

SMOKE TEST — APP ACTUALLY RUNS:
- After next build passes, the tester MUST start the app and verify it responds.
- Start: npx next start -p 3099 &
- Verify: curl -s http://localhost:3099 should contain "__next" (Next.js marker).
- Flag as CRITICAL severity if the app builds successfully but crashes when started.
- A passing "next build" does NOT guarantee the app actually runs at runtime.

## Fix Guidelines

You are a senior React/Next.js/TypeScript engineer fixing bugs found by a QA review.
You are given:
- The refined app spec (what the app should do).
- ALL files in the project with their current contents.
- ALL QA issues found across the entire project.
- The ONE file you need to fix.

Your job is to return the COMPLETE corrected contents of that ONE file, fixing all relevant QA issues.

CRITICAL RULES:
- Respond with the raw file contents ONLY: no markdown fences, no JSON, no commentary.
- Do NOT wrap the code in ``` fences.
- Do NOT include any explanation before or after the code.
- Return the COMPLETE file, not a diff or partial snippet.
- The file must be valid UTF-8 text suitable to write directly to disk.

CROSS-FILE CONSISTENCY (MOST IMPORTANT):
- Match component props to the componentContract specification exactly.
- Fix import paths to reference files that actually exist in the project.
- Fix type mismatches between components, API routes, and shared types.
- Ensure "use client" directive is present when the component uses hooks, event handlers, or browser APIs.
- Ensure "use client" directive is NOT present on pure Server Components.

TECHNOLOGY STACK:
- Next.js 14+ with App Router. Do NOT use Pages Router patterns.
- React 18+ with functional components and hooks.
- TypeScript with proper type annotations. Do NOT use "any" type. Do NOT use plain JavaScript.
- Tailwind CSS for styling. Do NOT use CSS modules, styled-components, or inline styles.
- API routes use App Router conventions (export named HTTP methods, use NextResponse).

REQUIREMENT-DRIVEN FIXES:
- Use the acceptance criteria to understand what "correct" means.
- When an issue references a requirementId, check the corresponding acceptance criteria.
- Fix the code to satisfy the specific criteria listed, not just the vague issue description.

## Deployment

Strategy: vercel
Required env vars: VERCEL_TOKEN
Next.js apps deploy to Vercel via `npx vercel --yes --token=$VERCEL_TOKEN`.

## Application Requirements

1. Tech stack: Next.js 14 App Router, TypeScript 5 strict mode, Tailwind CSS 3.
2. Packages: next@14.2.3, react@^18, react-dom@^18, typescript@^5, @types/react@^18, @types/react-dom@^18, @types/node@^20, tailwindcss@^3, postcss@^8, autoprefixer@^10, @supabase/ssr@^0.3.0, @supabase/supabase-js@^2.43.0, @radix-ui/react-switch@^1.0.3, lucide-react@^0.378.0, tailwind-merge@^2.3.0, clsx@^2.1.1.
3. Do NOT use shadcn/ui (requires a CLI).
4. Node engine >=18. ALL source files must be TypeScript (.tsx for components/pages, .ts for utilities).
5. No .js or .jsx files.
6. Design system — tailwind.config.ts must set darkMode: 'class'.
7. Use Tailwind's built-in zinc palette.
8. The app is dark mode only — no light mode toggle.
9. Page background: bg-zinc-950.
10. Primary surface (sidebar, panels): bg-zinc-900.
11. Elevated surface (hover rows): bg-zinc-800.
12. Border: border-zinc-800.
13. Primary text: text-zinc-50.
14. Secondary text: text-zinc-400.
15. Muted text: text-zinc-500.
16. Accent: violet-400 (#a78bfa) — active nav, selected row, primary buttons, links.
17. New/highlight: amber-400.
18. Source badge: bg-zinc-800 text-zinc-300.
19. Font: Inter from next/font/google — import { Inter } from 'next/font/google'; const inter = Inter({ subsets: ['latin'] }); apply className to <body> in layout.tsx.
20. Base font size 14px.
21. Global layout (src/app/layout.tsx) — html element has class='dark bg-zinc-950 text-zinc-50 antialiased'.
22. Import and apply Inter font via className on body.
23. No top header bar — navigation lives in the left sidebar only.
24. The layout renders: a fixed left sidebar (240px wide, full viewport height, bg-zinc-900 border-r border-zinc-800) and a main content area (flex-1 overflow-y-auto).
25. Both are children of a div with class='flex h-screen'.
26. Sidebar is always rendered.
27. On mobile (<768px) the sidebar collapses — show a top bar with a hamburger button instead (use useState for open/closed).
28. Import Sidebar component in layout.tsx.
29. Left sidebar (src/components/Sidebar.tsx) — 'use client'.
30. Fixed height, flex flex-col overflow-hidden p-3.
31. Top section: app name 'Startup Jobs' text-sm font-semibold text-zinc-50, below it 'VC-sourced listings' text-xs text-zinc-500.
32. Divider: border-b border-zinc-800 my-3.
33. Navigation links: Browse (href='/'), Saved (href='/saved'), Admin (href='/admin').
34. Each link: flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors.
35. Active (usePathname() === href): bg-zinc-800 text-zinc-50.
36. Inactive: text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50.
37. Icons from lucide-react: Briefcase for Browse, Bookmark for Saved, Settings for Admin.
38. Saved link shows a count badge (number from localStorage key 'sja_saved', read in useEffect + updated via window storage event listener — show only when count > 0, small rounded bg-violet-500 text-white text-xs px-1.5 ml-auto).
39. After the nav links, always render <FilterPanel /> (FilterPanel itself shows/hides based on the current route using usePathname inside FilterPanel).
40. Sidebar bottom: nothing.
41. Filter panel (src/components/FilterPanel.tsx) — 'use client'.
42. Uses usePathname() from next/navigation — if pathname !== '/' return null (hides itself on non-browse pages).
43. Uses useSearchParams() and useRouter() from next/navigation for reading/pushing filter state.
44. Fetches availableWeeks in useEffect on mount using createBrowserClient() from src/lib/supabase-browser.ts: const { data } = await supabase.from('jobs').select('week_key').order('week_key', {ascending: false}); then deduplicate and sort desc.
45. Store in useState<string[]>.
46. Three filters only — do not add more.
47. Separated from nav by a divider (border-t border-zinc-800 mt-3 pt-3).
48. Section label: 'Filters' text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-3.
49. Filter 1 — Week: label 'Week' text-xs text-zinc-500 mb-1 px-3.
50. A full-width select (bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md px-2 py-1.5 w-full mx-3 focus:outline-none focus:ring-1 focus:ring-violet-400; width calc(100% - 24px)).
51. Options are availableWeeks mapped to weekKeyToLabel().
52. On change: push week=value to URL.
53. Filter 2 — Curated only: flex items-center justify-between px-3.
54. Label 'Curated only' text-sm text-zinc-300.
55. A @radix-ui/react-switch — Switch root styled: data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-zinc-700 h-5 w-9 rounded-full transition-colors; Thumb: block h-4 w-4 rounded-full bg-white translate-x-0.5 transition-transform data-[state=checked]:translate-x-[18px].
56. Default ON (searchParams.get('curated') !== '0').
57. On toggle: push curated=1 or curated=0.
58. Filter 3 — Search: px-3 mt-2.
59. A relative div. Search icon (lucide Search, 14px, text-zinc-500) absolute left-3 top-2.5.
60. Input: bg-zinc-800 border border-zinc-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-400 w-full.
61. Placeholder 'Search roles…'. 300ms debounce using useEffect + setTimeout.
62. On change: push keyword=value or remove keyword param if empty.
63. Below three filters: if any filter is non-default (keyword non-empty, curated=0, or week !== most recent), show a 'Reset filters' button text-xs text-zinc-500 hover:text-zinc-300 px-3 mt-3 that clears all params.
64. Main page (src/app/page.tsx) — async Server Component.
65. Accepts searchParams prop.
66. Reads: week (default: most recent week_key from DB), curated (default '1'), keyword (default ''), page (default '1').
67. Uses createServerClient() from src/lib/supabase-server.ts.
68. Step 1: fetch distinct week_keys — const { data: weekRows } = await supabase.from('jobs').select('week_key').order('week_key', {ascending: false}); deduplicate client-side.
69. Step 2: default week = weekRows[0]?.week_key ?? currentWeekKey().
70. Step 3: build jobs query — start with supabase.from('jobs').select('*', {count: 'exact'}).
71. Apply .eq('week_key', resolvedWeek).
72. If curated === '1': .eq('is_filtered_in', true).
73. If keyword non-empty: .or('role_title.ilike.*'+keyword+'*,company.ilike.*'+keyword+'*').
74. Apply .order('date_scraped', {ascending: false}).range(0, 49).
75. Execute: const { data: jobs, count } = await query.
76. Step 4: pass to JobListView — <JobListView jobs={jobs ?? []} total={count ?? 0} availableWeeks={weekKeys} currentFilters={{keyword, weekKey: resolvedWeek, curatedOnly: curated === '1'}} />
77. Job list view (src/components/JobListView.tsx) — 'use client'.
78. Props: jobs: Job[], total: number, availableWeeks: string[], currentFilters: FilterState.
79. State: selectedJob: Job|null (useState), savedIds: string[] (useState, init [] then read from localStorage in useEffect).
80. Renders full-height flex layout.
81. Left area (flex-1 flex flex-col overflow-hidden): (A) Results bar — px-4 py-2.5 border-b border-zinc-800 flex items-center gap-3 text-xs text-zinc-500.
82. Show '{total} listings' and if curatedOnly show a small 'curated' badge (text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded). (B) Scrollable job list — flex-1 overflow-y-auto.
83. Map jobs to <JobRow key={job.id} job={job} isSelected={selectedJob?.id === job.id} isSaved={savedIds.includes(job.id)} onSelect={setSelectedJob} />.
84. If jobs is empty: centered empty state with Briefcase icon (zinc-700) and 'No listings found' text. (C) If jobs.length < total: a 'Load more' row — clicking it pushes page param +1 to URL via useRouter.
85. Right area: always render <JobDetailPanel job={selectedJob} savedIds={savedIds} onClose={() => setSelectedJob(null)} onToggleSave={(id) => { toggleSave(id); setSavedIds(getSavedIds()); }} /> — the panel handles its own visibility based on whether job is null.
86. Job list rows (src/components/JobRow.tsx) — 'use client'.
87. Props: job: Job, isSelected: boolean, isSaved: boolean, onSelect: (job: Job) => void.
88. Height h-11 (44px). Full width flex items-center gap-3 px-4 cursor-pointer transition-colors select-none.
89. Background: isSelected ? 'bg-zinc-800 border-l-2 border-violet-400 pl-[14px]' : 'border-l-2 border-transparent'.
90. Hover: hover:bg-zinc-800/60.
91. Layout: (1) 6px dot — w-1.5 h-1.5 rounded-full flex-shrink-0.
92. Filled bg-amber-400 if date_scraped is within last 7 days (compare as ISO string), else bg-transparent. (2) Role title — text-sm font-medium text-zinc-100 truncate flex-1 min-w-0 max-w-[240px]. (3) Company — text-sm text-zinc-400 truncate max-w-[160px] hidden sm:block flex-shrink-0. (4) flex-1 spacer. (5) Source badge — text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px] flex-shrink-0. (6) Relative date — text-xs text-zinc-500 w-8 text-right flex-shrink-0.
93. Compute from date_scraped: <1d='Today', <7d='{n}d', <14d='1w', <21d='2w', else '{n}w'. onClick: onSelect(job).
94. Job detail panel (src/components/JobDetailPanel.tsx) — 'use client'.
95. Props: job: Job|null, savedIds: string[], onClose: () => void, onToggleSave: (id: string) => void.
96. When job is null: return null.
97. When job is set: fixed panel on desktop (className='fixed right-0 top-0 bottom-0 w-[420px] bg-zinc-900 border-l border-zinc-800 z-40 overflow-y-auto flex flex-col').
98. On mobile (w < 768) it's a bottom sheet ('fixed bottom-0 left-0 right-0 h-[85vh] bg-zinc-900 border-t border-zinc-800 z-40 rounded-t-xl overflow-y-auto flex flex-col').
99. Use a media query hook (useState + useEffect + window.matchMedia('(min-width: 768px)')) to switch.
100. Add a backdrop div (fixed inset-0 bg-black/40 z-30 md:hidden) on mobile to close on click.
101. Panel structure: (1) Header — flex justify-between items-start p-5 border-b border-zinc-800 flex-shrink-0.
102. Left: role_title text-base font-semibold text-zinc-50 leading-tight; company text-sm text-zinc-400 mt-0.5.
103. Right: X button (lucide X, 16px, text-zinc-500 hover:text-zinc-100 p-1 rounded hover:bg-zinc-800). (2) Body — flex-1 overflow-y-auto p-5 space-y-5.
104. Source row: flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300; anchor href=source_url target=_blank; text=job.source_name; ExternalLink icon 12px.
105. Dates row: flex gap-4 text-xs text-zinc-500. 'Posted: {formatDate(job.date_posted)}' and 'Scraped: {formatDate(job.date_scraped)}' where formatDate returns 'Unknown' for null or formats as 'Mar 5, 2026'.
106. Tags: if job.tags?.length > 0, flex flex-wrap gap-1.5; each tag text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300.
107. Raw snippet: if job.raw_snippet, a div with border-l-2 border-zinc-700 pl-3 text-sm text-zinc-400 italic leading-relaxed (truncate to 300 chars with ellipsis). (3) Footer — flex-shrink-0 p-5 border-t border-zinc-800 flex gap-3.
108. Bookmark button: p-2.5 rounded-md border border-zinc-700 hover:border-zinc-600 transition-colors; Bookmark icon 16px — filled text-violet-400 if savedIds.includes(job.id), else text-zinc-500; onClick onToggleSave(job.id).
109. Open Listing button: flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-md py-2.5 transition-colors; onClick window.open(job.listing_url, '_blank').
110. Saved jobs page (src/app/saved/page.tsx) — 'use client'.
111. On mount: read savedIds from localStorage ('sja_saved').
112. If empty: show centered empty state — flex flex-col items-center justify-center h-full gap-3; Bookmark icon 32px text-zinc-700; 'No saved jobs' text-zinc-400; 'Bookmark a listing to save it here' text-sm text-zinc-500.
113. If non-empty: fetch jobs with async/await try/catch — const supabase = createBrowserClient(); const { data } = await supabase.from('jobs').select('*').in('id', savedIds); setJobs(data ?? []); setLoading(false).
114. State: jobs: Job[], loading: boolean, selectedJob: Job|null, savedIds: string[].
115. Render same JobRow list + JobDetailPanel. onToggleSave removes the job from the list immediately (setJobs(prev => prev.filter(j => j.id !== id))).
116. Page title 'Saved Jobs' text-lg font-semibold text-zinc-50 px-4 py-4 border-b border-zinc-800.
117. Save/bookmark logic (src/lib/savedJobs.ts) — exports: getSavedIds(): string[] — reads localStorage 'sja_saved', returns parsed array or []. toggleSave(id: string): void — if id in list remove it, else add it (cap at 200).
118. After mutation: localStorage.setItem and window.dispatchEvent(new Event('storage')).
119. Call getSavedIds() only inside useEffect/event handlers, never during SSR render.
120. Admin page (src/app/admin/page.tsx) — async Server Component.
121. Uses createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) from '@supabase/supabase-js' directly (NOT the SSR wrapper — service role key does not use cookies).
122. Fetches: (1) const { data: runs } = await supabase.from('pipeline_runs').select('*').order('run_date', {ascending: false}).limit(20); (2) const { data: sourcesRow } = await supabase.from('app_config').select('value').eq('key', 'sources').single(); const sources: AppSource[] = sourcesRow?.value ?? []; (3) const { data: filterRow } = await supabase.from('app_config').select('value').eq('key', 'filter_config').single(); const filterConfig = filterRow?.value ?? {}.
123. Passes all to <AdminView runs={runs ?? []} sources={sources} filterConfig={filterConfig} />.
124. Admin view (src/components/AdminView.tsx) — 'use client'.
125. Props: runs: PipelineRun[], sources: AppSource[], filterConfig: Record<string, string[]>.
126. State: localSources (clone of sources), localFilterConfig (clone of filterConfig), saving: boolean.
127. Layout: px-6 py-6 max-w-5xl.
128. Two sections side by side on desktop (flex gap-8), stacked on mobile (flex-col).
129. Left section 'Pipeline History' (flex-1): heading text-sm font-semibold text-zinc-200 mb-3.
130. If runs empty: text-sm text-zinc-500 'No pipeline runs yet.'.
131. Else a table w-full text-sm. thead: Date, Scraped, New, Dupes, Filtered, Errors — all text-xs text-zinc-500 uppercase text-left pb-2 border-b border-zinc-800. tbody: each run as a tr border-b border-zinc-800/50.
132. Cells: run_date formatted as 'Mar 9, 2026', total_scraped, new_listings, duplicate_count, filtered_count, error_count (if > 0 show red dot before number).
133. Below table: bg-zinc-800/50 border border-zinc-700 rounded-md p-4 mt-4 text-xs text-zinc-400 font-mono.
134. Text: 'cd scraper && python scrape.py'.
135. Right section 'Config' (w-72 flex-shrink-0): two sub-sections. (1) 'Sources' heading text-sm font-semibold text-zinc-200 mb-2.
136. List each source as flex items-center justify-between py-1.5.
137. Left: source name text-sm text-zinc-300 + type badge text-xs bg-zinc-700 text-zinc-400 px-1.5 rounded ml-2.
138. Right: × button text-zinc-600 hover:text-red-400 — onClick removes from localSources.
139. Below list: add source form — three inputs (name, url, type select: vc_board|newsletter) + 'Add' button; on submit push to localSources.
140. Save button for sources: bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded mt-2 — onClick POST to /api/admin {action:'save_sources', payload: localSources}. (2) 'Filter Config' heading text-sm font-semibold text-zinc-200 mb-2 mt-5.
141. Four labeled textareas: 'Include keywords', 'Include role levels', 'Exclude keywords', 'Include industries'.
142. Each textarea: bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 p-2 w-full h-20 resize-none.
143. Values are arrays joined with newline for display, split on newline on save.
144. Save button: bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded mt-2 — onClick POST to /api/admin {action:'save_filter_config', payload: localFilterConfig}.
145. API route (src/app/api/admin/route.ts) — export async function POST(req: Request).
146. Parse body JSON. Switch on action. 'save_sources': upsert {key:'sources', value: payload} into app_config on conflict key. 'save_filter_config': upsert {key:'filter_config', value: payload}.
147. Uses createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) from '@supabase/supabase-js' directly.
148. Returns NextResponse.json({ok:true}) on success, {error: string} with status 500 on failure.
149. Supabase clients — src/lib/supabase-server.ts: import { createServerClient as createSSRClient } from '@supabase/ssr'; import { cookies } from 'next/headers'; export function createServerClient() { const cookieStore = cookies(); return createSSRClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }); } — src/lib/supabase-browser.ts: import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'; export function createBrowserClient() { return createSSRBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); }
150. TypeScript types (src/types/index.ts): export type Job = { id: string; source_name: string; source_url: string; company: string; role_title: string; listing_url: string; url_hash: string; date_posted: string | null; date_scraped: string; week_key: string; tags: string[]; is_filtered_in: boolean; raw_snippet: string | null; }; export type FilterState = { keyword: string; weekKey: string; curatedOnly: boolean; }; export type PipelineRun = { id: string; run_date: string; total_scraped: number; new_listings: number; duplicate_count: number; filtered_count: number; error_count: number; errors_json: string[] | null; }; export type AppSource = { name: string; url: string; type: 'vc_board' | 'newsletter'; };
151. src/lib/weekKey.ts — export function weekKeyToLabel(weekKey: string): string — parses '2026-W11' into year+week, computes Monday of that ISO week (Jan 4 of year is always in week 1; Monday = new Date(year, 0, 4) adjusted back to Monday + (week-1)*7 days), returns e.g. 'Week of Mar 9, 2026'. export function currentWeekKey(): string — returns current ISO week as 'YYYY-WNN' with zero-padded week number.
152. File structure — create exactly these files: src/app/page.tsx, src/app/layout.tsx, src/app/globals.css, src/app/saved/page.tsx, src/app/admin/page.tsx, src/app/api/admin/route.ts, src/components/Sidebar.tsx, src/components/FilterPanel.tsx, src/components/JobListView.tsx, src/components/JobRow.tsx, src/components/JobDetailPanel.tsx, src/components/AdminView.tsx, src/lib/supabase-server.ts, src/lib/supabase-browser.ts, src/lib/savedJobs.ts, src/lib/weekKey.ts, src/types/index.ts, tailwind.config.ts, next.config.mjs, .env.example. globals.css: @tailwind base; @tailwind components; @tailwind utilities; — nothing else. next.config.mjs: export default { reactStrictMode: true }.
153. .env.example — contents: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
154. Environment — create a .env.local file at the project root with these exact values (one per line): NEXT_PUBLIC_SUPABASE_URL=https://gdqfekecdtkiwwmyjwfz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkcWZla2VjZHRraXd3bXlqd2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzQxODYsImV4cCI6MjA4ODgxMDE4Nn0.EoEUNVEDTNCOT-AOp6lIhuhCitjvYB9SgB-dMCRU-vw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkcWZla2VjZHRraXd3bXlqd2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIzNDE4NiwiZXhwIjoyMDg4ODEwMTg2fQ.dpbMjCvbWqIa81P7EB17L_6v9crP_MYPY1hkU7q5MME.
155. Also create scraper/.env with: SUPABASE_URL=https://gdqfekecdtkiwwmyjwfz.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkcWZla2VjZHRraXd3bXlqd2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIzNDE4NiwiZXhwIjoyMDg4ODEwMTg2fQ.dpbMjCvbWqIa81P7EB17L_6v9crP_MYPY1hkU7q5MME.
156. Scraper — create a scraper/ directory at the project root (NOT part of the Next.js build, not imported by Next.js).
157. File list: scraper/scrape.py, scraper/scrapers/__init__.py (empty file), scraper/scrapers/vc_boards.py, scraper/scrapers/newsletters.py, scraper/deduper.py, scraper/filter.py, scraper/config.py, scraper/requirements.txt, scraper/.env.example. scrape.py is the entry point — uses python-dotenv to load .env, creates Supabase client with SUPABASE_URL + SUPABASE_KEY env vars, imports and runs all scraper functions from scrapers/vc_boards.py and scrapers/newsletters.py, deduplicates via deduper.py, applies filters via filter.py, upserts to jobs table, inserts a row into pipeline_runs, prints a summary.
158. To run: cd scraper && pip install -r requirements.txt && python -m playwright install chromium && python scrape.py.
159. scraper/requirements.txt contents: supabase==2.10.0
beautifulsoup4==4.12.3
playwright==1.44.0
requests==2.32.3
python-dotenv==1.0.1
lxml==5.2.2
160. Scraper vc_boards.py — module-level: from playwright.sync_api import sync_playwright.
161. Each public function: scrape_<slug>(session: requests.Session) -> list[dict] returning dicts with keys {company, role_title, listing_url, date_posted, source_name, source_url} where date_posted is None.
162. Shared helper _scrape_playwright(url: str, source_name: str, source_url: str) -> list[dict]: launch chromium headless (sync_playwright()), page.goto(url, timeout=60000, wait_until='domcontentloaded'), page.wait_for_load_state('networkidle', timeout=25000), then page.evaluate() with a JS arrow function (baseUrl) => { const seen = new Set(); const results = []; const candidates = document.querySelectorAll('li, tr, article, section, [class*="job"], [class*="posting"], [class*="role"], [class*="opening"]'); for (const el of candidates) { const link = el.querySelector('a[href]'); if (!link) continue; const href = link.href || ''; if (!href || seen.has(href)) continue; if (href.length < 10) continue; seen.add(href); let company = ''; const cEl = el.querySelector('[class*="company"], [class*="org"], [class*="startup"], [class*="employer"]'); if (cEl) company = cEl.innerText.trim(); let title = ''; const tEl = el.querySelector('[class*="title"], [class*="role"], [class*="name"], [class*="position"], h1, h2, h3, h4, strong'); if (tEl) title = tEl.innerText.trim(); if (!title) title = link.innerText.trim(); if (!title || title.length > 200) continue; if (title === company) continue; results.push({company: company || baseUrl, role_title: title, listing_url: href}); } return results; } passing url as baseUrl.
163. Convert JS objects to Python dicts, add source_name/source_url/date_posted=None.
164. Catch all exceptions (log warning, return []).
165. Close browser in finally.
166. Boards using Playwright only: scrape_index_ventures, scrape_general_catalyst, scrape_khosla, scrape_greylock, scrape_kleiner_perkins, scrape_accel, scrape_battery, scrape_lightspeed, scrape_bessemer, scrape_ycombinator (for YC filter listing_url to only include hrefs containing '/jobs/' or '/role/').
167. Boards using BeautifulSoup first then Playwright fallback if result is empty: scrape_a16z (BS selectors: 'tr.job-listing, tr[data-job-id], table tbody tr'; deduplicate results on (company.lower(), role_title.lower())), scrape_sequoia, scrape_bitkraft, scrape_contrary, scrape_pear_vc, scrape_nea.
168. Scraper newsletters.py — import requests, xml.etree.ElementTree as ET, re, html, datetime.
169. Shared helper _is_recent(pub_date_str: str, days: int = 14) -> bool: parse RFC 2822 date, return True if within `days` days.
170. Shared helper _extract_listings(feed_url: str, source_name: str, source_url: str) -> list[dict]: fetch URL with requests, parse XML, iterate <item> or <entry> elements, check pubDate/published with _is_recent, combine title + description text, strip HTML tags (re.sub r'<[^>]+>', ''), split on newlines, for each non-empty line: check if any role keyword present (case-insensitive: 'VP', 'Director', 'Head of', 'COO', 'CEO', 'CTO', 'CFO', 'CMO', 'GM', 'Chief of Staff', 'Manager', 'Lead', 'Engineer', 'Analyst', 'Coordinator', 'Operations', 'Strategy'); if yes, try regex match r'^(.+?)\s*[-–—:|]\s*(.+)$' — if matched use group(1) as company, group(2) as role_title; if no match use full line as role_title with source_name as company.
171. Deduplicate on role_title.lower().
172. Return []. Catch all exceptions, log warning, return [].
173. Public functions: scrape_job_hunting_sux, scrape_ali_rohde_jobs, scrape_next_play, scrape_nonlinear_techies, scrape_beyond_bay_st, scrape_why_you_should_join, scrape_web_of_jobs — each calls _extract_listings with its feed URL and returns the result.
174. Scraper deduper.py — normalize_url(url: str) -> str: lowercase, strip query and fragment using urllib.parse. compute_hash(url: str) -> str: sha256 hex of normalized url. is_duplicate(client, url_hash: str) -> bool: query jobs WHERE url_hash=hash AND date_scraped >= (now - 28 days) LIMIT 1, return True if any row. insert_listings(client, listings: list[dict]) -> tuple[int,int]: for each listing compute hash, skip if is_duplicate (count dupe), else upsert on conflict (url_hash, week_key) do nothing, count new.
175. Return (new_count, dupe_count).
176. Scraper filter.py — apply_filter(listing: dict, filter_config: dict) -> dict: get role_title.lower() and company.lower(). (1) exclude check: for kw in filter_config.get('exclude_keywords',[]): if kw.lower() in role_lower or kw.lower() in company_lower → set is_filtered_in=False, tags=[], return. (2) include check: matched_tags=[]; for kw in filter_config.get('include_keywords',[])+filter_config.get('include_role_levels',[]): if kw.lower() in role_lower or kw.lower() in company_lower → matched_tags.append(kw); if matched_tags → is_filtered_in=True, tags=matched_tags, return. (3) else: is_filtered_in=False, tags=[].
177. Return listing dict with is_filtered_in and tags added.
178. Scraper config.py — load_config(client, key: str, default): fetch from app_config WHERE key=key LIMIT 1.
179. If no row: insert {key: key, value: default} and return default.
180. Else return row['value']. save_config(client, key: str, value): upsert {key: key, value: value} on conflict key.
181. DEFAULT_SOURCES: list of 23 dicts {name, url, type} covering all VC boards and newsletters listed in vc_boards.py and newsletters.py.
182. DEFAULT_FILTER_CONFIG: {include_keywords: ['healthcare','health tech','operations','chief of staff','strategy'], include_role_levels: ['COO','GM','Chief of Staff','VP Operations','VP Strategy','Director of Operations'], exclude_keywords: ['intern','entry level','junior'], include_industries: ['healthcare','health tech','operations']}.
183. Quality requirements: (1) npm run build must complete with zero TypeScript errors and zero Next.js build errors. (2) No use of 'any' type anywhere. (3) No horizontal scroll at 390px viewport. (4) All localStorage access must be inside useEffect or event handlers — never during SSR. (5) Smoke test after build: npx next start -p 3099, curl http://localhost:3099 returns HTML containing '__next'. (6) The .env.local file must exist before running the smoke test so Next.js can connect to Supabase.

## Full Description

Dark-mode job browsing dashboard for VC-sourced startup listings stored in Supabase. Dense list view optimized for fast scanning. Includes an /admin section for pipeline history and source/filter config. A standalone Python scraper in scraper/ writes data to the same Supabase instance.
