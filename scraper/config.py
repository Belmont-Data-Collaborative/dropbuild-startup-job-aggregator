import os
from dotenv import load_dotenv

load_dotenv()

DEFAULT_SOURCES = [
    {"name": "a16z", "url": "https://jobs.a16z.com", "type": "vc_board"},
    {"name": "Sequoia", "url": "https://www.sequoiacap.com/jobs", "type": "vc_board"},
    {"name": "Index Ventures", "url": "https://jobs.indexventures.com", "type": "vc_board"},
    {"name": "General Catalyst", "url": "https://www.generalcatalyst.com/careers", "type": "vc_board"},
    {"name": "Khosla Ventures", "url": "https://www.khoslaventures.com/portfolio-jobs", "type": "vc_board"},
    {"name": "Greylock", "url": "https://greylock.com/careers/greylock-job-search/", "type": "vc_board"},
    {"name": "Kleiner Perkins", "url": "https://jobs.kleinerperkins.com", "type": "vc_board"},
    {"name": "Accel", "url": "https://jobs.accel.com", "type": "vc_board"},
    {"name": "Battery Ventures", "url": "https://www.battery.com/jobs/", "type": "vc_board"},
    {"name": "Lightspeed", "url": "https://jobs.lsvp.com", "type": "vc_board"},
    {"name": "Bessemer", "url": "https://www.bvp.com/portfolio/jobs", "type": "vc_board"},
    {"name": "Y Combinator", "url": "https://www.ycombinator.com/jobs", "type": "vc_board"},
    {"name": "Bitkraft", "url": "https://jobs.bitkraft.vc", "type": "vc_board"},
    {"name": "Contrary", "url": "https://jobs.contrary.com", "type": "vc_board"},
    {"name": "Pear VC", "url": "https://jobs.pear.vc", "type": "vc_board"},
    {"name": "NEA", "url": "https://jobs.nea.com", "type": "vc_board"},
    {"name": "Job Hunting Sux", "url": "https://jobhuntingsux.com/feed", "type": "newsletter"},
    {"name": "Ali Rohde Jobs", "url": "https://www.alirohdejobs.com/feed", "type": "newsletter"},
    {"name": "Next Play", "url": "https://nextplay.com/feed", "type": "newsletter"},
    {"name": "Nonlinear Techies", "url": "https://nonlineartechies.com/feed", "type": "newsletter"},
    {"name": "Beyond Bay St", "url": "https://beyondbay.st/feed", "type": "newsletter"},
    {"name": "Why You Should Join", "url": "https://whyyoushouldj.com/feed", "type": "newsletter"},
    {"name": "Web of Jobs", "url": "https://webof.jobs/feed", "type": "newsletter"},
]

DEFAULT_FILTER_CONFIG = {
    "exclude_keywords": ["intern", "entry level", "junior", "apprentice"],
    "include_role_levels": ["COO", "GM", "Chief of Staff", "VP Operations", "VP Strategy", "Director of Operations", "Head of Operations", "VP of Strategy"],
    "include_keywords": ["healthcare", "health tech", "operations", "strategy", "chief of staff"],
    "include_industries": ["healthcare", "health tech", "digital health", "medtech"],
}


def load_config(client, key: str, default):
    try:
        result = client.table('app_config').select('value').eq('key', key).limit(1).execute()
        if result.data:
            return result.data[0]['value']
        client.table('app_config').insert({'key': key, 'value': default}).execute()
        return default
    except Exception:
        return default


def save_config(client, key: str, value):
    client.table('app_config').upsert({'key': key, 'value': value}, on_conflict='key').execute()
