'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Bookmark, Loader2 } from 'lucide-react';
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

// Known metadata labels to pull out as key-value pairs
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

  // First pass: extract leading key-value metadata block
  while (i < lines.length) {
    const line = lines[i];
    const isLabel = META_LABELS.some(
      (lbl) => lbl.toLowerCase() === line.toLowerCase()
    );
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

  // Second pass: remaining lines → headings or body paragraphs
  const remaining = lines.slice(i);
  let j = 0;

  while (j < remaining.length) {
    const line = remaining[j];

    // Heuristic: a heading is a short line (< 60 chars) that is NOT a sentence
    // (doesn't end with punctuation) and is surrounded by context
    const isHeading =
      line.length < 60 &&
      !/[.!?,;]$/.test(line) &&
      !/^[a-z]/.test(line) && // doesn't start lowercase
      (j === 0 || remaining[j - 1].length > 40 || j > 0); // previous line is body or start

    // Skip noise lines
    const isNoise =
      line.length < 4 ||
      /^(apply now|register your interest|view.*profile|not quite right)/i.test(line);

    if (isNoise) {
      j++;
      continue;
    }

    if (isHeading && line.length < 60) {
      // Look ahead: if next line is short too and looks like a value, treat as inline kv
      if (
        j + 1 < remaining.length &&
        remaining[j + 1].length < 80 &&
        remaining[j + 1].length > 2
      ) {
        // Could be a standalone section heading with body below
        sections.push({ kind: 'heading', text: line });
        j++;
      } else {
        sections.push({ kind: 'heading', text: line });
        j++;
      }
    } else {
      // Accumulate body text into one paragraph block
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
                  <div className="text-xs text-zinc-500 mb-0.5">{label}</div>
                  <div className="text-sm text-zinc-200 font-medium">{value}</div>
                </div>
              ))}
            </div>
          );
        }
        if (section.kind === 'heading') {
          return (
            <div
              key={idx}
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 pt-2 border-t border-zinc-800"
            >
              {section.text}
            </div>
          );
        }
        return (
          <p key={idx} className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
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
    ? 'fixed right-0 top-0 bottom-0 w-[420px] bg-zinc-900 border-l border-zinc-800 z-40 overflow-y-auto flex flex-col'
    : 'fixed bottom-0 left-0 right-0 h-[85vh] bg-zinc-900 border-t border-zinc-800 z-40 rounded-t-xl overflow-y-auto flex flex-col';

  return (
    <>
      {!isDesktop && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={panelClass}>
        {/* Header */}
        <div className="flex justify-between items-start p-5 border-b border-zinc-800 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="text-base font-semibold text-zinc-50 leading-tight">
              {job.role_title}
            </div>
            <div className="text-sm text-zinc-400 mt-0.5">{job.company}</div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-100 p-1 rounded hover:bg-zinc-800 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md hover:bg-zinc-700 transition-colors"
            >
              {job.source_name}
              <ExternalLink size={10} className="text-zinc-500" />
            </a>
            <span className="text-xs text-zinc-500">
              Scraped {formatDate(job.date_scraped)}
            </span>
            {job.date_posted && (
              <span className="text-xs text-zinc-500">
                · Posted {formatDate(job.date_posted)}
              </span>
            )}
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Job Details
            </div>
            {descLoading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 size={14} className="animate-spin" />
                Loading…
              </div>
            ) : snippet ? (
              <DescriptionRenderer text={snippet} />
            ) : descError ? (
              <div className="text-sm text-zinc-600 italic">
                Could not load description — open the listing directly.
              </div>
            ) : (
              <div className="text-sm text-zinc-600 italic">
                No description available.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 border-t border-zinc-800 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onToggleSave(job.id)}
              className="p-2.5 rounded-md border border-zinc-700 hover:border-zinc-600 transition-colors flex-shrink-0"
              title={isSaved ? 'Remove bookmark' : 'Bookmark this job'}
            >
              <Bookmark
                size={16}
                className={isSaved ? 'text-violet-400 fill-violet-400' : 'text-zinc-500'}
              />
            </button>
            <button
              onClick={() => window.open(job.listing_url, '_blank')}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-md py-2.5 transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={13} />
              Apply / Open Listing
            </button>
          </div>
          <button
            onClick={() => window.open(job.source_url, '_blank')}
            className="w-full border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-sm rounded-md py-2 transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink size={13} />
            View Source Board — {job.source_name}
          </button>
        </div>
      </div>
    </>
  );
}
