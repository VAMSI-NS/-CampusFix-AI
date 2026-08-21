from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone


class KBArticle(BaseModel):
    id: str
    slug: str
    title: str
    category: str
    tags: List[str] = Field(default_factory=list)
    read_time_mins: int = 3
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    summary: str
    content_markdown: str
    helpful_count: int = 0
    icon: Optional[str] = "file-text"
    is_published: bool = True


class KBArticleCreate(BaseModel):
    title: str
    category: str
    tags: List[str] = Field(default_factory=list)
    summary: str
    content_markdown: str
    icon: Optional[str] = "file-text"
    is_published: bool = True


class KBArticleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    summary: Optional[str] = None
    content_markdown: Optional[str] = None
    icon: Optional[str] = None
    is_published: Optional[bool] = None


class KBSearchResponse(BaseModel):
    articles: List[KBArticle]
    total_count: int
    categories: List[str]
