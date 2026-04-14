import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, BigInteger, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class Org(Base):
    __tablename__ = "orgs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    users = relationship("User", back_populates="org")
    ai_systems = relationship("AISystem", back_populates="org")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("orgs.id"))
    email = Column(Text, unique=True, nullable=False)
    hashed_password = Column(Text, nullable=True)
    role = Column(String(20), default="contributor")

    org = relationship("Org", back_populates="users")
    ai_systems = relationship("AISystem", back_populates="owner_user")


class AISystem(Base):
    __tablename__ = "ai_systems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("orgs.id"))
    name = Column(Text)
    purpose = Column(Text)
    sector = Column(Text)
    owner = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    org = relationship("Org", back_populates="ai_systems")
    owner_user = relationship("User", back_populates="ai_systems")
    survey_sessions = relationship("SurveySession", back_populates="system")
    risk_assessments = relationship("RiskAssessment", back_populates="system")
    documents = relationship("Document", back_populates="system")


class SurveySession(Base):
    __tablename__ = "survey_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    system_id = Column(UUID(as_uuid=True), ForeignKey("ai_systems.id"))
    answers = Column(JSON, default=dict)
    status = Column(String(20), default="in_progress")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    system = relationship("AISystem", back_populates="survey_sessions")
    risk_assessment = relationship("RiskAssessment", back_populates="session", uselist=False)


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    system_id = Column(UUID(as_uuid=True), ForeignKey("ai_systems.id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("survey_sessions.id"))
    risk_level = Column(String(20))  # minimal | limited | high | prohibited
    rationale = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    system = relationship("AISystem", back_populates="risk_assessments")
    session = relationship("SurveySession", back_populates="risk_assessment")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    system_id = Column(UUID(as_uuid=True), ForeignKey("ai_systems.id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("survey_sessions.id"), nullable=True)
    type = Column(Text)
    url = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    system = relationship("AISystem", back_populates="documents")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    org_id = Column(UUID(as_uuid=True))
    actor = Column(Text)
    action = Column(Text)
    payload = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
