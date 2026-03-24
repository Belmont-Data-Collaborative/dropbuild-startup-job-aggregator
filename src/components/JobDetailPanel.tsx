'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Bookmark, Loader2, Tag, FileText, Calendar } from 'lucide-react';
import type { Job } from '@/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown';
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const META_LABELS = [
  'Department', 'Employment Type', 'Location', 'Workplace type', 'Workplace Type',
  'Reporting To', 'Job Type', 'Salary', 'Compensation', 'Level', 'Team',
  'Remote', 'Office', 'City', 'Country', 'Region', 'Posted',
];

type Section =
  | { kind: 'meta'; pairs: { label: string; value: string }[] }
  | { kind: 'heading'; text: string }
  | { kind: 'body'; text: string };

function parseDescription(raw: string): Section[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const sections: Section[] = [];
  const metaPairs: { label: string; value: string }[] = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const isLabel = META_LABELS.some((lbl) => lbl.toLowerCase() === line.toLowerCase());
    if (isLabel && i + 1 < lines.length && lines[i + 1].length < 80) {
      metaPairs.push({ label: line, value: lines[i + 1] });
      i += 2;
    } else {
      break;
    }
  }

  if (metaPairs.length > 0) {
    sections.push({ kind: 'meta', pairs: metaPairs });
  }

  const remaining = lines.slice(i);
  let j = 0;

  while (j < remaining.length) {
    const line = remaining[j];

    const isHeading =
      line.length < 60 &&
      !/[.!?,;]$/.test(line) &&
      !/^[a-z]/.test(line) &&
      (j === 0 || remaining[j - 1].length > 40 || j > 0);

    const isNoise =
      line.length < 4 ||
      /^(apply now|register your interest|view.*profile|not quite right)/i.test(line);

    if (isNoise) { j++; continue; }

    if (isHeading && line.length < 60) {
      sections.push({ kind: 'heading', text: line });
      j++;
    } else {
      let body = line;
      j++;
      while (j < remaining.length) {
        const next = remaining[j];
        const nextIsHeading =
          next.length < 60 &&
          !/[.!?,;]$/.test(next) &&
          !/^[a-z]/.test(next);
        if (nextIsHeading) break;
        const nextIsNoise =
          next.length < 4 ||
          /^(apply now|register your interest|view.*profile|not quite right)/i.test(next);
        if (nextIsNoise) { j++; continue; }
        body += '\n' + next;
        j++;
      }
      sections.push({ kind: 'body', text: body });
    }
  }

  return sections;
}

function DescriptionRenderer({ text }: { text: string }) {
  const sections = parseDescription(text);

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        if (section.kind === 'meta') {
          return (
            <div key={idx} className="grid grid-cols-2 gap-x-4 gap-y-2">
              {section.pairs.map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-on-surface-variant mb-0.5">{label}</div>
                  <div className="text-sm text-on-surface font-medium">{value}</div>
                </div>
              ))}
            </div>
          );
        }
        if (section.kind === 'heading') {
          return (
            <div
              key={idx}
              className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant pt-2 border-t border-outline-variant"
            >
              {section.text}
            </div>
          );
        }
        return (
          <p key={idx} className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
            {section.text}
          </p>
        );
      })}
    </div>
  );
}

interface JobDetailPanelProps {
  job: Job | null;
  savedIds: string[];
  onClose: () => void;
  onToggleSave: (id: string) => void;
}

