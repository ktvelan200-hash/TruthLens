"""
TruthLens – NewsAPI Service
Wraps the NewsAPI v2 HTTP calls with error handling and response normalization.
The API key is read from the environment and never exposed to the client.
"""

import logging
from typing import Optional

import httpx

from app.config import get_settings
from app.schemas.news import NewsArticle, NewsSearchResponse

logger = logging.getLogger(__name__)
settings = get_settings()

# Supported NewsAPI categories
VALID_CATEGORIES = {
    "business", "entertainment", "general",
    "health", "science", "sports", "technology",
}

# Supported two-letter country codes (subset of NewsAPI's support)
VALID_COUNTRIES = {
    "us", "gb", "in", "au", "ca", "de", "fr", "jp",
    "br", "mx", "za", "ng", "sg", "nz", "ie",
}


class NewsAPIError(Exception):
    """Raised when the NewsAPI returns an error response."""
    def __init__(self, status: str, message: str, http_code: int = 500):
        super().__init__(message)
        self.status = status
        self.message = message
        self.http_code = http_code


def _normalize_article(raw: dict) -> Optional[NewsArticle]:
    """Convert a raw NewsAPI article dict to a NewsArticle schema."""
    title = (raw.get("title") or "").strip()
    if not title or title == "[Removed]":
        return None

    source = raw.get("source") or {}
    return NewsArticle(
        title=title,
        description=raw.get("description") or "",
        content=raw.get("content") or "",
        url=raw.get("url") or "",
        url_to_image=raw.get("urlToImage") or "",
        source_name=source.get("name") or "Unknown",
        author=raw.get("author") or "",
        published_at=raw.get("publishedAt") or "",
    )


async def fetch_top_headlines(
    q: Optional[str] = None,
    category: Optional[str] = None,
    country: str = "us",
    page: int = 1,
    page_size: int = 20,
) -> NewsSearchResponse:
    """Fetch top headlines from NewsAPI /top-headlines."""
    if not settings.news_api_key:
        raise NewsAPIError(
            "missingApiKey",
            "NewsAPI key is not configured. Set NEWS_API_KEY in .env",
            http_code=503,
        )

    # Sanitize inputs
    country  = country  if country  in VALID_COUNTRIES   else "us"
    category = category if category in VALID_CATEGORIES  else None
    page_size = min(max(page_size, 1), 100)
    page      = max(page, 1)

    params: dict = {
        "apiKey":   settings.news_api_key,
        "country":  country,
        "page":     page,
        "pageSize": page_size,
    }
    if q:
        params["q"] = q[:500]       # NewsAPI max query length
    if category:
        params["category"] = category

    return await _call_newsapi("/top-headlines", params, page, page_size)


async def search_news(
    q: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    sort_by: str = "publishedAt",
    page: int = 1,
    page_size: int = 20,
) -> NewsSearchResponse:
    """Full-text search via NewsAPI /everything."""
    if not settings.news_api_key:
        raise NewsAPIError(
            "missingApiKey",
            "NewsAPI key is not configured. Set NEWS_API_KEY in .env",
            http_code=503,
        )

    if not q or not q.strip():
        raise NewsAPIError("invalidQuery", "Search query cannot be empty", http_code=400)

    page_size = min(max(page_size, 1), 100)
    page      = max(page, 1)

    params: dict = {
        "apiKey":   settings.news_api_key,
        "q":        q.strip()[:500],
        "sortBy":   sort_by if sort_by in ("relevancy", "popularity", "publishedAt") else "publishedAt",
        "page":     page,
        "pageSize": page_size,
        "language": "en",
    }
    if from_date:
        params["from"] = from_date
    if to_date:
        params["to"] = to_date

    return await _call_newsapi("/everything", params, page, page_size)


async def _call_newsapi(
    endpoint: str,
    params: dict,
    page: int,
    page_size: int,
) -> NewsSearchResponse:
    """Internal helper: make the HTTP request and parse the response."""
    url = settings.news_api_base_url + endpoint

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params)
        except httpx.TimeoutException:
            raise NewsAPIError("timeout", "NewsAPI request timed out", http_code=504)
        except httpx.RequestError as exc:
            raise NewsAPIError("networkError", f"Network error: {exc}", http_code=502)

    if resp.status_code == 401:
        raise NewsAPIError("unauthorized", "Invalid NewsAPI key", http_code=401)
    if resp.status_code == 429:
        raise NewsAPIError("rateLimited", "NewsAPI rate limit exceeded. Try again later.", http_code=429)

    try:
        data = resp.json()
    except Exception:
        raise NewsAPIError("parseError", "Could not parse NewsAPI response", http_code=500)

    if data.get("status") != "ok":
        code    = data.get("code", "unknownError")
        message = data.get("message", "Unknown NewsAPI error")
        logger.warning("NewsAPI error: %s – %s", code, message)
        raise NewsAPIError(code, message, http_code=400)

    raw_articles = data.get("articles") or []
    articles = [_normalize_article(a) for a in raw_articles]
    articles = [a for a in articles if a is not None]

    return NewsSearchResponse(
        articles=articles,
        total_results=data.get("totalResults", 0),
        page=page,
        page_size=page_size,
    )
