'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { ChevronDown } from 'lucide-react';
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

  // Auto-expand week selector if a non-latest week is already selected
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

  const hasNonDefault =
    !curatedOn ||
    (!isLatestWeek && selectedWeek !== '');

  return (
    <div className="border-t border-zinc-700/60 mt-3 pt-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-3 mb-3">
        Filters
      </div>

      {/* Curated toggle */}
      <div className="px-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-200">Startup roles only</div>
            <div className="text-xs text-zinc-500 mt-0.5">Filter to curated matches</div>
          </div>
          <SwitchPrimitive.Root
            checked={curatedOn}
            onCheckedChange={(checked) =>
              pushParams({ curated: checked ? '1' : '0' })
            }
            className="data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-zinc-700 h-5 w-9 rounded-full transition-colors relative flex-shrink-0"
          >
            <SwitchPrimitive.Thumb className="block h-4 w-4 rounded-full bg-white translate-x-0.5 transition-transform data-[state=checked]:translate-x-[18px]" />
          </SwitchPrimitive.Root>
        </div>
      </div>

      {/* Week disclosure */}
      <div className="mb-2">
        <button
          onClick={() => setWeekExpanded((v) => !v)}
          className="flex items-center justify-between w-full px-3 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <span>
            {isLatestWeek
              ? 'Showing latest jobs'
              : `Week: ${weekKeyToLabel(selectedWeek)}`}
          </span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${weekExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {weekExpanded && (
          <div className="mt-1.5 px-3">
            <select
              value={selectedWeek}
              onChange={(e) => pushParams({ week: e.target.value })}
              className="bg-zinc-800 border border-zinc-700/80 text-zinc-100 text-sm rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-violet-400"
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

      {/* Reset */}
      {hasNonDefault && (
        <button
          onClick={() => router.push('/')}
          className="text-xs text-zinc-500 hover:text-zinc-300 px-3 mt-2 block"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
