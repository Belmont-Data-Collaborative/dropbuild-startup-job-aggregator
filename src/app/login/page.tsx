'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      const redirect = searchParams.get('redirect') ?? '/';
      router.push(redirect);
      router.refresh();
    } else {
      setError('Incorrect password. Try again.');
    }
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center px-4">
      <div className="w-full max-w-xs">

        {/* Brand block */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-shape-md bg-primary flex items-center justify-center shadow-elevation-1">
            <Zap size={24} className="text-on-primary" fill="currentColor" />
          </div>
          <div className="text-center">
            <div className="text-base font-semibold text-on-surface">Startup Jobs</div>
            <div className="text-sm text-on-surface-variant mt-0.5">VC-sourced listings</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-shape-lg shadow-elevation-1 p-6">
          <p className="text-sm text-on-surface-variant mb-4 text-center">
            Enter your password to continue
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-shape-sm px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-error bg-error-container text-on-error-container rounded-shape-sm px-3 py-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary text-sm font-medium rounded-shape-full py-2.5 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Checking…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
