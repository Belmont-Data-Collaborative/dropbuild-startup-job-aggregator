import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase-server';
import { currentWeekKey } from '@/lib/weekKey';
import JobListView from '@/components/JobListView';
import type { Job } from '@/types';

export const dynamic = 'force-dynamic';

const SORT_COL_MAP: Record<string, string> = {
  role: 'role_title',
  company: 'company',
  source: 'source_name',
  date: 'date_scraped',
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: {
    week?: string;
    curated?: string;
    keyword?: string;
    page?: string;
    sort?: string;
    dir?: string;
  };
}) {
  const supabase = createServerClient();

  // Step 1: fetch distinct week_keys
  const { data: weekRows } = await supabase
    .from('jobs')
    .select('week_key')
    .order('week_key', { ascending: false });

  const weekKeys = Array.from(
    new Set((weekRows ?? []).map((r: { week_key: string }) => r.week_key))
  ).sort((a, b) => b.localeCompare(a));

  // Step 2: resolve week
  const resolvedWeek =
    searchParams.week ?? weekKeys[0] ?? currentWeekKey();

  // Step 3: resolve other params
  const curated = searchParams.curated ?? '1';
  const keyword = searchParams.keyword ?? '';
  const page = parseInt(searchParams.page ?? '1', 10);
  const pageSize = 50;

  // Step 4: resolve sort — default to date desc
  const sortKey = searchParams.sort ?? 'date';
  const sortDir = searchParams.dir === 'asc' ? true : false; // ascending flag
  const dbSortCol = SORT_COL_MAP[sortKey] ?? 'date_scraped';

  // Step 5: build query
  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('week_key', resolvedWeek);

  if (curated === '1') {
    query = query.eq('is_filtered_in', true);
  }

  if (keyword) {
    query = query.or(
      `role_title.ilike.%${keyword}%,company.ilike.%${keyword}%`
    );
  }

  // Accumulate rows from page 1 up to current page so "load more" works
  const { data: jobs, count } = await query
    .order(dbSortCol, { ascending: sortDir })
    .range(0, page * pageSize - 1);

  return (
    <Suspense fallback={null}>
      <JobListView
        jobs={(jobs as Job[]) ?? []}
        total={count ?? 0}
        availableWeeks={weekKeys}
        currentFilters={{
          keyword,
          weekKey: resolvedWeek,
          curatedOnly: curated === '1',
        }}
      />
    </Suspense>
  );
}
