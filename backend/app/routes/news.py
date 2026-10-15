"""
News routes – search headlines, save articles.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.models.saved_article import SavedArticle
from app.models.user import User
from app.schemas.news import (
    NewsSearchResponse, SaveArticleRequest, SavedArticleResponse,
)
from app.services.news_api_service import (
    fetch_top_headlines, search_news, NewsAPIError,
    VALID_CATEGORIES, VALID_COUNTRIES,
)
from app.utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/news", tags=["News"])


@router.get(
    "",
    response_model=NewsSearchResponse,
    summary="Fetch news articles from NewsAPI",
)
async def get_news(
    q:         Optional[str] = Query(None,  description="Search keywords"),
    category:  Optional[str] = Query(None,  description=f"Category: {', '.join(sorted(VALID_CATEGORIES))}"),
    country:   str            = Query("us", description=f"Country code: {', '.join(sorted(VALID_COUNTRIES))}"),
    from_date: Optional[str] = Query(None,  description="From date (YYYY-MM-DD)"),
    to_date:   Optional[str] = Query(None,  description="To date (YYYY-MM-DD)"),
    page:      int            = Query(1,    ge=1),
    page_size: int            = Query(20,   ge=1, le=100),
):
    try:
        if q:
            return await search_news(
                q=q, from_date=from_date, to_date=to_date,
                page=page, page_size=page_size,
            )
        else:
            return await fetch_top_headlines(
                q=None, category=category, country=country,
                page=page, page_size=page_size,
            )
    except NewsAPIError as exc:
        raise HTTPException(status_code=exc.http_code, detail=exc.message)


@router.get(
    "/headlines",
    response_model=NewsSearchResponse,
    summary="Fetch top headlines",
)
async def get_headlines(
    q:        Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    country:  str            = Query("us"),
    page:     int            = Query(1, ge=1),
    page_size:int            = Query(20, ge=1, le=100),
):
    try:
        return await fetch_top_headlines(
            q=q, category=category, country=country,
            page=page, page_size=page_size,
        )
    except NewsAPIError as exc:
        raise HTTPException(status_code=exc.http_code, detail=exc.message)


# ---------------------------------------------------------------------------
# Saved articles (auth required)
# ---------------------------------------------------------------------------

@router.post(
    "/save",
    response_model=SavedArticleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save an article to the user's reading list",
)
def save_article(
    body: SaveArticleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Prevent duplicates
    existing = (
        db.query(SavedArticle)
        .filter(SavedArticle.user_id == current_user.id, SavedArticle.url == body.url)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Article already saved",
        )

    article = SavedArticle(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        source=body.source,
        author=body.author,
        url=body.url,
        image_url=body.image_url,
        published_at=body.published_at,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return SavedArticleResponse.model_validate(article)


@router.get(
    "/saved",
    response_model=list[SavedArticleResponse],
    summary="List the current user's saved articles",
)
def list_saved(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    articles = (
        db.query(SavedArticle)
        .filter(SavedArticle.user_id == current_user.id)
        .order_by(SavedArticle.created_at.desc())
        .all()
    )
    return [SavedArticleResponse.model_validate(a) for a in articles]


@router.delete(
    "/saved/{article_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a saved article",
)
def delete_saved(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = (
        db.query(SavedArticle)
        .filter(
            SavedArticle.id == article_id,
            SavedArticle.user_id == current_user.id,
        )
        .first()
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(article)
    db.commit()
