"""
Core scraping logic for the meeting minutes scanner.

Strategy:
  1. For each city, search DuckDuckGo for council meeting minutes.
  2. Filter results by URL patterns (minutes, agenda, meeting, council, etc.).
  3. Fetch each URL — parse HTML with BeautifulSoup, PDFs with PyPDF2.
  4. Search text for keyword regex matches.
  5. Extract ~120-char context snippets on each side of the match.
  6. Deduplicate: one result per keyword per URL.
  7. Rate limit: 1.5s between requests.
  8. Cap: 15 URLs per city.
"""

import re
import time
import logging
from datetime import datetime
from io import BytesIO

import requests
from bs4 import BeautifulSoup

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

from django.utils import timezone

from .models import ScanJob, ScanResult

logger = logging.getLogger(__name__)

# Keywords grouped for regex matching
KEYWORDS = [
    'vac-truck', 'vac truck', 'vacuum truck',
    'garbage truck', 'garbage collection',
    'refuse', 'refuse collection', 'refuse truck',
    'recycle', 'recycling', 'recycling truck',
    'sweeper', 'street sweeper', 'road sweeper',
    'solid waste', 'roll-off', 'sanitation vehicle', 'waste collection',
]

# Compile a single regex with all keywords (case-insensitive)
KEYWORD_PATTERN = re.compile(
    r'(' + '|'.join(re.escape(kw) for kw in KEYWORDS) + r')',
    re.IGNORECASE,
)

# URL path patterns that indicate meeting minutes / agendas
URL_FILTERS = re.compile(
    r'(minute|agenda|meeting|council|packet|proceeding)',
    re.IGNORECASE,
)

# Date patterns to extract meeting dates from text
DATE_PATTERNS = [
    re.compile(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}', re.IGNORECASE),
    re.compile(r'\d{1,2}/\d{1,2}/\d{4}'),
    re.compile(r'\d{4}-\d{2}-\d{2}'),
]

MAX_URLS_PER_CITY = 15
REQUEST_DELAY = 1.5  # seconds between requests
REQUEST_TIMEOUT = 15  # seconds per request

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}


def _extract_meeting_date(text: str):
    """Best-effort extraction of a meeting date from surrounding text."""
    for pattern in DATE_PATTERNS:
        match = pattern.search(text)
        if match:
            raw = match.group(0)
            for fmt in ('%B %d, %Y', '%B %d %Y', '%m/%d/%Y', '%Y-%m-%d'):
                try:
                    return datetime.strptime(raw, fmt).date()
                except ValueError:
                    continue
    return None


def _make_snippet(text: str, match_start: int, match_end: int, context: int = 120) -> str:
    """Extract a snippet with context around a keyword match."""
    start = max(0, match_start - context)
    end = min(len(text), match_end + context)
    snippet = text[start:end].strip()
    # Clean up whitespace
    snippet = re.sub(r'\s+', ' ', snippet)
    if start > 0:
        snippet = '...' + snippet
    if end < len(text):
        snippet = snippet + '...'
    return snippet[:300]  # model field max


def _fetch_html_text(url: str) -> tuple[str, str]:
    """Fetch a URL and return (text_content, page_title)."""
    resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.content, 'html.parser')
    title = soup.title.string.strip() if soup.title and soup.title.string else ''
    # Remove scripts and styles
    for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
        tag.decompose()
    text = soup.get_text(separator=' ', strip=True)
    return text, title


def _fetch_pdf_text(url: str) -> tuple[str, str]:
    """Fetch a PDF and return (text_content, filename_as_title)."""
    if PdfReader is None:
        return '', ''
    resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    reader = PdfReader(BytesIO(resp.content))
    pages = []
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            pages.append(extracted)
    text = '\n'.join(pages)
    # Use the last segment of the URL as the title
    title = url.rsplit('/', 1)[-1][:200]
    return text, title


def _search_ddg(query: str, max_results: int = 20) -> list[dict]:
    """Search DuckDuckGo and return list of {title, href, body}."""
    if DDGS is None:
        logger.warning('duckduckgo-search not installed, returning empty results')
        return []
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        return results
    except Exception as e:
        logger.error(f'DuckDuckGo search failed: {e}')
        return []


def run_scan(job: ScanJob, cities: list[dict]):
    """
    Main scan function — runs in a background thread.

    Args:
        job: ScanJob instance (status=running)
        cities: list of {"city": "Davenport", "state": "IA"}
    """
    try:
        total_results = 0
        cities_scanned = 0

        for city_info in cities:
            city = city_info['city']
            state = city_info['state']
            query = f'"{city}" "{state}" city council meeting minutes'

            logger.info(f'Scanning: {query}')
            search_results = _search_ddg(query)

            # Filter by URL patterns
            filtered = [
                r for r in search_results
                if URL_FILTERS.search(r.get('href', ''))
            ][:MAX_URLS_PER_CITY]

            seen_url_keyword = set()

            for result in filtered:
                url = result.get('href', '')
                if not url:
                    continue

                time.sleep(REQUEST_DELAY)

                try:
                    is_pdf = url.lower().endswith('.pdf')
                    doc_type = 'pdf' if is_pdf else 'html'

                    if is_pdf:
                        text, title = _fetch_pdf_text(url)
                    else:
                        text, title = _fetch_html_text(url)

                    if not text:
                        continue

                    # Use search result title as fallback
                    if not title:
                        title = result.get('title', '')[:300]

                    # Find keyword matches
                    for match in KEYWORD_PATTERN.finditer(text):
                        keyword = match.group(0).lower()
                        dedup_key = (url, keyword)
                        if dedup_key in seen_url_keyword:
                            continue
                        seen_url_keyword.add(dedup_key)

                        snippet = _make_snippet(text, match.start(), match.end())
                        meeting_date = _extract_meeting_date(
                            text[max(0, match.start() - 500):match.end() + 500]
                        )

                        ScanResult.objects.create(
                            scan_job=job,
                            city=city,
                            state=state,
                            keyword=keyword,
                            snippet=snippet,
                            source_url=url,
                            page_title=title,
                            meeting_date=meeting_date,
                            document_type=doc_type,
                        )
                        total_results += 1

                except requests.RequestException as e:
                    logger.warning(f'Failed to fetch {url}: {e}')
                except Exception as e:
                    logger.error(f'Error processing {url}: {e}')

            cities_scanned += 1
            job.cities_scanned = cities_scanned
            job.total_results = total_results
            job.save(update_fields=['cities_scanned', 'total_results'])

        job.status = 'completed'
        job.completed_at = timezone.now()
        job.total_results = total_results
        job.save(update_fields=['status', 'completed_at', 'total_results'])
        logger.info(f'Scan job #{job.pk} completed: {total_results} results from {cities_scanned} cities')

    except Exception as e:
        logger.error(f'Scan job #{job.pk} failed: {e}')
        job.status = 'failed'
        job.error_message = str(e)[:500]
        job.completed_at = timezone.now()
        job.save(update_fields=['status', 'error_message', 'completed_at'])
