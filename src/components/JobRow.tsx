'use client';

import { Bookmark } from 'lucide-react';
import type { Job } from '@/types';

function relativeDate(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function isRecent(dateStr: string): boolean {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000 < 7;
}

interface JobRowProps {
  job: Job;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (job: Job) => void;
}

export default function JobRow({ job, isSelected, isSaved, onSelect }: JobRowProps) {
  const recent = isRecent(job.date_scraped);

  return (
    <div
      onClick={() => onSelect(job)}
      className={`w-full cursor-pointer select-none border-b border-outline-variant/60 transition-colors ${
        isSelected ? 'bg-primary-container' : 'hover:bg-black/[0.08]'
      }`}
    >
      {/* ── Mobile card ── */}
      <div className="md:hidden px-4 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-sm font-medium leading-snug flex-1 min-w-0 ${isSelected ? 'text-on-primary-container' : 'text-on-surface'}`}>
            {job.role_title}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isSaved && (
              <Bookmark size={12} className={`fill-current ${isSelected ? 'text-on-primary-container' : 'text-primary'}`} />
            )}
            {recent && (
              <span className="text-xs bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-shape-full font-medium">
                New
              </span>
            )}
          </div>
        </div>
        <div className={`text-xs mt-0.5 ${isSelected ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}>
          {job.company}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-shape-sm font-medium truncate max-w-[140px]">
            {job.source_name}
          </span>
          <span className="text-xs text-on-surface-variant">{relativeDate(job.date_scraped)}</span>
          <div className="flex-1" />
          <a
            href={job.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs bg-primary text-on-primary px-3 py-1 rounded-shape-full font-medium hover:opacity-90 transition-opacity"
          >
            Apply
          </a>
        </div>
        {job.tags && job.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {job.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-shape-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop row ── */}
      <div className="hidden md:flex items-center gap-3 px-4 h-10">
        {/* New indicator dot */}
        <div className={`w-1.5 h-1.5 rounded-shape-full flex-shrink-0 ${recent ? 'bg-primary' : 'bg-transparent'}`} />

        {/* Role */}
        <span
          className={`text-sm font-medium truncate min-w-0 ${isSelected ? 'text-on-primary-container' : 'text-on-surface'}`}
          style={{ width: 260, flexShrink: 0 }}
        >
          {job.role_title}
        </span>

        {/* Company */}
        <span
          className={`text-xs truncate flex-shrink-0 ${isSelected ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}
          style={{ width: 200 }}
        >
          {job.company}
        </span>

        {/* Tags */}
        {job.tags && job.tags.length > 0 ? (
          <div className="flex gap-1 flex-shrink-0" style={{ width: 140 }}>
            {job.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs bg-secondary-container text-on-secondary-container px-1.5 py-px rounded-shape-full truncate max-w-[68px]">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ width: 140 }} className="flex-shrink-0" />
        )}

        <div className="flex-1" />

        {/* Source badge */}
        <span
          className="text-xs bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-shape-sm font-medium truncate flex-shrink-0"
          style={{ width: 120 }}
        >
          {job.source_name}
        </span>

        {/* Date */}
        <span
          className={`text-xs text-right flex-shrink-0 ${isSelected ? 'text-on-primary-container/70' : 'text-on-surface-variant'}`}
          style={{ width: 48 }}
        >
          {relativeDate(job.date_scraped)}
        </span>

        {/* Saved indicator */}
        <Bookmark
          size={11}
          className={`flex-shrink-0 transition-colors ${
            isSaved
              ? isSelected ? 'text-on-primary-container fill-current' : 'text-primary fill-current'
              : 'text-transparent'
          }`}
        />
      </div>
    </div>
  );
}
