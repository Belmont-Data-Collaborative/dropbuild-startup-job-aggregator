import logging
import re
import html
import datetime
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

import requests

logger = logging.getLogger(__name__)

ROLE_KEYWORDS = [
    'VP', 'Director', 'Head of', 'COO', 'CEO', 'CTO', 'CFO', 'CMO',
    'GM', 'Chief of Staff', 'Manager', 'Lead', 'Engineer', 'Analyst',
    'Coordinator', 'Operations', 'Strategy',
]


def _is_recent(pub_date_str: str, days: int = 14) -> bool:
    try:
        dt = parsedate_to_datetime(pub_date_str)
        now = datetime.datetime.now(datetime.timezone.utc)
        return (now - dt).days <= days
    except Exception:
        return True


def _extract_listings(feed_url: str, source_name: str, source_url: str) -> list:
    listings = []
    seen_titles = set()
    try:
        resp = requests.get(feed_url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; StartupJobAggregator/1.0)'
        })
        resp.raise_for_status()
        root = ET.fromstring(resp.text)

        items = root.findall('.//item')
        if not items:
            items = root.findall('.//{http://www.w3.org/2005/Atom}entry')

        for item in items:
            pub_date_el = item.find('pubDate')
            if pub_date_el is None:
                pub_date_el = item.find('{http://www.w3.org/2005/Atom}published')
            if pub_date_el is not None and pub_date_el.text:
                if not _is_recent(pub_date_el.text):
                    continue

            title_el = item.find('title')
            if title_el is None:
                title_el = item.find('{http://www.w3.org/2005/Atom}title')
            title_text = title_el.text if title_el is not None and title_el.text else ''

            desc_el = item.find('description')
            if desc_el is None:
                desc_el = item.find('{http://www.w3.org/2005/Atom}content')
            desc_text = desc_el.text if desc_el is not None and desc_el.text else ''

            combined = title_text + '\n' + desc_text
            combined = re.sub(r'<[^>]+>', '', combined)
            combined = html.unescape(combined)

            lines = [line.strip() for line in combined.split('\n') if line.strip()]

            for line in lines:
                has_keyword = any(kw.lower() in line.lower() for kw in ROLE_KEYWORDS)
                if not has_keyword:
                    continue

                dedup_key = line.lower()
                if dedup_key in seen_titles:
                    continue
                seen_titles.add(dedup_key)

                match = re.match(r'^(.+?)\s*[-\u2013\u2014:|]\s*(.+)$', line)
                if match:
                    company = match.group(1).strip()
                    role_title = match.group(2).strip()
                else:
                    company = source_name
                    role_title = line.strip()

                if not role_title or len(role_title) > 200:
                    continue

                link_el = item.find('link')
                if link_el is None:
                    link_el = item.find('{http://www.w3.org/2005/Atom}link')
                listing_url = ''
                if link_el is not None:
                    listing_url = link_el.text or link_el.get('href', '') or ''

                listings.append({
                    'company': company,
                    'role_title': role_title,
                    'listing_url': listing_url,
                    'date_posted': None,
                    'source_name': source_name,
                    'source_url': source_url,
                })

    except Exception as e:
        logger.warning(f'Newsletter scrape failed for {source_name}: {e}')

    return listings


def scrape_job_hunting_sux(session: requests.Session) -> list:
    return _extract_listings('https://jobhuntingsux.com/feed', 'Job Hunting Sux', 'https://jobhuntingsux.com/feed')


def scrape_ali_rohde_jobs(session: requests.Session) -> list:
    return _extract_listings('https://www.alirohdejobs.com/feed', 'Ali Rohde Jobs', 'https://www.alirohdejobs.com/feed')


def scrape_next_play(session: requests.Session) -> list:
    return _extract_listings('https://nextplay.com/feed', 'Next Play', 'https://nextplay.com/feed')


def scrape_nonlinear_techies(session: requests.Session) -> list:
    return _extract_listings('https://nonlineartechies.com/feed', 'Nonlinear Techies', 'https://nonlineartechies.com/feed')


def scrape_beyond_bay_st(session: requests.Session) -> list:
    return _extract_listings('https://beyondbay.st/feed', 'Beyond Bay St', 'https://beyondbay.st/feed')


def scrape_why_you_should_join(session: requests.Session) -> list:
    return _extract_listings('https://whyyoushouldj.com/feed', 'Why You Should Join', 'https://whyyoushouldj.com/feed')


def scrape_web_of_jobs(session: requests.Session) -> list:
    return _extract_listings('https://webof.jobs/feed', 'Web of Jobs', 'https://webof.jobs/feed')
