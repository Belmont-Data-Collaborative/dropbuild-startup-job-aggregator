'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, Plus, X, Check, Settings } from 'lucide-react';
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
  const [filterText, setFilterText] = useState<Record<string, string>>(
    Object.fromEntries(
      ['exclude_keywords', 'include_role_levels', 'include_keywords', 'include_industries'].map(
        (k) => [k, (Array.isArray(filterConfig[k]) ? filterConfig[k] : []).join('\n')]
      )
    )
  );
  const [savingSources, setSavingSources] = useState(false);
  const [savingFilter, setSavingFilter] = useState(false);
  const [saveSourcesStatus, setSaveSourcesStatus] = useState<'idle' | 'saved'>('idle');
  const [saveFilterStatus, setSaveFilterStatus] = useState<'idle' | 'saved'>('idle');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'vc_board' | 'newsletter'>('vc_board');

  const [recipients, setRecipients] = useState<string[]>(Array.isArray(emailRecipients) ? [...emailRecipients] : []);
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
    setSavingSources(true);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_sources', payload: localSources }),
      });
      setSaveSourcesStatus('saved');
      setTimeout(() => setSaveSourcesStatus('idle'), 3000);
    } finally {
      setSavingSources(false);
    }
  };

  const handleSaveFilterConfig = async () => {
    const payload = Object.fromEntries(
      Object.entries(filterText).map(([k, v]) => [
        k,
        v.split('\n').map((s) => s.trim()).filter(Boolean),
      ])
    );
    setSavingFilter(true);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_filter_config', payload }),
      });
      setLocalFilterConfig(payload);
      setSaveFilterStatus('saved');
      setTimeout(() => setSaveFilterStatus('idle'), 3000);
    } finally {
      setSavingFilter(false);
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

  const filterKeys = [
    {
      key: 'exclude_keywords',
      label: 'Exclude keywords',
      description: 'Listings matching any of these in role title or company are marked NOT curated (checked first)',
      labelClass: 'text-error',
    },
    {
      key: 'include_role_levels',
      label: 'Include role levels',
      description: 'Seniority/title matches (e.g. COO, VP Operations) — matched values become tags',
      labelClass: 'text-primary',
    },
    {
      key: 'include_keywords',
      label: 'Include keywords',
      description: 'Topic/function matches (e.g. healthcare, operations) — matched values become tags',
      labelClass: 'text-primary',
    },
    {
      key: 'include_industries',
      label: 'Include industries',
      description: 'Industry matches checked against role title and company name — matched values become tags',
      labelClass: 'text-primary',
    },
  ];

  // suppress unused variable warning
  void localFilterConfig;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-outline-variant bg-surface-container-low flex-shrink-0">
        <Settings size={18} className="text-primary flex-shrink-0" />
        <div>
          <div className="text-base font-semibold text-on-surface leading-tight">Admin</div>
          <div className="text-xs text-on-surface-variant mt-0.5">Pipeline history, sources, filter config &amp; email</div>
        </div>
      </div>

    <div className="flex-1 overflow-y-auto px-6 py-6">
    <div className="max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Pipeline History */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-on-surface mb-3">Pipeline History</h2>
          {runs.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No pipeline runs yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-on-surface-variant uppercase text-left border-b border-outline-variant">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Scraped</th>
                  <th className="pb-2 font-medium">New</th>
                  <th className="pb-2 font-medium">Dupes</th>
                  <th className="pb-2 font-medium">Filtered</th>
                  <th className="pb-2 font-medium">Errors</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-outline-variant/50">
                    <td className="py-2 text-on-surface">{formatRunDate(run.run_date)}</td>
                    <td className="py-2 text-on-surface-variant">{run.total_scraped}</td>
                    <td className="py-2 text-on-surface-variant">{run.new_listings}</td>
                    <td className="py-2 text-on-surface-variant">{run.duplicate_count}</td>
                    <td className="py-2 text-on-surface-variant">{run.filtered_count}</td>
                    <td className="py-2 text-on-surface-variant">
                      {run.error_count > 0 && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-error mr-1" />
                      )}
                      {run.error_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="bg-surface-container border border-outline-variant rounded-shape-sm p-4 mt-4 text-xs text-on-surface-variant font-mono">
            cd scraper && python scrape.py
          </div>

          {/* Email Notifications */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={14} className="text-primary" />
              <h2 className="text-sm font-semibold text-on-surface">Email Notifications</h2>
            </div>

            {/* Sender (fixed) */}
            <div className="mb-4">
              <label className="text-xs text-on-surface-variant uppercase tracking-wider block mb-1">From</label>
              <div className="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-shape-sm px-3 py-2">
                <span className="text-sm text-on-surface-variant font-mono">{SENDER}</span>
                <span className="text-xs bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded-shape-xs ml-auto">fixed</span>
              </div>
            </div>

            {/* Recipients */}
            <label className="text-xs text-on-surface-variant uppercase tracking-wider block mb-2">To</label>
            <div className="space-y-1.5 mb-3">
              {recipients.map((email) => (
                <div key={email} className="flex items-center justify-between bg-surface-container border border-outline-variant rounded-shape-sm px-3 py-1.5">
                  <span className="text-sm text-on-surface font-mono">{email}</span>
                  <button
                    onClick={() => handleRemoveRecipient(email)}
                    className="text-on-surface-variant hover:text-error ml-2 flex-shrink-0 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {recipients.length === 0 && (
                <p className="text-xs text-on-surface-variant/60 px-1">No recipients — add one below</p>
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
                className="flex-1 bg-surface border border-outline rounded-shape-sm text-sm text-on-surface px-3 py-1.5 placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
              />
              <button
                onClick={handleAddRecipient}
                className="bg-surface-container-highest hover:bg-black/[0.08] text-on-surface px-2.5 py-1.5 rounded-shape-sm border border-outline transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Status + Send buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {emailSaving && (
                <span className="text-xs text-on-surface-variant">Saving…</span>
              )}
              {saveRecipientsStatus === 'saved' && !emailSaving && (
                <span className="flex items-center gap-1 text-xs text-tertiary">
                  <Check size={11} /> Saved
                </span>
              )}
              <button
                onClick={handleSendDigest}
                disabled={digestStatus === 'sending' || recipients.length === 0}
                className="flex items-center gap-1.5 bg-primary text-on-primary text-xs px-3 py-1.5 rounded-shape-full disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <Send size={12} />
                {digestStatus === 'sending' ? 'Sending...' : 'Send Digest'}
              </button>
              <button
                onClick={handleSendTest}
                disabled={testStatus === 'sending' || recipients.length === 0}
                className="flex items-center gap-1.5 border border-outline text-on-surface-variant text-xs px-3 py-1.5 rounded-shape-full disabled:opacity-50 hover:bg-black/[0.08] transition-colors"
              >
                <Send size={12} />
                {testStatus === 'sending' ? 'Sending...' : 'Send Test'}
              </button>
            </div>

            {saveRecipientsStatus === 'error' && (
              <p className="text-xs text-error mt-2">Save failed: {saveRecipientsError}</p>
            )}
            {digestStatus === 'sent' && (
              <p className="text-xs text-tertiary mt-2">Digest sent successfully.</p>
            )}
            {digestStatus === 'error' && (
              <p className="text-xs text-error mt-2">Error: {digestError}</p>
            )}
            {testStatus === 'sent' && (
              <p className="text-xs text-tertiary mt-2">Test email sent successfully.</p>
            )}
            {testStatus === 'error' && (
              <p className="text-xs text-error mt-2">Error: {testError}</p>
            )}
          </div>
        </div>

        {/* Config */}
        <div className="w-full md:w-72 flex-shrink-0">
          {/* Sources */}
          <h2 className="text-sm font-semibold text-on-surface mb-2">Sources</h2>
          <div className="space-y-1.5">
            {localSources.map((source, i) => (
              <div key={`${source.name}-${i}`} className="flex items-center justify-between bg-surface-container border border-outline-variant rounded-shape-sm px-3 py-1.5">
                <div className="flex items-center min-w-0">
                  <span className="text-sm text-on-surface truncate">{source.name}</span>
                  <span className="text-xs bg-surface-container-highest text-on-surface-variant px-1.5 rounded-shape-xs ml-2 flex-shrink-0">{source.type}</span>
                </div>
                <button
                  onClick={() => handleRemoveSource(i)}
                  className="text-on-surface-variant hover:text-error transition-colors ml-2 flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="bg-surface border border-outline rounded-shape-sm text-sm text-on-surface px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow placeholder:text-on-surface-variant/50"
            />
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL"
              className="bg-surface border border-outline rounded-shape-sm text-sm text-on-surface px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow placeholder:text-on-surface-variant/50"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'vc_board' | 'newsletter')}
              className="bg-surface border border-outline rounded-shape-sm text-sm text-on-surface px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow appearance-none cursor-pointer"
            >
              <option value="vc_board">vc_board</option>
              <option value="newsletter">newsletter</option>
            </select>
            <button
              onClick={handleAddSource}
              className="bg-surface-container-highest hover:bg-black/[0.08] text-on-surface border border-outline px-2.5 py-1.5 rounded-shape-sm border transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSaveSources}
              disabled={savingSources}
              className="bg-primary text-on-primary text-xs px-3 py-1.5 rounded-shape-full disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {savingSources ? 'Saving...' : 'Save Sources'}
            </button>
            {saveSourcesStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-tertiary">
                <Check size={11} /> Saved
              </span>
            )}
          </div>

          {/* Filter Config */}
          <h2 className="text-sm font-semibold text-on-surface mb-2 mt-5">Filter Config</h2>
          {filterKeys.map(({ key, label, description, labelClass }) => (
            <div key={key} className="mb-4">
              <label className={`text-xs font-semibold mb-0.5 block ${labelClass}`}>{label}</label>
              <p className="text-xs text-on-surface-variant/70 mb-1.5 leading-snug">{description}</p>
              <textarea
                value={filterText[key] ?? ''}
                onChange={(e) => setFilterText({ ...filterText, [key]: e.target.value })}
                className="bg-surface border border-outline rounded-shape-sm text-sm text-on-surface p-2 w-full h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                placeholder="one entry per line"
              />
              <p className="text-xs text-on-surface-variant/50 mt-0.5">
                {filterText[key]?.split('\n').filter(s => s.trim()).length ?? 0} entries
              </p>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSaveFilterConfig}
              disabled={savingFilter}
              className="bg-primary text-on-primary text-xs px-3 py-1.5 rounded-shape-full disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {savingFilter ? 'Saving...' : 'Save Filter Config'}
            </button>
            {saveFilterStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-tertiary">
                <Check size={11} /> Saved
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
    </div>
    </div>
  );
}
