'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, ChevronUp, ChevronDown, ChevronsUpDown, X } from 'lucide-react';
import type { Job, FilterState } from '@/types';
import JobRow from '@/components/JobRow';
import JobDetailPanel from '@/components/JobDetailPanel';
import { getSavedIds, toggleSave } from '@/lib/savedJobs';

type SortCol = 'role' | 'company' | 'source' | 'date';
type SortDir = 'asc' | 'desc';

interface ColFilters {
  role: string;
  company: string;
  source: string;
}

interface JobListViewProps {
  jobs: Job[];
  total: number;
  availableWeeks: string[];
  currentFilters: FilterState;
}

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol | null; sortDir: SortDir }) {
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
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [colFilters, setColFilters] = useState<ColFilters>({ role: '', company: '', source: '' });
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams.toString());
    const currentPage = parseInt(params.get('page') ?? '1', 10);
    params.set('page', String(currentPage + 1));
    router.push(`/?${params.toString()}`);
  };

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const hasColFilter = colFilters.role || colFilters.company || colFilters.source;

  const clearColFilters = () => setColFilters({ role: '', company: '', source: '' });

  const processedJobs = useMemo(() => {
    let result = [...jobs];

    // Apply column filters
    if (colFilters.role) {
      const q = colFilters.role.toLowerCase();
      result = result.filter((j) => j.role_title.toLowerCase().includes(q));
    }
    if (colFilters.company) {
      const q = colFilters.company.toLowerCase();
      result = result.filter((j) => j.company.toLowerCase().includes(q));
    }
    if (colFilters.source) {
      const q = colFilters.source.toLowerCase();
      result = result.filter((j) => j.source_name.toLowerCase().includes(q));
    }

    // Apply sort
    if (sortCol) {
      result.sort((a, b) => {
        let av = '';
        let bv = '';
        if (sortCol === 'role') { av = a.role_title; bv = b.role_title; }
        else if (sortCol === 'company') { av = a.company; bv = b.company; }
        else if (sortCol === 'source') { av = a.source_name; bv = b.source_name; }
        else if (sortCol === 'date') { av = a.date_scraped; bv = b.date_scraped; }
        const cmp = av.localeCompare(bv);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [jobs, colFilters, sortCol, sortDir]);

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
        {/* Results bar */}
        <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-3 text-xs text-zinc-500">
          <span>
            {hasColFilter ? `${processedJobs.length} of ${total}` : total} listings
          </span>
          {currentFilters.curatedOnly && (
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded">
              curated
            </span>
          )}
          <div className="flex-1" />
          {/* Toggle column filter row */}
          <button
            onClick={() => { setShowFilters((v) => !v); if (showFilters) clearColFilters(); }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${showFilters ? 'bg-violet-500/20 text-violet-300' : 'hover:text-zinc-300'}`}
          >
            Filter columns
          </button>
          {hasColFilter && (
            <button onClick={clearColFilters} className="flex items-center gap-0.5 hover:text-zinc-300 transition-colors">
              <X size={11} /> Clear
            </button>
          )}
        </div>

        {/* Column headers */}
        {jobs.length > 0 && (
          <div className="border-b border-zinc-800 bg-zinc-900/80">
            {/* Sort header row */}
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-2 flex-shrink-0" />
              <div className="flex-1 min-w-0" style={{ maxWidth: 260 }}>
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

            {/* Filter input row */}
            {showFilters && (
              <div className="flex items-center gap-3 px-4 pb-2">
                <div className="w-2 flex-shrink-0" />
                <div className="flex-1 min-w-0" style={{ maxWidth: 260 }}>
                  <input
                    type="text"
                    placeholder="Filter role…"
                    value={colFilters.role}
                    onChange={(e) => setColFilters((f) => ({ ...f, role: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </div>
                <div className="hidden sm:block flex-shrink-0" style={{ width: 180 }}>
                  <input
                    type="text"
                    placeholder="Filter company…"
                    value={colFilters.company}
                    onChange={(e) => setColFilters((f) => ({ ...f, company: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </div>
                <div className="flex-1" />
                <div className="flex-shrink-0" style={{ width: 120 }}>
                  <input
                    type="text"
                    placeholder="Filter source…"
                    value={colFilters.source}
                    onChange={(e) => setColFilters((f) => ({ ...f, source: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </div>
                <div className="flex-shrink-0" style={{ width: 36 }} />
              </div>
            )}
          </div>
        )}

        {/* Scrollable job list */}
        <div className="flex-1 overflow-y-auto">
          {processedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Briefcase size={32} className="text-zinc-700" />
              <span className="text-zinc-400">No listings found</span>
            </div>
          ) : (
            <>
              {processedJobs.map((job) => (
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
                  className="w-full py-3 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
                >
                  Load more
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
