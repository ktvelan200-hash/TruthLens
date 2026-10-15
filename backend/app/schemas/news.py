"""Pydantic schemas for news articles."""

from typing import Optional, List
from pydantic import BaseModel


class NewsArticle(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    url: str
    url_to_image: Optional[str] = None
    source_name: str
    author: Optional[str] = None
    published_at: Optional[str] = None


class NewsSearchResponse(BaseModel):
    articles: List[NewsArticle]
    total_results: int
    page: int
    page_size: int


class SaveArticleRequest(BaseModel):
    title: str
    description: Optional[str] = None
    source: Optional[str] = None
    author: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    published_at: Optional[str] = None


class SavedArticleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    source: Optional[str]
    author: Optional[str]
    url: str
    image_url: Optional[str]
    published_at: Optional[str]

    model_config = {"from_attributes": True}
