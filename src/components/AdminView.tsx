'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, Plus, X, Check } from 'lucide-react';
import type { PipelineRun, AppSource } from '@/types';

const SENDER = 'databelmont@gmail.com';

function formatRunDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const date = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${date} · ${h12}:${m} ${ampm}`;
}

interface AdminViewProps {
  runs: PipelineRun[];
  sources: AppSource[];
  filterConfig: Record<string, string[]>;
  emailRecipients: string[];
}

export default function AdminView({ runs, sources, filterConfig, emailRecipients }: AdminViewProps) {
  const [localSources, setLocalSources] = useState<AppSource[]>([...sources]);
  const [localFilterConfig, setLocalFilterConfig] = useState<Record<string, string[]>>({ ...filterConfig });
  // Raw textarea strings — kept as-is while editing, converted to arrays only on save
  const [filterText, setFilterText] = useState<Record<string, string>>(
    Object.fromEntries(
      ['exclude_keywords', 'include_role_levels', 'include_keywords', 'include_industries'].map(
        (k) => [k, (Array.isArray(filterConfig[k]) ? filterConfig[k] : []).join('\n')]
      )
    )
  );
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'vc_board' | 'newsletter'>('vc_board');

  // Email state
  const [recipients, setRecipients] = useState<string[]>(Array.isArray(emailRecipients) ? [...emailRecipients] : []);
  // Sync local state whenever the server re-renders with fresh Supabase data
  useEffect(() => {
    setRecipients(Array.isArray(emailRecipients) ? [...emailRecipients] : []);
  }, [emailRecipients]);
  const [newRecipient, setNewRecipient] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [saveRecipientsStatus, setSaveRecipientsStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveRecipientsError, setSaveRecipientsError] = useState('');
  const [digestStatus, setDigestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [digestError, setDigestError] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  const handleSaveSources = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_sources', payload: localSources }),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFilterConfig = async () => {
    const payload = Object.fromEntries(
      Object.entries(filterText).map(([k, v]) => [
        k,
        v.split('\n').map((s) => s.trim()).filter(Boolean),
      ])
    );
    setSaving(true);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_filter_config', payload }),
      });
      setLocalFilterConfig(payload);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSource = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setLocalSources([...localSources, { name: newName.trim(), url: newUrl.trim(), type: newType }]);
    setNewName(''); setNewUrl(''); setNewType('vc_board');
  };

  const handleRemoveSource = (index: number) => {
    setLocalSources(localSources.filter((_, i) => i !== index));
  };


  const persistRecipients = async (list: string[]) => {
    setEmailSaving(true);
    setSaveRecipientsStatus('idle');
    setSaveRecipientsError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_email_recipients', payload: list }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        setSaveRecipientsError(data.error ?? 'Save failed');
        setSaveRecipientsStatus('error');
      } else {
        setSaveRecipientsStatus('saved');
        setTimeout(() => setSaveRecipientsStatus('idle'), 3000);
      }
    } catch (e) {
      setSaveRecipientsError(e instanceof Error ? e.message : 'Unknown error');
      setSaveRecipientsStatus('error');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleAddRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (!email || recipients.includes(email)) return;
    const updated = [...recipients, email];
    setRecipients(updated);
    setNewRecipient('');
    void persistRecipients(updated);
  };

  const handleRemoveRecipient = (email: string) => {
    const updated = recipients.filter((r) => r !== email);
    setRecipients(updated);
    void persistRecipients(updated);
  };

  const handleSendDigest = async () => {
    setDigestStatus('sending');
    setDigestError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_digest', payload: null }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        setDigestError(data.error ?? 'Send failed');
        setDigestStatus('error');
      } else {
        setDigestStatus('sent');
        setTimeout(() => setDigestStatus('idle'), 5000);
      }
    } catch (e) {
      setDigestError(e instanceof Error ? e.message : 'Unknown error');
      setDigestStatus('error');
    }
  };

  const handleSendTest = async () => {
    if (recipients.length === 0) return;
    setTestStatus('sending');
    setTestError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_test_email', payload: recipients }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        setTestError(data.error ?? 'Send failed');
        setTestStatus('error');
      } else {
        setTestStatus('sent');
        setTimeout(() => setTestStatus('idle'), 4000);
      }
    } catch (e) {
      setTestError(e instanceof Error ? e.message : 'Unknown error');
      setTestStatus('error');
    }
  };

  // Order matches backend execution: exclude checked first, then role levels, keywords, industries
  const filterKeys = [
    {
      key: 'exclude_keywords',
      label: 'Exclude keywords',
      description: 'Listings matching any of these in role title or company are marked NOT curated (checked first)',
      color: 'text-red-400',
    },
    {
      key: 'include_role_levels',
      label: 'Include role levels',
      description: 'Seniority/title matches (e.g. COO, VP Operations) — matched values become tags',
      color: 'text-violet-400',
    },
    {
      key: 'include_keywords',
      label: 'Include keywords',
      description: 'Topic/function matches (e.g. healthcare, operations) — matched values become tags',
      color: 'text-violet-400',
    },
    {
      key: 'include_industries',
      label: 'Include industries',
      description: 'Industry matches checked against role title and company name — matched values become tags',
      color: 'text-violet-400',
    },
  ];

  return (
    <div className="px-6 py-6 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Pipeline History */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Pipeline History</h2>
          {runs.length === 0 ? (
            <p className="text-sm text-zinc-500">No pipeline runs yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase text-left border-b border-zinc-800">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Scraped</th>
                  <th className="pb-2">New</th>
                  <th className="pb-2">Dupes</th>
                  <th className="pb-2">Filtered</th>
                  <th className="pb-2">Errors</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-zinc-800/50">
                    <td className="py-2 text-zinc-300">{formatRunDate(run.run_date)}</td>
                    <td className="py-2 text-zinc-400">{run.total_scraped}</td>
                    <td className="py-2 text-zinc-400">{run.new_listings}</td>
                    <td className="py-2 text-zinc-400">{run.duplicate_count}</td>
                    <td className="py-2 text-zinc-400">{run.filtered_count}</td>
                    <td className="py-2 text-zinc-400">
                      {run.error_count > 0 && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1" />
                      )}
                      {run.error_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-md p-4 mt-4 text-xs text-zinc-400 font-mono">
            cd scraper && python scrape.py
          </div>

          {/* Email Notifications */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={14} className="text-violet-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Email Notifications</h2>
            </div>

            {/* Sender (fixed) */}
            <div className="mb-4">
              <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">From</label>
              <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-800 rounded-md px-3 py-2">
                <span className="text-sm text-zinc-400 font-mono">{SENDER}</span>
                <span className="text-xs bg-zinc-700 text-zinc-500 px-1.5 py-0.5 rounded ml-auto">fixed</span>
              </div>
            </div>

            {/* Recipients */}
            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">To</label>
            <div className="space-y-1.5 mb-3">
              {recipients.map((email) => (
                <div key={email} className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5">
                  <span className="text-sm text-zinc-200 font-mono">{email}</span>
                  <button
                    onClick={() => handleRemoveRecipient(email)}
                    className="text-zinc-600 hover:text-red-400 ml-2 flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {recipients.length === 0 && (
                <p className="text-xs text-zinc-600 px-1">No recipients — add one below</p>
              )}
            </div>

            {/* Add recipient */}
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                placeholder="add@email.com"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-200 px-3 py-1.5 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <button
                onClick={handleAddRecipient}
                className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-2.5 py-1.5 rounded-md"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Auto-save status + Send buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {emailSaving && (
                <span className="text-xs text-zinc-500">Saving…</span>
              )}
              {saveRecipientsStatus === 'saved' && !emailSaving && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Check size={11} /> Saved
                </span>
              )}
              <button
                onClick={handleSendDigest}
                disabled={digestStatus === 'sending' || recipients.length === 0}
                className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 text-white text-xs px-3 py-1.5 rounded disabled:opacity-50"
              >
                <Send size={12} />
                {digestStatus === 'sending' ? 'Sending...' : 'Send Digest'}
              </button>
              <button
                onClick={handleSendTest}
                disabled={testStatus === 'sending' || recipients.length === 0}
                className="flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 text-xs px-3 py-1.5 rounded disabled:opacity-50"
              >
                <Send size={12} />
                {testStatus === 'sending' ? 'Sending...' : 'Send Test'}
              </button>
            </div>

            {saveRecipientsStatus === 'error' && (
              <p className="text-xs text-red-400 mt-2">Save failed: {saveRecipientsError}</p>
            )}
            {digestStatus === 'sent' && (
              <p className="text-xs text-green-400 mt-2">Digest sent successfully.</p>
            )}
            {digestStatus === 'error' && (
              <p className="text-xs text-red-400 mt-2">Error: {digestError}</p>
            )}
            {testStatus === 'sent' && (
              <p className="text-xs text-green-400 mt-2">Test email sent successfully.</p>
            )}
            {testStatus === 'error' && (
              <p className="text-xs text-red-400 mt-2">Error: {testError}</p>
            )}
          </div>
        </div>

        {/* Config */}
        <div className="w-full md:w-72 flex-shrink-0">
          {/* Sources */}
          <h2 className="text-sm font-semibold text-zinc-200 mb-2">Sources</h2>
          <div className="space-y-1">
            {localSources.map((source, i) => (
              <div key={`${source.name}-${i}`} className="flex items-center justify-between py-1.5">
                <div className="flex items-center">
                  <span className="text-sm text-zinc-300">{source.name}</span>
                  <span className="text-xs bg-zinc-700 text-zinc-400 px-1.5 rounded ml-2">{source.type}</span>
                </div>
                <button onClick={() => handleRemoveSource(i)} className="text-zinc-600 hover:text-red-400">
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name"
              className="bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 px-2 py-1 w-full" />
            <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="URL"
              className="bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 px-2 py-1 w-full" />
            <select value={newType} onChange={(e) => setNewType(e.target.value as 'vc_board' | 'newsletter')}
              className="bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 px-2 py-1 w-full">
              <option value="vc_board">vc_board</option>
              <option value="newsletter">newsletter</option>
            </select>
            <button onClick={handleAddSource} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded">Add</button>
          </div>

          <button onClick={handleSaveSources} disabled={saving}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded mt-2 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Sources'}
          </button>

          {/* Filter Config */}
          <h2 className="text-sm font-semibold text-zinc-200 mb-2 mt-5">Filter Config</h2>
          {filterKeys.map(({ key, label, description, color }) => (
            <div key={key} className="mb-4">
              <label className={`text-xs font-semibold mb-0.5 block ${color}`}>{label}</label>
              <p className="text-xs text-zinc-600 mb-1.5 leading-snug">{description}</p>
              <textarea
                value={filterText[key] ?? ''}
                onChange={(e) => setFilterText({ ...filterText, [key]: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 p-2 w-full h-20 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400"
                placeholder="one entry per line"
              />
              <p className="text-xs text-zinc-700 mt-0.5">
                {filterText[key]?.split('\n').filter(s => s.trim()).length ?? 0} entries
              </p>
            </div>
          ))}
          <button onClick={handleSaveFilterConfig} disabled={saving}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded mt-2 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Filter Config'}
          </button>
        </div>

      </div>
    </div>
  );
}
