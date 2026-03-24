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
  if (sortCol !== col) return <ChevronsUpDown size={12} className="opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-primary" />
    : <ChevronDown size={12} className="text-primary" />;
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
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors select-none ${extraClass}`}
    >
      {label}
      <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </button>
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-outline-variant flex-shrink-0">
          <div className="w-5 h-5 rounded bg-surface-container-highest animate-pulse flex-shrink-0" />
          <div className="h-5 w-24 bg-surface-container-highest rounded animate-pulse" />
        </div>
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex-shrink-0">
          <div className="h-9 bg-surface-container-highest rounded-shape-full animate-pulse" />
        </div>
        <div className="flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 h-10 border-b border-outline-variant" style={{ opacity: 1 - i * 0.07 }}>
              <div className="w-2 h-2 rounded-full bg-surface-container-highest animate-pulse flex-shrink-0" />
              <div className="h-4 rounded bg-surface-container-highest animate-pulse" style={{ width: 160 + (i % 4) * 28 }} />
              <div className="h-4 rounded bg-surface-container-highest animate-pulse hidden md:block" style={{ width: 90 + (i % 3) * 20 }} />
              <div className="flex-1" />
              <div className="h-6 w-16 bg-surface-container-highest rounded-shape-sm animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page title */}
      <div className="flex items-center gap-2.5 text-lg font-semibold text-on-surface px-5 py-4 border-b border-outline-variant flex-shrink-0">
        <Bookmark size={20} className="text-primary flex-shrink-0" />
        Saved Jobs
      </div>

      {savedIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Bookmark size={40} className="text-outline-variant" />
          <span className="text-on-surface-variant">No saved jobs yet</span>
          <span className="text-sm text-on-surface-variant/70">Bookmark a listing to save it here</span>
          <Link
            href="/"
            className="mt-2 text-sm text-primary hover:opacity-80 transition-opacity"
          >
            Browse jobs →
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search bar */}
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex-shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search saved roles or companies…"
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
            <div className="px-5 py-2 border-b border-outline-variant bg-surface-container-low flex items-center gap-2 text-xs text-on-surface-variant flex-shrink-0">
              <span>
                {searchValue
                  ? `${processedJobs.length} of ${jobs.length} saved`
                  : `${jobs.length} saved role${jobs.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Column headers — desktop only */}
            {processedJobs.length > 0 && (
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

            {/* Job list */}
            <div className="flex-1 overflow-y-auto">
              {processedJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Bookmark size={40} className="text-outline-variant" />
                  <span className="text-on-surface-variant">No matches</span>
                  {searchValue && (
                    <button
                      onClick={() => setSearchValue('')}
                      className="text-sm text-primary hover:opacity-80 transition-opacity"
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
