import os
import datetime
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client
from scrapers.vc_boards import (
    scrape_index_ventures, scrape_general_catalyst, scrape_khosla, scrape_greylock,
    scrape_kleiner_perkins, scrape_accel, scrape_battery, scrape_lightspeed,
    scrape_bessemer, scrape_ycombinator, scrape_a16z, scrape_sequoia,
    scrape_bitkraft, scrape_contrary, scrape_pear_vc, scrape_nea
)
from scrapers.newsletters import (
    scrape_job_hunting_sux, scrape_ali_rohde_jobs, scrape_next_play,
    scrape_nonlinear_techies, scrape_beyond_bay_st, scrape_why_you_should_join,
    scrape_web_of_jobs
)
from deduper import insert_listings
from filter import apply_filter
from config import load_config, DEFAULT_FILTER_CONFIG
from email_renderer import render_html, render_plain
from mailer import send_digest
import requests as req_session

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']
client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Compute current week key
now = datetime.datetime.now(datetime.timezone.utc)
year = now.isocalendar()[0]
week = now.isocalendar()[1]
week_key = f'{year}-W{week:02d}'

filter_config = load_config(client, 'filter_config', DEFAULT_FILTER_CONFIG)

session = req_session.Session()

scrapers = [
    scrape_a16z, scrape_sequoia, scrape_index_ventures, scrape_general_catalyst,
    scrape_khosla, scrape_greylock, scrape_kleiner_perkins, scrape_accel,
    scrape_battery, scrape_lightspeed, scrape_bessemer, scrape_ycombinator,
    scrape_bitkraft, scrape_contrary, scrape_pear_vc, scrape_nea,
    scrape_job_hunting_sux, scrape_ali_rohde_jobs, scrape_next_play,
    scrape_nonlinear_techies, scrape_beyond_bay_st, scrape_why_you_should_join,
    scrape_web_of_jobs,
]

all_listings = []
errors = []

for scraper_fn in scrapers:
    try:
        listings = scraper_fn(session)
        for listing in listings:
            listing['week_key'] = week_key
            listing['date_scraped'] = now.isoformat()
            listing = apply_filter(listing, filter_config)
            all_listings.append(listing)
        print(f'{scraper_fn.__name__}: {len(listings)} listings')
    except Exception as e:
        print(f'Error in {scraper_fn.__name__}: {e}')
        errors.append(str(e))

new_count, dupe_count = insert_listings(client, all_listings)

# Insert pipeline run
client.table('pipeline_runs').insert({
    'run_date': now.isoformat(),
    'total_scraped': len(all_listings),
    'new_listings': new_count,
    'duplicate_count': dupe_count,
    'filtered_count': sum(1 for l in all_listings if l.get('is_filtered_in')),
    'error_count': len(errors),
    'errors_json': errors if errors else None,
}).execute()

print(f'\nSummary: total={len(all_listings)}, new={new_count}, dupes={dupe_count}, errors={len(errors)}')

# --- Email digest ---
filtered_count = sum(1 for l in all_listings if l.get('is_filtered_in'))
new_listings_only = [l for l in all_listings if l.get('_is_new', False)]
# Fallback: use all filtered listings if _is_new not tracked
if not new_listings_only:
    new_listings_only = [l for l in all_listings if l.get('is_filtered_in')]

subject = f'Startup Jobs Digest — {week_key} ({new_count} new)'
html_body = render_html(all_listings, week_key, len(all_listings), new_count, dupe_count, filtered_count)
plain_body = render_plain(all_listings, week_key, len(all_listings), new_count, dupe_count, filtered_count)
sent = send_digest(html_body, plain_body, subject)
print(f'Email digest: {"sent" if sent else "skipped (check SMTP env vars)"}')