export default function JobDetailPanel({
  job,
  savedIds,
  onClose,
  onToggleSave,
}: JobDetailPanelProps) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [fetchedDescription, setFetchedDescription] = useState<string | null>(null);
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState(false);
  const [bookmarkKey, setBookmarkKey] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!job) return;
    setFetchedDescription(null);
    setDescError(false);

    if (job.raw_snippet?.trim()) return;

    setDescLoading(true);
    fetch(`/api/fetch-description?url=${encodeURIComponent(job.listing_url)}`)
      .then((r) => r.json())
      .then((data: { text?: string; error?: string }) => {
        if (data.text) {
          setFetchedDescription(data.text);
        } else {
          setDescError(true);
        }
      })
      .catch(() => setDescError(true))
      .finally(() => setDescLoading(false));
  }, [job?.id]);

  if (!job) return null;

  const isSaved = savedIds.includes(job.id);
  const snippet = job.raw_snippet?.trim() ?? fetchedDescription;

  const panelClass = isDesktop
    ? 'w-[420px] flex-shrink-0 bg-surface border-l border-outline-variant flex flex-col h-full overflow-y-auto animate-slide-in-right'
    : 'fixed bottom-0 left-0 right-0 h-[85vh] bg-surface border-t border-outline-variant z-40 rounded-t-shape-xl overflow-y-auto flex flex-col shadow-elevation-3 animate-slide-in-up';

  return (
    <>
      {!isDesktop && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={panelClass}>
        {/* Mobile drag handle */}
        {!isDesktop && (
          <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-outline-variant rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start p-4 border-b border-outline-variant flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="text-base font-semibold text-on-surface leading-tight">
              {job.role_title}
            </div>
            <div className="text-sm text-on-surface-variant mt-0.5">{job.company}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-shape-full hover:bg-black/[0.08] flex-shrink-0 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-shape-full hover:bg-black/[0.08] transition-colors font-medium"
            >
              {job.source_name}
              <ExternalLink size={10} className="opacity-60" />
            </a>
            <span className="flex items-center gap-1 text-xs text-on-surface-variant">
              <Calendar size={11} className="opacity-60" />
              Added {formatDate(job.date_scraped)}
            </span>
            {job.date_posted && (
              <span className="text-xs text-on-surface-variant">
                · Posted {formatDate(job.date_posted)}
              </span>
            )}
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-1.5">
                <Tag size={11} />
                Matched tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-0.5 rounded-shape-full bg-secondary-container text-on-secondary-container"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
              <FileText size={11} />
              Job Details
            </div>
            {descLoading ? (
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Loader2 size={14} className="animate-spin" />
                Loading job details…
              </div>
            ) : snippet ? (
              <DescriptionRenderer text={snippet} />
            ) : descError ? (
              <div className="flex flex-col gap-3">
                <div className="text-sm text-on-surface-variant/60 italic">
                  Could not load description.
                </div>
                <a
                  href={job.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity w-fit font-medium"
                >
                  <ExternalLink size={13} />
                  Open listing directly
                </a>
              </div>
            ) : (
              <div className="text-sm text-on-surface-variant/60 italic">
                No description available.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-outline-variant space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => { onToggleSave(job.id); setBookmarkKey((k) => k + 1); }}
              className={`p-2 rounded-shape-sm border transition-colors flex-shrink-0 ${
                isSaved
                  ? 'bg-secondary-container border-secondary-container text-on-secondary-container'
                  : 'border-outline text-on-surface-variant hover:bg-black/[0.08]'
              }`}
              title={isSaved ? 'Remove bookmark' : 'Save this job'}
            >
              <Bookmark
                key={bookmarkKey}
                size={16}
                className={`${isSaved ? 'fill-current' : ''} ${bookmarkKey > 0 ? 'animate-bookmark-pop' : ''}`}
              />
            </button>
            <a
              href={job.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-primary text-on-primary text-sm font-medium rounded-shape-full py-2 transition-colors hover:opacity-90 flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={13} />
              View &amp; Apply
            </a>
          </div>
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full border border-outline text-on-surface-variant text-sm rounded-shape-full py-1.5 transition-colors hover:bg-black/[0.08] flex items-center justify-center gap-1.5"
          >
            <ExternalLink size={13} />
            Browse all jobs at {job.source_name}
          </a>
        </div>
      </div>
    </>
  );
}
