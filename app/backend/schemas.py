from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    org_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    org_id: uuid.UUID

    model_config = {"from_attributes": True}


# ── AI Systems ────────────────────────────────────────────────────────────────

class AISystemCreate(BaseModel):
    name: str
    purpose: str
    sector: str


class AISystemOut(BaseModel):
    id: uuid.UUID
    name: str
    purpose: str
    sector: str
    org_id: uuid.UUID
    owner: Optional[uuid.UUID]
    created_at: datetime
    latest_risk_level: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Survey ────────────────────────────────────────────────────────────────────

class SurveyAnswers(BaseModel):
    answers: dict[str, Any]


class SurveySessionOut(BaseModel):
    id: uuid.UUID
    system_id: uuid.UUID
    answers: dict[str, Any]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Risk Assessment ───────────────────────────────────────────────────────────

class RiskAssessmentOut(BaseModel):
    id: uuid.UUID
    system_id: uuid.UUID
    session_id: uuid.UUID
    risk_level: str
    rationale: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Audit Log ─────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    org_id: Optional[uuid.UUID]
    actor: str
    action: str
    payload: Optional[dict[str, Any]]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_systems: int
    prohibited: int
    high_risk: int
    limited: int
    minimal: int
    pending: int
