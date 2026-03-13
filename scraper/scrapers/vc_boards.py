import logging
import warnings
import concurrent.futures
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)

ATS_DOMAINS = {
    'greenhouse.io', 'lever.co', 'workday.com', 'myworkdayjobs.com',
    'ashbyhq.com', 'pinpointhq.com', 'rippling.com', 'smartrecruiters.com',
    'taleo.net', 'breezy.hr', 'jobvite.com', 'icims.com', 'bamboohr.com',
    'recruitee.com', 'workable.com', 'jazz.co', 'applytojob.com',
}


def _is_ats_link(url: str) -> bool:
    """Returns True if the URL points to a known ATS (direct application link)."""
    try:
        domain = urlparse(url).netloc.lower()
        return any(ats in domain for ats in ATS_DOMAINS)
    except Exception:
        return False


_JOB_PATH_MARKERS = ['/jobs/', '/job/', '/careers/', '/role/', '/position/', '/opening/', '/apply']


def _looks_like_job_url(url: str) -> bool:
    """Returns True if the URL points to an ATS or contains a job-like path segment."""
    return _is_ats_link(url) or any(m in url.lower() for m in _JOB_PATH_MARKERS)


def _dedup_prefer_ats(listings: list, board_domain: str) -> list:
    """For duplicate role titles, prefer direct ATS links over intermediate board links."""
    best: dict = {}
    for item in listings:
        title = item['role_title'].lower().strip()
        if title not in best:
            best[title] = item
        else:
            current_is_ats = _is_ats_link(item['listing_url'])
            existing_is_ats = _is_ats_link(best[title]['listing_url'])
            if current_is_ats and not existing_is_ats:
                best[title] = item
    return list(best.values())


def _run_playwright_sync(url: str, source_name: str, source_url: str) -> list:
    """Runs Playwright synchronously. Must be called inside a thread (not the asyncio loop)."""
    browser = None
    try:
        pw = sync_playwright().start()
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=60000, wait_until='domcontentloaded')
        try:
            page.wait_for_load_state('networkidle', timeout=25000)
        except Exception:
            pass

        js_results = page.evaluate("""(baseUrl) => {
            const seen = new Set();
            const results = [];
            const candidates = document.querySelectorAll(
                'li, tr, article, section, [class*="job"], [class*="posting"], [class*="role"], [class*="opening"]'
            );
            for (const el of candidates) {
                const link = el.querySelector('a[href]');
                if (!link) continue;
                const href = link.href || '';
                if (!href || seen.has(href)) continue;
                if (href.length < 10) continue;
                seen.add(href);
                let company = '';
                const cEl = el.querySelector(
                    '[class*="company"], [class*="org"], [class*="startup"], [class*="employer"]'
                );
                if (cEl) company = cEl.innerText.trim();
                let title = '';
                const tEl = el.querySelector(
                    '[class*="title"], [class*="role"], [class*="name"], [class*="position"], h1, h2, h3, h4, strong'
                );
                if (tEl) title = tEl.innerText.trim();
                if (!title) title = link.innerText.trim();
                if (!title || title.length < 6 || title.length > 200) continue;
                if (title === company) continue;
                // Skip obvious nav/category non-jobs
                const navWords = [
                    'about','portfolio','team','privacy','careers','services','sectors','people',
                    'contact','news','blog','jobs','apply','login','sign in','home',
                    'our team','gc wealth','worldview','percepta','news & content',
                    'the future of services','make history','make a dent in the world',
                    'make a dent in the universe','view all','see all','all openings',
                    'all jobs','learn more','read more','sign up','log in','our portfolio',
                    'portfolio companies','open roles','open positions',
                ];
                if (navWords.includes(title.toLowerCase())) continue;
                // Skip SPA loading messages
                if (title.toLowerCase().includes('enable javascript') || title.toLowerCase().includes('you need to enable')) continue;
                // Skip titles that are just location strings ("Jobs in New York") or language codes
                if (/^jobs in /i.test(title) || /^[A-Z]{2}$/.test(title)) continue;
                results.push({
                    company: company || '',
                    role_title: title,
                    listing_url: href
                });
            }
            return results;
        }""", url)

        listings = []
        for item in js_results:
            listings.append({
                'company': item['company'] or source_name,
                'role_title': item['role_title'],
                'listing_url': item['listing_url'],
                'date_posted': None,
                'source_name': source_name,
                'source_url': source_url,
            })
        board_domain = urlparse(url).netloc
        return _dedup_prefer_ats(listings, board_domain)
    except Exception as e:
        logger.warning(f'Playwright scrape failed for {source_name}: {e}')
        return []
    finally:
        if browser:
            try:
                browser.close()
            except Exception:
                pass


