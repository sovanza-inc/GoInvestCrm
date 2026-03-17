from pydantic import BaseModel
from typing import List, Optional


class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    company: Optional[str] = ""


class UserLogin(BaseModel):
    email: str
    password: str


class LeadCreate(BaseModel):
    name: str
    handle: str
    platform: str = "instagram"
    bio: Optional[str] = ""
    followers: int = 0
    engagement_rate: float = 0.0
    tags: List[str] = []
    notes: Optional[str] = ""


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    handle: Optional[str] = None
    platform: Optional[str] = None
    bio: Optional[str] = None
    followers: Optional[int] = None
    engagement_rate: Optional[float] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    score: Optional[int] = None


class MessageCreate(BaseModel):
    content: str


class AISuggestRequest(BaseModel):
    conversation_id: str
    context: Optional[str] = ""


class AIScoreRequest(BaseModel):
    lead_id: str


class TemplateCreate(BaseModel):
    name: str
    content: str
    category: str = "general"
    tags: List[str] = []


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str


class GoogleAuthRequest(BaseModel):
    session_id: str
