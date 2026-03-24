'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bookmark, ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import Link from 'next/link';
import type { Job } from '@/types';
import { createBrowserClient } from '@/lib/supabase-browser';
import { getSavedIds, toggleSave } from '@/lib/savedJobs';
import JobRow from '@/components/JobRow';
import JobDetailPanel from '@/components/JobDetailPanel';

type SortCol = 'role' | 'company' | 'source' | 'date';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol | null; sortDir: SortDir }) {
  if (sortCol !== col) return <ChevronsUpDown size={12} className="opacity-30" />;
  return sortDir === 'asc' ? <ChevronUp size={12} className="text-violet-400" /> : <ChevronDown size={12} className="text-violet-400" />;
}

export default function SavedPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const ids = getSavedIds();
    setSavedIds(ids);

    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchSavedJobs(ids: string[]) {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.from('jobs').select('*').in('id', ids);
        setJobs((data as Job[]) ?? []);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSavedJobs(ids);
  }, []);

  const handleToggleSave = (id: string) => {
    toggleSave(id);
    const newIds = getSavedIds();
    setSavedIds(newIds);
    setJobs((prev) => prev.filter((j) => newIds.includes(j.id)));
    if (selectedJob?.id === id) setSelectedJob(null);
  };

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const processedJobs = useMemo(() => {
    let result = [...jobs];

    if (searchValue) {
      const q = searchValue.toLowerCase();
      result = result.filter(
        (j) =>
          j.role_title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q)
      );
    }

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
  }, [jobs, searchValue, sortCol, sortDir]);

  const headerCell = (label: string, col: SortCol, extraClass = '') => (
    <button
      onClick={() => handleSort(col)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors select-none ${extraClass}`}
    >
      {label}
      <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-zinc-500 text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page title */}
      <div className="text-lg font-semibold text-zinc-50 px-4 py-4 border-b border-zinc-800 flex-shrink-0">
        Saved Jobs
      </div>

      {savedIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Bookmark size={32} className="text-zinc-700" />
          <span className="text-zinc-400">No saved jobs yet</span>
          <span className="text-sm text-zinc-500">Bookmark a listing to save it here</span>
          <Link
            href="/"
            className="mt-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Browse jobs →
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search bar */}
            <div className="px-4 py-3 border-b border-zinc-700/60 bg-zinc-900/80 flex-shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search saved roles or companies…"
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
                  ? `${processedJobs.length} of ${jobs.length} saved`
                  : `${jobs.length} saved role${jobs.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Column headers — desktop only */}
            <div className="border-b border-zinc-800 bg-zinc-900/80 flex-shrink-0 hidden md:block">
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
                <div className="flex-shrink-0 text-right" style={{ width: 44 }}>
                  {headerCell('When', 'date', 'justify-end')}
                </div>
              </div>
            </div>

            {/* Job list */}
            <div className="flex-1 overflow-y-auto">
              {processedJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Bookmark size={32} className="text-zinc-700" />
                  <span className="text-zinc-400">No matches</span>
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
                processedJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    isSelected={selectedJob?.id === job.id}
                    isSaved={savedIds.includes(job.id)}
                    onSelect={setSelectedJob}
                  />
                ))
              )}
            </div>
          </div>

          <JobDetailPanel
            job={selectedJob}
            savedIds={savedIds}
            onClose={() => setSelectedJob(null)}
            onToggleSave={handleToggleSave}
          />
        </div>
      )}
    </div>
  );
}
