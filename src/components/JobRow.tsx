'use client';

import type { Job } from '@/types';

function relativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return `${diffDays}d`;
  const weeks = Math.floor(diffDays / 7);
  return `${weeks}w`;
}

function isRecent(dateStr: string): boolean {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays < 7;
}

interface JobRowProps {
  job: Job;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (job: Job) => void;
}

export default function JobRow({
  job,
  isSelected,
  isSaved: _isSaved,
  onSelect,
}: JobRowProps) {
  return (
    <div
      onClick={() => onSelect(job)}
      className={`h-11 w-full flex items-center gap-3 px-4 cursor-pointer transition-colors select-none hover:bg-zinc-800/60 border-b border-zinc-800/50 ${
        isSelected
          ? 'bg-zinc-800 border-l-2 border-violet-400 pl-[14px]'
          : 'border-l-2 border-transparent'
      }`}
    >
      {/* New dot */}
      <div
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isRecent(job.date_scraped) ? 'bg-amber-400' : 'bg-transparent'
        }`}
      />

      {/* Role title */}
      <span className="text-sm font-medium text-zinc-100 truncate flex-1 min-w-0" style={{ maxWidth: 260 }}>
        {job.role_title}
      </span>

      {/* Company */}
      <span className="text-sm text-zinc-400 truncate hidden sm:block flex-shrink-0" style={{ width: 180 }}>
        {job.company}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Source badge */}
      <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md font-mono truncate flex-shrink-0" style={{ width: 120 }}>
        {job.source_name}
      </span>

      {/* Relative date */}
      <span className="text-xs text-zinc-500 text-right flex-shrink-0" style={{ width: 36 }}>
        {relativeDate(job.date_scraped)}
      </span>
    </div>
  );
}
