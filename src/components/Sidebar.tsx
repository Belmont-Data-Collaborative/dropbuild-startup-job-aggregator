'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { Briefcase, Bookmark, Settings, Menu, X, BookOpen, Zap, LogOut } from 'lucide-react';
import FilterPanel from '@/components/FilterPanel';
import { getSavedIds } from '@/lib/savedJobs';

const navLinks = [
  { href: '/', label: 'Browse Jobs', icon: Briefcase },
  { href: '/saved', label: 'Saved Jobs', icon: Bookmark },
  { href: '/help', label: 'Guide', icon: BookOpen },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [savedCount, setSavedCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  useEffect(() => {
    setSavedCount(getSavedIds().length);
    const handleStorage = () => setSavedCount(getSavedIds().length);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Nav destinations + filters + admin link (shared between desktop and mobile modal)
  const drawerNav = (
    <>
      <nav className="flex flex-col gap-0.5 px-2 mt-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 h-9 rounded-shape-sm text-sm font-medium transition-colors border-l-2 ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container border-primary'
                  : 'text-on-surface-variant hover:bg-black/[0.08] hover:text-on-surface border-transparent'
              }`}
            >
              <Icon size={17} className={`flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
              <span className="flex-1">{label}</span>
              {label === 'Saved Jobs' && savedCount > 0 && (
                <span className="bg-primary text-on-primary text-xs px-2 py-0.5 rounded-shape-full min-w-[20px] text-center tabular-nums">
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

      <div className="mt-auto px-2 pt-1.5 border-t border-outline-variant mx-1 mb-1 space-y-0.5">
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 h-8 rounded-shape-sm text-xs font-medium transition-colors border-l-2 ${
            pathname === '/admin'
              ? 'bg-secondary-container text-on-secondary-container border-primary'
              : 'text-on-surface-variant hover:bg-black/[0.08] hover:text-on-surface border-transparent'
          }`}
        >
          <Settings size={13} className="flex-shrink-0" />
          Admin settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 h-8 rounded-shape-sm text-xs font-medium w-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
        >
          <LogOut size={13} className="flex-shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop — permanent navigation drawer ── */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-surface-container overflow-hidden hidden md:flex flex-col z-30">
        {/* Drawer header */}
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-shape-sm bg-primary flex items-center justify-center flex-shrink-0 shadow-elevation-1">
            <Zap size={14} className="text-on-primary" fill="currentColor" />
          </div>
          <div>
            <div className="text-sm font-semibold text-on-surface tracking-tight">Startup Jobs</div>
            <div className="text-xs text-on-surface-variant leading-none mt-0.5">Jobs from top investors</div>
          </div>
        </div>
        <div className="border-b border-outline-variant mx-3 mb-0.5" />
        <div className="flex-1 flex flex-col overflow-hidden">
          {drawerNav}
        </div>
      </aside>
      {/* Desktop spacer */}
      <div className="hidden md:block w-72 flex-shrink-0" />

      {/* ── Mobile — Top App Bar (M3) ── */}
      <div className="flex md:hidden items-center px-2 h-14 bg-surface-container fixed top-0 left-0 right-0 z-30 shadow-elevation-1">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-shape-full text-on-surface-variant hover:bg-black/[0.08] transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
        <span className="text-base font-medium text-on-surface ml-2">
          {navLinks.find((l) => l.href === pathname)?.label
            ?? (pathname === '/admin' ? 'Admin' : 'Startup Jobs')}
        </span>
      </div>

      {/* ── Mobile — Modal navigation drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-surface-container overflow-hidden flex flex-col shadow-elevation-3 z-10">
            <div className="flex items-center justify-between px-4 h-14 border-b border-outline-variant flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-shape-sm bg-primary flex items-center justify-center flex-shrink-0 shadow-elevation-1">
                  <Zap size={14} className="text-on-primary" fill="currentColor" />
                </div>
                <span className="text-sm font-semibold text-on-surface tracking-tight">Startup Jobs</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-shape-full text-on-surface-variant hover:bg-black/[0.08] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              {drawerNav}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