def _scrape_playwright(url: str, source_name: str, source_url: str) -> list:
    """Runs _run_playwright_sync in a thread to avoid asyncio event loop conflicts."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_run_playwright_sync, url, source_name, source_url)
        try:
            return future.result(timeout=120)
        except Exception as e:
            logger.warning(f'Playwright thread failed for {source_name}: {e}')
            return []


def _scrape_bs_with_fallback(url: str, source_name: str, source_url: str,
                              bs_selectors: str, session: requests.Session) -> list:
    listings = []
    try:
        resp = session.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'lxml')
        rows = soup.select(bs_selectors)
        seen = set()
        for row in rows:
            link = row.find('a', href=True)
            if not link:
                continue
            href = link.get('href', '')
            if not href or len(href) < 10:
                continue

            title_el = row.select_one(
                '[class*="title"], [class*="role"], [class*="name"], [class*="position"], h1, h2, h3, h4, strong'
            )
            title = title_el.get_text(strip=True) if title_el else link.get_text(strip=True)
            if not title or len(title) > 200:
                continue

            company_el = row.select_one(
                '[class*="company"], [class*="org"], [class*="startup"], [class*="employer"]'
            )
            company = company_el.get_text(strip=True) if company_el else source_name

            dedup_key = (company.lower(), title.lower())
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            if not href.startswith('http'):
                from urllib.parse import urljoin
                href = urljoin(url, href)

            listings.append({
                'company': company,
                'role_title': title,
                'listing_url': href,
                'date_posted': None,
                'source_name': source_name,
                'source_url': source_url,
            })
    except Exception as e:
        logger.warning(f'BS scrape failed for {source_name}: {e}')

    if not listings:
        listings = _scrape_playwright(url, source_name, source_url)

    board_domain = urlparse(url).netloc
    return _dedup_prefer_ats(listings, board_domain)


# --- Playwright-only boards ---

def scrape_index_ventures(session: requests.Session) -> list:
    return _scrape_playwright(
        'https://jobs.indexventures.com',
        'Index Ventures',
        'https://jobs.indexventures.com'
    )


def scrape_general_catalyst(session: requests.Session) -> list:
    results = _scrape_playwright(
        'https://www.generalcatalyst.com/careers',
        'General Catalyst',
        'https://www.generalcatalyst.com/careers'
    )
    # GC's careers page also links to portfolio/nav pages — keep only ATS or job-path URLs
    return [r for r in results if _looks_like_job_url(r['listing_url'])]


def scrape_khosla(session: requests.Session) -> list:
    results = _scrape_playwright(
        'https://www.khoslaventures.com/portfolio-jobs',
        'Khosla Ventures',
        'https://www.khoslaventures.com/portfolio-jobs'
    )
    # Khosla's page mixes nav links with job listings — keep only ATS or job-path URLs
    return [r for r in results if _looks_like_job_url(r['listing_url'])]


def scrape_greylock(session: requests.Session) -> list:
    return _scrape_playwright(
        'https://greylock.com/careers/greylock-job-search/',
        'Greylock',
        'https://greylock.com/careers/greylock-job-search/'
    )


def scrape_kleiner_perkins(session: requests.Session) -> list:
    return _scrape_playwright(
        'https://jobs.kleinerperkins.com',
        'Kleiner Perkins',
        'https://jobs.kleinerperkins.com'
    )


def scrape_accel(session: requests.Session) -> list:
    return _scrape_playwright(
        'https://jobs.accel.com',
        'Accel',
        'https://jobs.accel.com'
    )


def scrape_battery(session: requests.Session) -> list:
    results = _scrape_playwright(
        'https://www.battery.com/jobs/',
        'Battery Ventures',
        'https://www.battery.com/jobs/'
    )
    # Battery's job board includes category/filter pages — keep only ATS or job-path URLs
    return [r for r in results if _looks_like_job_url(r['listing_url'])]


def scrape_lightspeed(session: requests.Session) -> list:
    return _scrape_playwright(
        'https://jobs.lsvp.com',
        'Lightspeed',
        'https://jobs.lsvp.com'
    )


def scrape_bessemer(session: requests.Session) -> list:
    # bvp.com/portfolio/jobs is a React SPA that renders site navigation instead of job listings
    # with the generic Playwright scraper. Disabled until a board-specific scraper is written.
    return []


def scrape_ycombinator(session: requests.Session) -> list:
    results = _scrape_playwright(
        'https://www.ycombinator.com/jobs',
        'Y Combinator',
        'https://www.ycombinator.com/jobs'
    )
    # Filter to actual job listings only — exclude category/filter pages like "Operations Jobs"
    filtered = []
    for r in results:
        url = r['listing_url']
        title = r['role_title']
        # Must link to a specific job (not a category page) and title must not be a generic category
        if '/jobs/' not in url and '/role/' not in url:
            continue
        if title.endswith(' Jobs') or title.startswith('Remote ') and title.endswith(' Jobs'):
            continue
        filtered.append(r)
    return filtered


# --- BS + Playwright fallback boards ---

def scrape_a16z(session: requests.Session) -> list:
    return _scrape_bs_with_fallback(
        'https://jobs.a16z.com',
        'a16z',
        'https://jobs.a16z.com',
        'tr.job-listing, tr[data-job-id], table tbody tr',
        session
    )


def scrape_sequoia(session: requests.Session) -> list:
    return _scrape_bs_with_fallback(
        'https://www.sequoiacap.com/jobs',
        'Sequoia',
        'https://www.sequoiacap.com/jobs',
        'li, tr, article, [class*="job"], [class*="posting"]',
        session
    )


def scrape_bitkraft(session: requests.Session) -> list:
    return _scrape_bs_with_fallback(
        'https://jobs.bitkraft.vc',
        'Bitkraft',
        'https://jobs.bitkraft.vc',
        'li, tr, article, [class*="job"], [class*="posting"]',
        session
    )


def scrape_contrary(session: requests.Session) -> list:
    return _scrape_bs_with_fallback(
        'https://jobs.contrary.com',
        'Contrary',
        'https://jobs.contrary.com',
        'li, tr, article, [class*="job"], [class*="posting"]',
        session
    )


def scrape_pear_vc(session: requests.Session) -> list:
    return _scrape_bs_with_fallback(
        'https://jobs.pear.vc',
        'Pear VC',
        'https://jobs.pear.vc',
        'li, tr, article, [class*="job"], [class*="posting"]',
        session
    )


def scrape_nea(session: requests.Session) -> list:
    return _scrape_bs_with_fallback(
        'https://jobs.nea.com',
        'NEA',
        'https://jobs.nea.com',
        'li, tr, article, [class*="job"], [class*="posting"]',
        session
    )
