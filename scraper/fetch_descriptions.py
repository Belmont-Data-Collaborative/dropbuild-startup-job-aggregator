"""
One-time script to backfill raw_snippet for existing jobs.
Fetches each listing URL, extracts description text, updates DB.
Run: python fetch_descriptions.py
"""
import os
import re
import time
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

client = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_KEY'])

SPA_PATTERNS = [
    r'you need to enable javascript',
    r'please enable javascript',
    r'javascript is required',
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
}


def fetch_description(url: str):
    try:
        res = requests.get(url, headers=HEADERS, timeout=8)
        if not res.ok:
            return None
        html = res.text

        # Strip scripts, styles, nav, header, footer
        cleaned = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', html, flags=re.I)
        cleaned = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', cleaned, flags=re.I)
        cleaned = re.sub(r'<nav[^>]*>[\s\S]*?</nav>', '', cleaned, flags=re.I)
        cleaned = re.sub(r'<header[^>]*>[\s\S]*?</header>', '', cleaned, flags=re.I)
        cleaned = re.sub(r'<footer[^>]*>[\s\S]*?</footer>', '', cleaned, flags=re.I)

        # Try main content block
        body_match = (
            re.search(r'<main[^>]*>([\s\S]*?)</main>', cleaned, re.I) or
            re.search(r'<article[^>]*>([\s\S]*?)</article>', cleaned, re.I) or
            re.search(r'<div[^>]*(?:job|description|content|posting)[^>]*>([\s\S]*?)</div>', cleaned, re.I) or
            re.search(r'<body[^>]*>([\s\S]*?)</body>', cleaned, re.I)
        )
        raw = body_match.group(1) if body_match else cleaned

        text = re.sub(r'<[^>]+>', ' ', raw)
        text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>') \
                   .replace('&quot;', '"').replace('&#39;', "'").replace('&nbsp;', ' ')
        text = re.sub(r'\s{3,}', '\n\n', text).strip()
        text = text[:4000]

        if len(text) < 200:
            return None
        for pat in SPA_PATTERNS:
            if re.search(pat, text, re.I):
                return None

        return text
    except Exception:
        return None


# Fetch all jobs with null raw_snippet
response = client.table('jobs').select('id,role_title,company,listing_url').is_('raw_snippet', 'null').execute()
jobs = response.data
print(f'Jobs to process: {len(jobs)}')

updated = 0
skipped = 0
failed = 0

for i, job in enumerate(jobs):
    print(f'[{i+1}/{len(jobs)}] {job["company"]} — {job["role_title"][:50]}', end=' ... ')
    desc = fetch_description(job['listing_url'])
    if desc:
        client.table('jobs').update({'raw_snippet': desc}).eq('id', job['id']).execute()
        print('✓')
        updated += 1
    else:
        print('skip')
        skipped += 1
    time.sleep(0.3)  # be polite

print(f'\nDone. Updated: {updated}, Skipped: {skipped}, Failed: {failed}')
