"""Pydantic schemas for prediction requests and responses."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


class PredictRequest(BaseModel):
    headline: str
    content: str
    source: Optional[str] = None
    article_url: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[str] = None

    @field_validator("headline")
    @classmethod
    def headline_not_empty(cls, v: str) -> str:
        if not v or len(v.strip()) < 5:
            raise ValueError("Headline must be at least 5 characters")
        return v.strip()

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v or len(v.strip()) < 20:
            raise ValueError("Content must be at least 20 characters")
        return v.strip()


class KeywordInfo(BaseModel):
    word: str
    score: float


class PredictResponse(BaseModel):
    prediction: str           # "REAL" | "FAKE"
    confidence: float         # 0.0 – 1.0
    label: int                # 1=REAL, 0=FAKE
    fake_probability: float
    real_probability: float
    keywords: List[KeywordInfo] = []
    processed_text_preview: str = ""


class PredictionHistoryItem(BaseModel):
    id: int
    headline: str
    prediction: str
    confidence: float
    source: Optional[str]
    article_url: Optional[str]
    image_url: Optional[str]
    author: Optional[str]
    published_at: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionHistoryCreate(BaseModel):
    headline: str
    content: Optional[str] = None
    prediction: str
    confidence: float
    label: int
    source: Optional[str] = None
    article_url: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[str] = None
