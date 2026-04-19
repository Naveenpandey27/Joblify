"""
Job Search Service — DuckDuckGo-powered (free, no API key needed)
Uses duckduckgo_search library to find job listings from major job boards.
Results are cached in-memory (3-hour TTL) to avoid hammering the search engine.
"""
import hashlib
import time
import re
from typing import Optional

try:
    from duckduckgo_search import DDGS
    DDG_AVAILABLE = True
except ImportError:
    DDG_AVAILABLE = False

# ---------------------------------------------------------------------------
# In-memory cache: {cache_key: {"jobs": [...], "timestamp": float}}
# ---------------------------------------------------------------------------
_job_cache: dict = {}
CACHE_TTL = 3 * 60 * 60  # 3 hours
JOBS_PER_PAGE = 12

COUNTRY_MAP = {
    "us": "United States",
    "gb": "United Kingdom",
    "ca": "Canada",
    "au": "Australia",
    "in": "India",
    "de": "Germany",
    "fr": "France",
    "sg": "Singapore",
    "ae": "UAE",
    "nl": "Netherlands",
    "pk": "Pakistan",
    "nz": "New Zealand",
}

# Job board domains to filter results
JOB_SITE_FILTER = (
    "site:linkedin.com OR site:indeed.com OR site:glassdoor.com "
    "OR site:wellfound.com OR site:remoteok.com OR site:weworkremotely.com "
    "OR site:jobs.lever.co OR site:greenhouse.io"
)


def _make_cache_key(query: str, country: str, work_type: str) -> str:
    raw = f"{query.lower().strip()}|{country.lower()}|{work_type.lower()}"
    return hashlib.md5(raw.encode()).hexdigest()


def _parse_ddg_result(result: dict, work_type: str, country: str) -> Optional[dict]:
    """Parse a raw DuckDuckGo text result into a structured job dict."""
    title_raw = result.get("title", "").strip()
    body = result.get("body", "").strip()
    url = result.get("href", "").strip()

    if not title_raw or not url:
        return None

    job_title = title_raw
    company = "Unknown Company"

    # --- Parse job title & company from the page title ---
    # Pattern 1: "Job Title - Company | Site"
    if " - " in title_raw:
        parts = title_raw.split(" - ", 1)
        job_title = parts[0].strip()
        company_raw = parts[1]
        if "|" in company_raw:
            company = company_raw.split("|")[0].strip()
        else:
            company = company_raw.strip()

    # Pattern 2: "Job Title at Company - Site"
    elif re.search(r" at ", title_raw, re.IGNORECASE):
        parts = re.split(r" at ", title_raw, 1, re.IGNORECASE)
        job_title = parts[0].strip()
        company_raw = parts[1]
        company = re.split(r"[|\-]", company_raw)[0].strip()

    # Pattern 3: "Job Title | Company | Site"
    elif title_raw.count("|") >= 2:
        parts = title_raw.split("|")
        job_title = parts[0].strip()
        company = parts[1].strip()

    # Strip site names from company
    for site_suffix in [
        "LinkedIn", "Indeed", "Glassdoor", "Wellfound", "AngelList",
        "RemoteOK", "We Work Remotely", "Lever", "Greenhouse",
    ]:
        company = company.replace(site_suffix, "").strip(" |-")

    if not company or len(company) < 2:
        company = "Unknown Company"

    # --- Detect work type ---
    body_lower = (body + " " + title_raw).lower()
    detected_work_type = work_type if work_type else "On-site"
    if "remote" in body_lower:
        detected_work_type = "Remote"
    elif "hybrid" in body_lower:
        detected_work_type = "Hybrid"

    # --- Detect location ---
    country_name = COUNTRY_MAP.get(country.lower(), "")
    location = country_name if country_name else "See job posting"

    # Try to extract a more specific location from the body
    loc_match = re.search(
        r"\b([A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|[A-Za-z]+))\b", body
    )
    if loc_match:
        location = loc_match.group(1).strip()

    if detected_work_type == "Remote":
        location = "Remote"

    # Generate a stable ID from the URL
    job_id = hashlib.md5(url.encode()).hexdigest()[:16]

    # Trim description for card display
    description = body[:400] + ("..." if len(body) > 400 else "")

    return {
        "id": job_id,
        "title": job_title[:120],
        "company": company[:100],
        "location": location,
        "work_type": detected_work_type,
        "description": description,
        "url": url,
    }


