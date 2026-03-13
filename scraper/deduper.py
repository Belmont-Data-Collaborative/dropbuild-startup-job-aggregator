import hashlib
import urllib.parse
from datetime import datetime, timedelta, timezone


def normalize_url(url: str) -> str:
    url = url.lower()
    parsed = urllib.parse.urlparse(url)
    return urllib.parse.urlunparse(parsed._replace(query='', fragment=''))


def compute_hash(url: str) -> str:
    return hashlib.sha256(normalize_url(url).encode()).hexdigest()


def is_duplicate(client, url_hash: str) -> bool:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=28)).isoformat()
    result = client.table('jobs').select('id').eq('url_hash', url_hash).gte('date_scraped', cutoff).limit(1).execute()
    return bool(result.data)


def insert_listings(client, listings: list) -> tuple:
    new_count = 0
    dupe_count = 0
    for listing in listings:
        url_hash = compute_hash(listing.get('listing_url', ''))
        if is_duplicate(client, url_hash):
            dupe_count += 1
            continue
        listing['url_hash'] = url_hash
        try:
            client.table('jobs').upsert(listing, on_conflict='url_hash,week_key').execute()
            new_count += 1
        except Exception as e:
            print(f'Warning: failed to insert listing: {e}')
    return (new_count, dupe_count)
