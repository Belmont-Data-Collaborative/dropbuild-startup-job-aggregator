'use client';

import type { Job } from '@/types';

function relativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function isRecent(dateStr: string): boolean {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000 < 7;
}

interface JobRowProps {
  job: Job;
  index: number;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (job: Job) => void;
}

export default function JobRow({ job, index, isSelected, isSaved: _isSaved, onSelect }: JobRowProps) {
  const recent = isRecent(job.date_scraped);
  const stripe = index % 2 === 1 ? 'row-stripe' : '';

  const baseClass = [
    'job-row w-full cursor-pointer select-none',
    'border-b border-zinc-700/50',
    'border-l-2',
    isSelected ? 'selected border-violet-400' : 'border-transparent',
    stripe,
  ].join(' ');

  return (
    <div onClick={() => onSelect(job)} className={baseClass}>

      {/* ── Mobile card (< md) ───────────────────────────────── */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-50 leading-snug flex-1 min-w-0">
            {job.role_title}
          </span>
          {recent && (
            <span className="flex-shrink-0 text-xs bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-medium">
              New
            </span>
          )}
        </div>
        <div className="text-sm text-zinc-300 mt-0.5">{job.company}</div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-zinc-700/60 text-zinc-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
            {job.source_name}
          </span>
          <span className="text-xs text-zinc-500">{relativeDate(job.date_scraped)}</span>
          <div className="flex-1" />
          <a
            href={job.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded-md font-medium transition-colors flex-shrink-0"
          >
            Apply →
          </a>
        </div>
        {job.tags && job.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {job.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-violet-500/15 text-violet-300 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop row (≥ md) ───────────────────────────────── */}
      <div className="hidden md:flex items-center gap-3 px-4 h-12">
        {/* New dot */}
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${recent ? 'bg-amber-400' : 'bg-transparent'}`} />

        {/* Role */}
        <span className="text-sm font-medium text-zinc-50 truncate min-w-0" style={{ width: 260, flexShrink: 0 }}>
          {job.role_title}
        </span>

        {/* Company */}
        <span className="text-sm text-zinc-300 truncate flex-shrink-0" style={{ width: 200 }}>
          {job.company}
        </span>

        {/* Tags (if curated) */}
        {job.tags && job.tags.length > 0 ? (
          <div className="flex gap-1 flex-shrink-0" style={{ width: 140 }}>
            {job.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs bg-violet-500/15 text-violet-300 px-1.5 py-0.5 rounded truncate max-w-[68px]">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ width: 140 }} className="flex-shrink-0" />
        )}

        <div className="flex-1" />

        {/* Source badge */}
        <span className="text-xs bg-zinc-700/60 text-zinc-300 px-2 py-0.5 rounded-md font-mono truncate flex-shrink-0" style={{ width: 120 }}>
          {job.source_name}
        </span>

        {/* Date */}
        <span className="text-xs text-zinc-400 text-right flex-shrink-0" style={{ width: 48 }}>
          {relativeDate(job.date_scraped)}
        </span>
      </div>

    </div>
  );
}