def _fetch_fresh_jobs(query: str, country: str, work_type: str) -> list:
    """Fetch jobs from DuckDuckGo and return a list of parsed job dicts."""
    if not DDG_AVAILABLE:
        return _get_mock_jobs(query, work_type)

    country_name = COUNTRY_MAP.get(country.lower(), "")

    # Build the search string
    search_parts = [f'"{query}"', "job", "hiring", "2024 OR 2025"]
    if work_type and work_type.lower() not in ("all", ""):
        search_parts.append(work_type)
    if country_name:
        search_parts.append(country_name)

    keyword_query = " ".join(search_parts)
    full_query = f"({keyword_query}) ({JOB_SITE_FILTER})"

    jobs = []
    try:
        with DDGS() as ddgs:
            raw_results = ddgs.text(full_query, max_results=48)
            for r in (raw_results or []):
                parsed = _parse_ddg_result(r, work_type, country)
                if parsed:
                    jobs.append(parsed)
    except Exception as exc:
        print(f"[job_search] DuckDuckGo error: {exc}")
        # Fall back to mock data so the UI doesn't break
        jobs = _get_mock_jobs(query, work_type)

    # If DDG returned very few results, pad with mocks
    if len(jobs) < 6:
        jobs += _get_mock_jobs(query, work_type)[: max(0, 12 - len(jobs))]

    return jobs


def _paginate(jobs: list, page: int) -> dict:
    total = len(jobs)
    start = (page - 1) * JOBS_PER_PAGE
    end = start + JOBS_PER_PAGE
    total_pages = max(1, (total + JOBS_PER_PAGE - 1) // JOBS_PER_PAGE)
    return {
        "jobs": jobs[start:end],
        "total": total,
        "page": page,
        "per_page": JOBS_PER_PAGE,
        "total_pages": total_pages,
    }


def search_jobs(query: str, country: str = "us", work_type: str = "", page: int = 1) -> dict:
    """Public API: search jobs and return paginated results."""
    cache_key = _make_cache_key(query, country, work_type)
    now = time.time()

    # Return cached results if still fresh
    cached = _job_cache.get(cache_key)
    if cached and (now - cached["timestamp"]) < CACHE_TTL:
        return _paginate(cached["jobs"], page)

    # Fetch fresh and store in cache
    jobs = _fetch_fresh_jobs(query, country, work_type)
    _job_cache[cache_key] = {"jobs": jobs, "timestamp": now}

    return _paginate(jobs, page)


def get_job_by_id(job_id: str) -> Optional[dict]:
    """Look up a single job from any cached result set."""
    for cached in _job_cache.values():
        for job in cached["jobs"]:
            if job["id"] == job_id:
                return job
    return None


# ---------------------------------------------------------------------------
# Fallback mock data (used when DDG is unavailable or returns no results)
# ---------------------------------------------------------------------------
_MOCK_COMPANIES = ["TechCorp", "DataSystems Inc.", "CloudInc", "AI Startup", "ByteForce", "Nexgen Labs"]
_MOCK_LOCATIONS = ["New York, US", "London, UK", "Remote", "San Francisco, US", "Toronto, CA", "Sydney, AU"]
_MOCK_TYPES = ["Remote", "On-site", "Hybrid"]
_MOCK_LOREM = (
    "We are looking for a talented professional to join our growing team. "
    "You will work on exciting projects and collaborate with world-class engineers. "
    "Strong communication skills and a passion for technology are required."
)


def _get_mock_jobs(query: str, work_type: str) -> list:
    return [
        {
            "id": f"mock_{i:04d}",
            "title": f"{'Senior ' if i % 3 == 0 else ''}{query} {'Engineer' if i % 2 == 0 else 'Developer'}",
            "company": _MOCK_COMPANIES[i % len(_MOCK_COMPANIES)],
            "location": _MOCK_LOCATIONS[i % len(_MOCK_LOCATIONS)],
            "work_type": work_type if work_type else _MOCK_TYPES[i % 3],
            "description": _MOCK_LOREM,
            "url": "https://example.com/jobs/demo",
        }
        for i in range(12)
    ]
