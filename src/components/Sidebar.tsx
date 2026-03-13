'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { Briefcase, Bookmark, Settings, Menu, X, BookOpen } from 'lucide-react';
import FilterPanel from '@/components/FilterPanel';
import { getSavedIds } from '@/lib/savedJobs';

const navLinks = [
  { href: '/', label: 'Browse', icon: Briefcase },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/admin', label: 'Admin', icon: Settings },
  { href: '/help', label: 'Guide', icon: BookOpen },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [savedCount, setSavedCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setSavedCount(getSavedIds().length);
    const handleStorage = () => {
      setSavedCount(getSavedIds().length);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const sidebarContent = (
    <>
      <div>
        <div className="text-sm font-semibold text-zinc-50">Startup Jobs</div>
        <div className="text-xs text-zinc-500">VC-sourced listings</div>
      </div>
      <div className="border-b border-zinc-800 my-3" />
      <nav className="flex flex-col gap-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={16} />
              {label}
              {label === 'Saved' && savedCount > 0 && (
                <span className="bg-violet-500 text-white text-xs px-1.5 rounded ml-auto">
                  {savedCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <Suspense fallback={null}>
        <FilterPanel />
      </Suspense>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-zinc-900 border-r border-zinc-800 flex-col overflow-hidden p-3 hidden md:flex z-30">
        {sidebarContent}
      </aside>
      {/* Desktop spacer */}
      <div className="hidden md:block w-60 flex-shrink-0" />

      {/* Mobile top bar */}
      <div className="flex md:hidden items-center px-3 h-12 bg-zinc-900 border-b border-zinc-800 fixed top-0 left-0 right-0 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1 text-zinc-400 hover:text-zinc-50"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm font-semibold text-zinc-50 ml-2">
          Startup Jobs
        </span>
      </div>
      {/* Mobile spacer for top bar */}
      <div className="block md:hidden h-12 flex-shrink-0" />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden p-3 z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-zinc-50">
                Startup Jobs
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-50"
              >
                <X size={16} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
