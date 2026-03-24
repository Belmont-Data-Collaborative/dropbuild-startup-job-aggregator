'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import type { Job, FilterState } from '@/types';
import JobRow from '@/components/JobRow';
import JobDetailPanel from '@/components/JobDetailPanel';
import { getSavedIds, toggleSave } from '@/lib/savedJobs';

type SortCol = 'role' | 'company' | 'source' | 'date';
type SortDir = 'asc' | 'desc';

interface JobListViewProps {
  jobs: Job[];
  total: number;
  availableWeeks: string[];
  currentFilters: FilterState;
}

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  if (sortCol !== col) return <ChevronsUpDown size={12} className="opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-primary" />
    : <ChevronDown size={12} className="text-primary" />;
}

export default function JobListView({
  jobs,
  total,
  availableWeeks: _availableWeeks,
  currentFilters,
}: JobListViewProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState(() => currentFilters.keyword ?? '');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sort state is owned by URL so the server applies ORDER BY on the full dataset
  const sortCol = (searchParams.get('sort') ?? 'date') as SortCol;
  const sortDir = (searchParams.get('dir') ?? 'desc') as SortDir;

  useEffect(() => {
    setSavedIds(getSavedIds());
    const handleStorage = () => setSavedIds(getSavedIds());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleToggleSave = (id: string) => {
    toggleSave(id);
    setSavedIds(getSavedIds());
  };

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === '') {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      router.push(`/?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Debounced search → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get('keyword') ?? '';
      if (searchValue !== current) {
        pushParams({ keyword: searchValue || null, page: null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, searchParams, pushParams]);

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams.toString());
    const currentPage = parseInt(params.get('page') ?? '1', 10);
    params.set('page', String(currentPage + 1));
    router.push(`/?${params.toString()}`);
  };

  const handleSort = (col: SortCol) => {
    const newDir =
      sortCol === col
        ? sortDir === 'asc' ? 'desc' : 'asc'
        : col === 'date' ? 'desc' : 'asc';
    pushParams({ sort: col, dir: newDir, page: null });
  };

  const headerCell = (label: string, col: SortCol, extraClass = '') => (
    <button
      onClick={() => handleSort(col)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors select-none ${extraClass}`}
    >
      {label}
      <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </button>
  );

  return (
    <div className="flex h-full">
      {/* ── Left area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Search bar */}
        <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-low flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search roles or companies…"
              className="w-full bg-surface-container-highest rounded-shape-full pl-8 pr-8 py-1.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded-shape-full transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Results bar */}
        <div className="px-4 py-1.5 border-b border-outline-variant bg-surface-container-low flex items-center gap-2 text-xs text-on-surface-variant flex-shrink-0">
          <span>
            {searchValue
              ? `${total} result${total !== 1 ? 's' : ''} for "${searchValue}"`
              : `${total} role${total !== 1 ? 's' : ''}`}
          </span>
          {currentFilters.curatedOnly && (
            <span className="text-xs bg-primary-container text-on-primary-container px-2 py-0.5 rounded-shape-full font-medium">
              curated
            </span>
          )}
        </div>

        {/* Column headers — sticky */}
        {jobs.length > 0 && (
          <div className="sticky top-0 z-10 border-b border-outline-variant bg-surface-container-low shadow-sm hidden md:block">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-2 flex-shrink-0" />
              <div className="flex-1 min-w-0" style={{ maxWidth: 260 }}>
                {headerCell('Role', 'role')}
              </div>
              <div className="hidden sm:block flex-shrink-0" style={{ width: 200 }}>
                {headerCell('Company', 'company')}
              </div>
              <div className="flex-shrink-0" style={{ width: 140 }} />
              <div className="flex-1" />
              <div className="flex-shrink-0" style={{ width: 120 }}>
                {headerCell('Source', 'source')}
              </div>
              <div className="flex-shrink-0 text-right" style={{ width: 48 }}>
                {headerCell('When', 'date', 'justify-end')}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable job list */}
        <div className="flex-1 overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
              <Briefcase size={40} className="text-outline-variant" />
              <span className="text-on-surface-variant">No listings found</span>
              {searchValue ? (
                <button
                  onClick={() => setSearchValue('')}
                  className="text-sm text-primary hover:opacity-80 transition-opacity"
                >
                  Clear search
                </button>
              ) : currentFilters.curatedOnly ? (
                <span className="text-sm text-on-surface-variant/70 max-w-[240px] leading-snug">
                  Try turning off <strong className="font-medium text-on-surface-variant">Startup roles only</strong> in the sidebar to see all listings
                </span>
              ) : null}
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  isSelected={selectedJob?.id === job.id}
                  isSaved={savedIds.includes(job.id)}
                  onSelect={setSelectedJob}
                />
              ))}
              {jobs.length < total && (
                <button
                  onClick={handleLoadMore}
                  className="w-full py-3 text-sm text-primary hover:bg-black/[0.08] transition-colors border-t border-outline-variant font-medium flex items-center justify-center gap-1.5"
                >
                  <ChevronDown size={14} />
                  Load more · {jobs.length} of {total}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Right area — detail panel ── */}
      <JobDetailPanel
        job={selectedJob}
        savedIds={savedIds}
        onClose={() => setSelectedJob(null)}
        onToggleSave={handleToggleSave}
      />
    </div>
  );
}
