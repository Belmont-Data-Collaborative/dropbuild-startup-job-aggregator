'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { weekKeyToLabel } from '@/lib/weekKey';

export default function FilterPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [weekExpanded, setWeekExpanded] = useState(false);

  useEffect(() => {
    async function fetchWeeks() {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('jobs')
        .select('week_key')
        .order('week_key', { ascending: false });
      if (data) {
        const unique = Array.from(
          new Set(data.map((r: { week_key: string }) => r.week_key))
        ).sort((a, b) => b.localeCompare(a));
        setAvailableWeeks(unique);
      }
    }
    fetchWeeks();
  }, []);

  useEffect(() => {
    const currentWeek = searchParams.get('week');
    if (availableWeeks.length > 0 && currentWeek && currentWeek !== availableWeeks[0]) {
      setWeekExpanded(true);
    }
  }, [availableWeeks, searchParams]);

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

  if (pathname !== '/') return null;

  const selectedWeek = searchParams.get('week') ?? availableWeeks[0] ?? '';
  const curatedOn = searchParams.get('curated') !== '0';
  const isLatestWeek = selectedWeek === '' || selectedWeek === availableWeeks[0];

  const hasNonDefault = !curatedOn || (!isLatestWeek && selectedWeek !== '');

  return (
    <div className="border-t border-outline-variant mx-3 mt-2 pt-2.5">
      {/* Section label */}
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-2 mb-2">
        <SlidersHorizontal size={11} />
        Filters
      </div>

      {/* ── Curated toggle ── */}
      <div className="px-2 mb-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-on-surface font-medium">Startup roles only</span>
          <SwitchPrimitive.Root
            checked={curatedOn}
            onCheckedChange={(checked) => pushParams({ curated: checked ? '1' : '0' })}
            className="relative h-6 w-10 rounded-shape-full cursor-pointer transition-colors flex-shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-surface-container-highest border data-[state=checked]:border-primary data-[state=unchecked]:border-outline"
          >
            <SwitchPrimitive.Thumb className="block h-4 w-4 rounded-shape-full shadow-elevation-1 translate-x-0.5 transition-transform data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-on-primary data-[state=unchecked]:bg-outline" />
          </SwitchPrimitive.Root>
        </div>
      </div>

      {/* ── Week picker ── */}
      <div className="px-2 mb-2">
        <button
          onClick={() => setWeekExpanded((v) => !v)}
          className="flex items-center justify-between w-full py-0.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="font-medium">
            {isLatestWeek ? 'Latest jobs' : `Week: ${weekKeyToLabel(selectedWeek)}`}
          </span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${weekExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {weekExpanded && (
          <div className="mt-1.5">
            <select
              value={selectedWeek}
              onChange={(e) => pushParams({ week: e.target.value })}
              className="bg-surface border border-outline text-on-surface text-xs rounded-shape-xs px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow appearance-none cursor-pointer"
            >
              {availableWeeks.map((wk, i) => (
                <option key={wk} value={wk}>
                  {i === 0 ? `Latest — ${weekKeyToLabel(wk)}` : weekKeyToLabel(wk)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Reset ── */}
      {hasNonDefault && (
        <button
          onClick={() => router.push('/')}
          className="text-xs text-primary hover:opacity-80 px-2 mt-0.5 transition-opacity block"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
