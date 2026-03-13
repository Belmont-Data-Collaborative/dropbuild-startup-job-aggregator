import type { Job } from '@/types';

const NEWSLETTER_NAMES = new Set([
  'Job Hunting Sux', 'Ali Rohde Jobs', 'Next Play',
  'Nonlinear Techies', 'Beyond Bay St', 'Why You Should Join', 'Web of Jobs',
]);

function weekLabel(weekKey: string): string {
  try {
    const [yearStr, wStr] = weekKey.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(wStr, 10);
    const jan4 = new Date(year, 0, 4);
    const monday1 = new Date(jan4);
    monday1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    const monday = new Date(monday1);
    monday.setDate(monday1.getDate() + (week - 1) * 7);
    return 'Week of ' + monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return weekKey;
  }
}

function formatDate(d: string | null): string {
  if (!d) return 'Unknown';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return 'Unknown';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Full card for curated jobs — highlighted with violet left border + elevated background
function curatedCard(job: Job): string {
  const tags = (job.tags ?? []).slice(0, 5)
    .map(t => `<span style="display:inline-block;font-size:11px;background:#2e1065;color:#c4b5fd;padding:2px 8px;border-radius:999px;margin-right:4px;margin-top:3px">${t}</span>`)
    .join('');
  const snippet = job.raw_snippet
    ? `<div style="font-size:12px;color:#71717a;font-style:italic;margin-top:8px;border-left:2px solid #3f3f46;padding-left:8px;line-height:1.5">${job.raw_snippet.slice(0, 200)}${job.raw_snippet.length > 200 ? '…' : ''}</div>`
    : '';

  return `
<tr>
  <td style="padding:6px 0">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1625;border:1px solid #3b2f6b;border-left:3px solid #7c3aed;border-radius:6px">
      <tr><td style="padding:14px 16px">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top">
            <a href="${job.listing_url}" style="font-size:15px;font-weight:700;color:#c4b5fd;text-decoration:none;line-height:1.3" target="_blank">${job.role_title}</a>
            <div style="font-size:13px;color:#a1a1aa;margin-top:3px;font-weight:500">${job.company}</div>
          </td>
          <td style="vertical-align:top;text-align:right;white-space:nowrap;padding-left:12px">
            <span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:#2e1065;color:#a78bfa;padding:3px 8px;border-radius:4px">Curated</span>
          </td>
        </tr></table>
        <div style="margin-top:8px">
          <span style="display:inline-block;font-family:monospace;font-size:11px;background:#27272a;color:#a1a1aa;padding:2px 7px;border-radius:4px">${job.source_name}</span>
          <span style="font-size:11px;color:#52525b;margin-left:8px">${formatDate(job.date_scraped)}</span>
        </div>
        ${tags ? `<div style="margin-top:4px">${tags}</div>` : ''}
        ${snippet}
      </td></tr>
    </table>
  </td>
</tr>`;
}

// Compact single-line row for non-curated jobs
function compactRow(job: Job): string {
  return `
<tr>
  <td style="padding:5px 0;border-bottom:1px solid #1f1f23">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle">
        <a href="${job.listing_url}" style="font-size:13px;color:#a1a1aa;text-decoration:none;font-weight:500" target="_blank">${job.role_title}</a>
        <span style="color:#52525b;font-size:12px;margin-left:6px">${job.company}</span>
      </td>
      <td style="vertical-align:middle;text-align:right;white-space:nowrap;padding-left:8px">
        <span style="font-family:monospace;font-size:10px;color:#3f3f46">${job.source_name}</span>
      </td>
    </tr></table>
  </td>
</tr>`;
}

function sectionHeader(title: string, count: number, accent = '#71717a'): string {
  return `
<tr>
  <td style="padding:24px 0 10px">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="border-bottom:1px solid #3f3f46;padding-bottom:8px">
        <span style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${accent}">${title}</span>
        <span style="font-size:11px;color:#3f3f46;margin-left:8px">${count}</span>
      </td>
    </tr></table>
  </td>
</tr>`;
}

function statCell(label: string, value: number, color = '#a1a1aa'): string {
  return `
<td align="center" style="padding:0 16px">
  <div style="font-size:22px;font-weight:700;color:${color}">${value}</div>
  <div style="font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:.06em">${label}</div>
</td>`;
}

export function renderDigestHtml(jobs: Job[], weekKey: string): string {
  const curated = jobs.filter(j => j.is_filtered_in);
  const other = jobs.filter(j => !j.is_filtered_in);
  const vcCurated = curated.filter(j => !NEWSLETTER_NAMES.has(j.source_name));
  const nlCurated = curated.filter(j => NEWSLETTER_NAMES.has(j.source_name));
  const otherPreview = other.slice(0, 40);

  const runDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const vcSection = vcCurated.length === 0 ? '' : `
    ${sectionHeader('VC Board Picks', vcCurated.length, '#a78bfa')}
    ${vcCurated.map(curatedCard).join('')}`;

  const nlSection = nlCurated.length === 0 ? '' : `
    ${sectionHeader('Newsletter Picks', nlCurated.length, '#a78bfa')}
    ${nlCurated.map(curatedCard).join('')}`;

  const otherSection = otherPreview.length === 0 ? '' : `
    ${sectionHeader('All Other Listings', other.length)}
    ${otherPreview.map(compactRow).join('')}
    ${other.length > 40 ? `<tr><td style="padding:8px 0 0;font-size:12px;color:#3f3f46">…and ${other.length - 40} more</td></tr>` : ''}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Startup Jobs Digest — ${weekLabel(weekKey)}</title></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b">
<tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:10px;border:1px solid #27272a;max-width:600px;width:100%">

  <!-- Header -->
  <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #27272a">
    <div style="font-size:20px;font-weight:700;color:#fafafa">Startup Jobs Digest</div>
    <div style="font-size:13px;color:#71717a;margin-top:4px">${weekLabel(weekKey)} &middot; ${runDate}</div>
  </td></tr>

  <!-- Stats bar -->
  <tr><td style="padding:14px 32px;background:#09090b;border-bottom:1px solid #27272a">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      ${statCell('Total', jobs.length)}
      ${statCell('Curated', curated.length, '#a78bfa')}
      ${statCell('VC Boards', vcCurated.length, '#fbbf24')}
      ${statCell('Newsletters', nlCurated.length, '#34d399')}
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:4px 32px 28px">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${vcSection}
      ${nlSection}
      ${otherSection}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:18px 32px;border-top:1px solid #27272a;font-size:11px;color:#52525b;text-align:center">
    Sent by Startup Job Aggregator &middot; <a href="mailto:databelmont@gmail.com" style="color:#52525b">databelmont@gmail.com</a>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function renderDigestPlain(jobs: Job[], weekKey: string): string {
  const curated = jobs.filter(j => j.is_filtered_in);
  const other = jobs.filter(j => !j.is_filtered_in);
  const lines = [
    `STARTUP JOBS DIGEST — ${weekLabel(weekKey)}`,
    '='.repeat(50),
    `Total: ${jobs.length}  |  Curated: ${curated.length}  |  Other: ${other.length}`,
    '',
  ];
  if (curated.length > 0) {
    lines.push('★ CURATED PICKS');
    lines.push('-'.repeat(40));
    for (const j of curated) {
      lines.push(`${j.role_title} @ ${j.company}`);
      lines.push(`  Source: ${j.source_name}  |  Tags: ${(j.tags ?? []).join(', ') || 'none'}`);
      lines.push(`  ${j.listing_url}`);
      lines.push('');
    }
  }
  if (other.length > 0) {
    lines.push('ALL OTHER LISTINGS');
    lines.push('-'.repeat(40));
    for (const j of other.slice(0, 40)) {
      lines.push(`${j.role_title} @ ${j.company}  [${j.source_name}]`);
      lines.push(`  ${j.listing_url}`);
    }
    if (other.length > 40) lines.push(`…and ${other.length - 40} more`);
  }
  return lines.join('\n');
}
