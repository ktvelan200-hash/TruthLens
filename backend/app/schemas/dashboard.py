"""Pydantic schemas for dashboard statistics."""

from typing import List
from pydantic import BaseModel


class DailyStats(BaseModel):
    date: str
    real_count: int
    fake_count: int


class DashboardStats(BaseModel):
    total_analyzed: int
    real_count: int
    fake_count: int
    avg_confidence: float
    real_percentage: float
    fake_percentage: float
    daily_stats: List[DailyStats] = []
