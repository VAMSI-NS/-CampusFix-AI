from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[str] = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    stream: Optional[bool] = False


class ChatResponse(BaseModel):
    reply: str
    model: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    status: str = "success"
