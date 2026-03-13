"""Renders the weekly job digest as clean HTML and plain-text."""
import datetime


def _source_badge(source_name: str) -> str:
    return (
        f'<span style="display:inline-block;font-family:monospace;font-size:11px;'
        f'background:#27272a;color:#a1a1aa;padding:1px 6px;border-radius:4px;'
        f'white-space:nowrap">{source_name}</span>'
    )


def _job_row(listing: dict) -> str:
    role = listing.get('role_title', '')
    company = listing.get('company', '')
    url = listing.get('listing_url', '#')
    source = listing.get('source_name', '')
    tags = listing.get('tags') or []
    tag_html = ''
    if tags:
        pills = ''.join(
            f'<span style="display:inline-block;font-size:11px;background:#3f3f46;'
            f'color:#d4d4d8;padding:1px 7px;border-radius:999px;margin-right:4px">'
            f'{t}</span>'
            for t in tags[:4]
        )
        tag_html = f'<div style="margin-top:3px">{pills}</div>'

    return f'''
<tr>
  <td style="padding:10px 0;border-bottom:1px solid #27272a;vertical-align:top">
    <a href="{url}" style="font-size:14px;font-weight:600;color:#a78bfa;text-decoration:none"
       target="_blank">{role}</a>
    <span style="color:#71717a;font-size:13px;margin-left:8px">{company}</span>
    <div style="margin-top:4px">{_source_badge(source)}{tag_html}</div>
  </td>
</tr>'''


def _section(title: str, listings: list) -> str:
    if not listings:
        return ''
    rows = ''.join(_job_row(l) for l in listings)
    return f'''
<tr>
  <td style="padding:20px 0 6px">
    <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                color:#71717a;border-bottom:1px solid #3f3f46;padding-bottom:6px">{title}</div>
  </td>
</tr>
{rows}'''


def render_html(
    new_listings: list,
    week_key: str,
    total_scraped: int,
    new_count: int,
    dupe_count: int,
    filtered_count: int,
) -> str:
    """Return a complete HTML email for the weekly digest."""
    curated = [l for l in new_listings if l.get('is_filtered_in')]
    other = [l for l in new_listings if not l.get('is_filtered_in')]

    # Split curated by source type
    vc_curated = [l for l in curated if l.get('source_name') not in _NEWSLETTER_NAMES]
    nl_curated = [l for l in curated if l.get('source_name') in _NEWSLETTER_NAMES]

    curated_section = ''
    if vc_curated:
        curated_section += _section('VC Board Picks', vc_curated)
    if nl_curated:
        curated_section += _section('Newsletter Picks', nl_curated)

    other_preview = other[:30]  # cap non-curated at 30
    other_section = _section('All Other New Listings', other_preview) if other_preview else ''
    more_note = ''
    if len(other) > 30:
        more_note = (
            f'<tr><td style="padding:8px 0;color:#71717a;font-size:12px">'
            f'…and {len(other) - 30} more. '
            f'<a href="https://gdqfekecdtkiwwmyjwfz.supabase.co" style="color:#a78bfa">View all →</a>'
            f'</td></tr>'
        )

    run_date = datetime.datetime.now().strftime('%B %d, %Y')
    week_label = _week_label(week_key)

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Startup Jobs Digest — {week_label}</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b">
<tr><td align="center" style="padding:32px 16px">

  <table width="600" cellpadding="0" cellspacing="0"
         style="background:#18181b;border-radius:10px;border:1px solid #27272a;max-width:600px;width:100%">

    <!-- Header -->
    <tr>
      <td style="padding:28px 32px 20px;border-bottom:1px solid #27272a">
        <div style="font-size:20px;font-weight:700;color:#fafafa">Startup Jobs Digest</div>
        <div style="font-size:13px;color:#71717a;margin-top:4px">{week_label} &middot; {run_date}</div>
      </td>
    </tr>

    <!-- Stats bar -->
    <tr>
      <td style="padding:14px 32px;background:#09090b;border-bottom:1px solid #27272a">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            {_stat('Scraped', total_scraped)}
            {_stat('New', new_count, '#a78bfa')}
            {_stat('Curated', filtered_count, '#fbbf24')}
            {_stat('Dupes skipped', dupe_count)}
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:8px 32px 24px">
        <table width="100%" cellpadding="0" cellspacing="0">
          {curated_section}
          {other_section}
          {more_note}
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:18px 32px;border-top:1px solid #27272a;font-size:11px;color:#52525b;text-align:center">
        Sent by the Startup Job Aggregator pipeline &middot;
        <a href="mailto:databelmont@gmail.com" style="color:#52525b">databelmont@gmail.com</a>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>'''
    return html


def render_plain(
    new_listings: list,
    week_key: str,
    total_scraped: int,
    new_count: int,
    dupe_count: int,
    filtered_count: int,
) -> str:
    """Return a plain-text fallback for the digest."""
    week_label = _week_label(week_key)
    lines = [
        f'STARTUP JOBS DIGEST — {week_label}',
        '=' * 50,
        f'Scraped: {total_scraped}  |  New: {new_count}  |  Curated: {filtered_count}  |  Dupes: {dupe_count}',
        '',
    ]
    curated = [l for l in new_listings if l.get('is_filtered_in')]
    if curated:
        lines.append('--- CURATED PICKS ---')
        for l in curated:
            lines.append(f"[{l.get('source_name','')}] {l.get('role_title','')} @ {l.get('company','')}")
            lines.append(f"  {l.get('listing_url','')}")
        lines.append('')
    other = [l for l in new_listings if not l.get('is_filtered_in')][:30]
    if other:
        lines.append('--- OTHER NEW LISTINGS ---')
        for l in other:
            lines.append(f"[{l.get('source_name','')}] {l.get('role_title','')} @ {l.get('company','')}")
            lines.append(f"  {l.get('listing_url','')}")
    return '\n'.join(lines)


# --- helpers ---

_NEWSLETTER_NAMES = {
    'Job Hunting Sux', 'Ali Rohde Jobs', 'Next Play',
    'Nonlinear Techies', 'Beyond Bay St', 'Why You Should Join', 'Web of Jobs',
}


def _stat(label: str, value: int, color: str = '#a1a1aa') -> str:
    return (
        f'<td align="center" style="padding:0 12px">'
        f'<div style="font-size:20px;font-weight:700;color:{color}">{value}</div>'
        f'<div style="font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:.06em">{label}</div>'
        f'</td>'
    )


def _week_label(week_key: str) -> str:
    """'2026-W11' → 'Week of Mar 9, 2026'"""
    try:
        year, w = week_key.split('-W')
        year, w = int(year), int(w)
        jan4 = datetime.date(year, 1, 4)
        monday_w1 = jan4 - datetime.timedelta(days=jan4.weekday())
        monday = monday_w1 + datetime.timedelta(weeks=w - 1)
        return 'Week of ' + monday.strftime('%b %-d, %Y')
    except Exception:
        return week_key
