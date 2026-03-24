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
  if (sortCol !== col) return <ChevronsUpDown size={12} className="opacity-30" />;
  return sortDir === 'asc' ? <ChevronUp size={12} className="text-violet-400" /> : <ChevronDown size={12} className="text-violet-400" />;
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

  // Sort state is owned by URL so the server can apply ORDER BY on the full dataset
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
    // Toggle direction if same col; default new col to asc (except date → desc)
    const newDir =
      sortCol === col
        ? sortDir === 'asc' ? 'desc' : 'asc'
        : col === 'date' ? 'desc' : 'asc';
    // Changing sort resets to page 1
    pushParams({ sort: col, dir: newDir, page: null });
  };

  const headerCell = (label: string, col: SortCol, extraClass = '') => (
    <button
      onClick={() => handleSort(col)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors select-none ${extraClass}`}
    >
      {label}
      <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </button>
  );

  return (
    <div className="flex h-full">
      {/* Left area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Search bar — always visible at the top */}
        <div className="px-4 py-3 border-b border-zinc-700/60 bg-zinc-900/80 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search roles or companies…"
              className="w-full bg-zinc-800 border border-zinc-700/80 rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Results bar */}
        <div className="px-4 py-2 border-b border-zinc-700/60 bg-zinc-900/40 flex items-center gap-2 text-xs text-zinc-500 flex-shrink-0">
          <span>
            {searchValue
              ? `${total} result${total !== 1 ? 's' : ''} for "${searchValue}"`
              : `${total} role${total !== 1 ? 's' : ''}`}
          </span>
          {currentFilters.curatedOnly && (
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded">
              curated
            </span>
          )}
        </div>

        {/* Column headers — sticky */}
        {jobs.length > 0 && (
          <div className="sticky top-0 z-10 border-b border-zinc-700/60 bg-zinc-900 shadow-sm shadow-zinc-950/50 hidden md:block">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-2 flex-shrink-0" />
              <div className="flex-1 min-w-0" style={{ maxWidth: 280 }}>
                {headerCell('Role', 'role')}
              </div>
              <div className="hidden sm:block flex-shrink-0" style={{ width: 180 }}>
                {headerCell('Company', 'company')}
              </div>
              <div className="flex-1" />
              <div className="flex-shrink-0" style={{ width: 120 }}>
                {headerCell('Source', 'source')}
              </div>
              <div className="flex-shrink-0 text-right" style={{ width: 36 }}>
                {headerCell('When', 'date', 'justify-end')}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable job list */}
        <div className="flex-1 overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Briefcase size={32} className="text-zinc-700" />
              <span className="text-zinc-400">No listings found</span>
              {searchValue && (
                <button
                  onClick={() => setSearchValue('')}
                  className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {jobs.map((job, idx) => (
                <JobRow
                  key={job.id}
                  job={job}
                  index={idx}
                  isSelected={selectedJob?.id === job.id}
                  isSaved={savedIds.includes(job.id)}
                  onSelect={setSelectedJob}
                />
              ))}
              {jobs.length < total && (
                <button
                  onClick={handleLoadMore}
                  className="w-full py-4 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors border-t border-zinc-800/60"
                >
                  Load more · Showing {jobs.length} of {total}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right area */}
      <JobDetailPanel
        job={selectedJob}
        savedIds={savedIds}
        onClose={() => setSelectedJob(null)}
        onToggleSave={handleToggleSave}
      />
    </div>
  );
}
