'use client';

import type { Job } from '@/types';

function relativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return `${diffDays}d ago`;
  const weeks = Math.floor(diffDays / 7);
  return `${weeks}w ago`;
}

function isRecent(dateStr: string): boolean {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  return diffMs / (1000 * 60 * 60 * 24) < 7;
}

interface JobRowProps {
  job: Job;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (job: Job) => void;
}

export default function JobRow({ job, isSelected, isSaved: _isSaved, onSelect }: JobRowProps) {
  const recent = isRecent(job.date_scraped);

  return (
    <>
      {/* ── Mobile card ─────────────────────────────────────────── */}
      <div
        onClick={() => onSelect(job)}
        className={[
          'md:hidden w-full px-4 py-3 cursor-pointer transition-colors border-b border-zinc-800/70',
          isSelected
            ? 'bg-zinc-800 border-l-2 border-violet-400 pl-[14px]'
            : 'border-l-2 border-transparent',
          'hover:bg-zinc-800/50',
        ].join(' ')}
      >
        {/* Top row: title + New badge */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-zinc-50 leading-snug flex-1 min-w-0">
            {job.role_title}
          </span>
          {recent && (
            <span className="flex-shrink-0 text-xs bg-amber-400/15 text-amber-400 px-1.5 py-0.5 rounded font-medium">
              New
            </span>
          )}
        </div>

        {/* Company */}
        <div className="text-sm text-zinc-400 mt-0.5">{job.company}</div>

        {/* Bottom row: source · date · Apply */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-zinc-800 border border-zinc-700/50 text-zinc-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[110px]">
            {job.source_name}
          </span>
          <span className="text-xs text-zinc-600">{relativeDate(job.date_scraped)}</span>
          <div className="flex-1" />
          <a
            href={job.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-2.5 py-1 rounded-md font-medium transition-colors flex-shrink-0"
          >
            Apply →
          </a>
        </div>

        {/* Matched tags (if any) */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <span className="text-xs text-zinc-600">Matched:</span>
            {job.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop row ──────────────────────────────────────────── */}
      <div
        onClick={() => onSelect(job)}
        className={[
          'hidden md:flex w-full items-center gap-3 px-4 cursor-pointer transition-colors select-none',
          'border-b border-zinc-800/70',
          'odd:bg-zinc-950 even:bg-zinc-900/60',
          'hover:bg-zinc-800/60 hover:odd:bg-zinc-800/60 hover:even:bg-zinc-800/60',
          'h-11',
          isSelected
            ? '!bg-zinc-800 border-l-2 border-violet-400 pl-[14px]'
            : 'border-l-2 border-transparent',
        ].join(' ')}
      >
        {/* New dot */}
        <div
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            recent ? 'bg-amber-400' : 'bg-transparent'
          }`}
        />

        {/* Role title */}
        <span
          className="text-sm font-medium text-zinc-50 truncate flex-1 min-w-0"
          style={{ maxWidth: 280 }}
        >
          {job.role_title}
        </span>

        {/* Company */}
        <span
          className="text-sm text-zinc-300 truncate hidden sm:block flex-shrink-0"
          style={{ width: 180 }}
        >
          {job.company}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Source badge */}
        <span
          className="text-xs bg-zinc-800 border border-zinc-700/50 text-zinc-300 px-2 py-0.5 rounded-md font-mono truncate flex-shrink-0"
          style={{ width: 120 }}
        >
          {job.source_name}
        </span>

        {/* Relative date */}
        <span className="text-xs text-zinc-400 text-right flex-shrink-0" style={{ width: 44 }}>
          {relativeDate(job.date_scraped)}
        </span>
      </div>
    </>
  );
}
