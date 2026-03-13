'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Search } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { weekKeyToLabel } from '@/lib/weekKey';

export default function FilterPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState(
    searchParams.get('keyword') ?? ''
  );

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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentKeyword = searchParams.get('keyword') ?? '';
      if (searchValue !== currentKeyword) {
        pushParams({ keyword: searchValue || null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, searchParams, pushParams]);

  if (pathname !== '/') return null;

  const selectedWeek = searchParams.get('week') ?? availableWeeks[0] ?? '';
  const curatedOn = searchParams.get('curated') !== '0';
  const keyword = searchParams.get('keyword') ?? '';

  const hasNonDefault =
    keyword !== '' ||
    !curatedOn ||
    (selectedWeek !== '' && selectedWeek !== availableWeeks[0]);

  return (
    <div className="border-t border-zinc-800 mt-3 pt-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-3">
        Filters
      </div>

      {/* Week filter */}
      <div className="mb-3">
        <label className="text-xs text-zinc-500 mb-1 px-3 block">Week</label>
        <select
          value={selectedWeek}
          onChange={(e) => pushParams({ week: e.target.value })}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md px-2 py-1.5 mx-3 focus:outline-none focus:ring-1 focus:ring-violet-400"
          style={{ width: 'calc(100% - 24px)' }}
        >
          {availableWeeks.map((wk) => (
            <option key={wk} value={wk}>
              {weekKeyToLabel(wk)}
            </option>
          ))}
        </select>
      </div>

      {/* Curated toggle */}
      <div className="flex items-center justify-between px-3 mb-3">
        <label className="text-sm text-zinc-300">Curated only</label>
        <SwitchPrimitive.Root
          checked={curatedOn}
          onCheckedChange={(checked) =>
            pushParams({ curated: checked ? '1' : '0' })
          }
          className="data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-zinc-700 h-5 w-9 rounded-full transition-colors relative"
        >
          <SwitchPrimitive.Thumb className="block h-4 w-4 rounded-full bg-white translate-x-0.5 transition-transform data-[state=checked]:translate-x-[18px]" />
        </SwitchPrimitive.Root>
      </div>

      {/* Search */}
      <div className="px-3 mt-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-2.5 text-zinc-500"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search roles\u2026"
            className="bg-zinc-800 border border-zinc-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-400 w-full"
          />
        </div>
      </div>

      {/* Reset */}
      {hasNonDefault && (
        <button
          onClick={() => router.push('/')}
          className="text-xs text-zinc-500 hover:text-zinc-300 px-3 mt-3 block"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
