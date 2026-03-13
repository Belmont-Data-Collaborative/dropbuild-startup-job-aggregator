import { NextRequest, NextResponse } from 'next/server';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/json',
};

// ── Lever ────────────────────────────────────────────────────────────────────
// URL: https://jobs.lever.co/<company>/<uuid>
async function fetchLever(url: string): Promise<string | null> {
  const match = url.match(/jobs\.lever\.co\/([^/]+)\/([a-f0-9-]+)/i);
  if (!match) return null;
  const [, company, jobId] = match;
  const res = await fetch(
    `https://api.lever.co/v0/postings/${company}/${jobId}`,
    { headers: HEADERS, signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return null;
  const data = await res.json() as {
    text?: string;
    categories?: { team?: string; location?: string; commitment?: string };
    descriptionPlain?: string;
    listsText?: string;
    additionalPlain?: string;
  };
  const parts: string[] = [];
  if (data.categories?.team) parts.push(`Team: ${data.categories.team}`);
  if (data.categories?.location) parts.push(`Location: ${data.categories.location}`);
  if (data.categories?.commitment) parts.push(`Type: ${data.categories.commitment}`);
  if (parts.length) parts.push('');
  if (data.descriptionPlain) parts.push(data.descriptionPlain.trim());
  if (data.listsText) parts.push(data.listsText.trim());
  if (data.additionalPlain) parts.push(data.additionalPlain.trim());
  return parts.join('\n').trim() || null;
}

// ── Greenhouse ───────────────────────────────────────────────────────────────
// URLs:
//   https://boards.greenhouse.io/<company>/jobs/<id>
//   https://job-boards.greenhouse.io/<company>/jobs/<id>
async function fetchGreenhouse(url: string): Promise<string | null> {
  const match = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i);
  if (!match) return null;
  const [, company, jobId] = match;
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${jobId}`,
    { headers: HEADERS, signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return null;
  const data = await res.json() as {
    title?: string;
    location?: { name?: string };
    departments?: { name?: string }[];
    content?: string;
    metadata?: { name?: string; value?: string | string[] }[];
  };
  const parts: string[] = [];
  if (data.location?.name) parts.push(`Location: ${data.location.name}`);
  if (data.departments?.[0]?.name) parts.push(`Department: ${data.departments[0].name}`);
  if (parts.length) parts.push('');
  if (data.content) {
    // Greenhouse sometimes double-encodes HTML — decode entities first, then strip tags
    const decoded = data.content
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    const text = decoded
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{3,}/g, '\n\n').trim();
    parts.push(text);
  }
  return parts.join('\n').trim() || null;
}

// ── Ashby ─────────────────────────────────────────────────────────────────────
// URL: https://jobs.ashbyhq.com/<company>/<uuid>
async function fetchAshby(url: string): Promise<string | null> {
  const match = url.match(/jobs\.ashbyhq\.com\/([^/]+)\/([a-f0-9-]+)/i);
  if (!match) return null;
  const [, , jobId] = match;
  const res = await fetch(
    `https://api.ashbyhq.com/posting-api/job-posting/${jobId}`,
    { headers: HEADERS, signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return null;
  const data = await res.json() as {
    job?: {
      title?: string;
      team?: string;
      locationName?: string;
      employmentType?: string;
      descriptionHtml?: string;
      descriptionPlain?: string;
    };
    isListed?: boolean;
  };
  const job = data.job;
  if (!job) return null;
  const parts: string[] = [];
  if (job.team) parts.push(`Team: ${job.team}`);
  if (job.locationName) parts.push(`Location: ${job.locationName}`);
  if (job.employmentType) parts.push(`Type: ${job.employmentType}`);
  if (parts.length) parts.push('');
  if (job.descriptionPlain) {
    parts.push(job.descriptionPlain.trim());
  } else if (job.descriptionHtml) {
    const text = job.descriptionHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/\s{3,}/g, '\n\n').trim();
    parts.push(text);
  }
  return parts.join('\n').trim() || null;
}

// ── Generic HTML fallback ─────────────────────────────────────────────────────
async function fetchHtml(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const html = await res.text();

  // Try JSON-LD first
  const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]) as {
        description?: string;
        employmentType?: string;
        jobLocation?: { address?: { addressLocality?: string; addressRegion?: string } };
      };
      if (parsed.description) {
        const text = parsed.description
          .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
          .replace(/\s{3,}/g, '\n\n').trim();
        const meta: string[] = [];
        if (parsed.employmentType) meta.push(`Type: ${parsed.employmentType}`);
        const loc = parsed.jobLocation?.address;
        if (loc) meta.push(`Location: ${[loc.addressLocality, loc.addressRegion].filter(Boolean).join(', ')}`);
        return [...meta, meta.length ? '' : '', text].join('\n').trim();
      }
    } catch { /* ignore */ }
  }

  // Try og:description
  const ogMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
  if (ogMatch) return ogMatch[1].trim();

  // Strip and extract body text
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  const bodyMatch =
    cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ??
    cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ??
    cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  const raw = bodyMatch ? bodyMatch[1] : cleaned;
  const text = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s{3,}/g, '\n\n').trim();

  if (text.length < 100) return null;
  return text.slice(0, 4000);
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  try {
    // Try ATS-specific APIs first (best quality)
    const text =
      (await fetchLever(url)) ??
      (await fetchGreenhouse(url)) ??
      (await fetchAshby(url)) ??
      (await fetchHtml(url));

    if (!text) {
      return NextResponse.json({ error: 'No content found' }, { status: 422 });
    }

    return NextResponse.json({ text: text.slice(0, 4000) });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 502 });
  }
}
