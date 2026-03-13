import re as _re


def _kw_matches(kw: str, text: str) -> bool:
    """Case-insensitive match. Short keywords (<=4 chars) require word boundary to avoid substrings."""
    kw_lower = kw.lower()
    if len(kw_lower) <= 4:
        return bool(_re.search(r'(?<![a-z])' + _re.escape(kw_lower) + r'(?![a-z])', text))
    return kw_lower in text


def apply_filter(listing: dict, filter_config: dict) -> dict:
    role_lower = listing.get('role_title', '').lower()
    company_lower = listing.get('company', '').lower()

    for kw in filter_config.get('exclude_keywords', []):
        if _kw_matches(kw, role_lower) or _kw_matches(kw, company_lower):
            listing['is_filtered_in'] = False
            listing['tags'] = []
            return listing

    matched_tags = []
    all_include = (
        filter_config.get('include_role_levels', [])
        + filter_config.get('include_keywords', [])
        + filter_config.get('include_industries', [])
    )
    for kw in all_include:
        if _kw_matches(kw, role_lower) or _kw_matches(kw, company_lower):
            matched_tags.append(kw)

    if matched_tags:
        listing['is_filtered_in'] = True
        listing['tags'] = matched_tags
    else:
        listing['is_filtered_in'] = False
        listing['tags'] = []

    return listing
