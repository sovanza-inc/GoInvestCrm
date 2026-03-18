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


class BulkUpdateLeads(BaseModel):
    lead_ids: List[str]
    updates: dict


class BulkDeleteLeads(BaseModel):
    lead_ids: List[str]


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class TeamInvite(BaseModel):
    email: str
    role: str = "agent"  # admin, manager, agent
    name: Optional[str] = None


class TeamMemberUpdate(BaseModel):
    role: str


class LeadAssign(BaseModel):
    assigned_to: str  # user_id


# Autopilot Campaign Models
class CampaignStepCreate(BaseModel):
    message: str
    delay_hours: int = 24
    variant: Optional[str] = "A"


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    steps: List[CampaignStepCreate] = []
    target_platforms: Optional[List[str]] = []
    target_statuses: Optional[List[str]] = []
    target_min_score: Optional[int] = None
    target_max_score: Optional[int] = None
    target_tags: Optional[List[str]] = []


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[CampaignStepCreate]] = None
    target_platforms: Optional[List[str]] = None
    target_statuses: Optional[List[str]] = None
    target_min_score: Optional[int] = None
    target_max_score: Optional[int] = None
    target_tags: Optional[List[str]] = None


# Integration Models
class IntegrationConnect(BaseModel):
    platform: str  # whatsapp, instagram, linkedin
    account_name: Optional[str] = None
    account_id: Optional[str] = None


class IntegrationMessage(BaseModel):
    content: str


# Voice message model
class VoiceMessageCreate(BaseModel):
    conversation_id: str
    duration: float = 0
    audio_url: Optional[str] = None
