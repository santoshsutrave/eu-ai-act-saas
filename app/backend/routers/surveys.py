import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from services.classifier import classify_risk, SURVEY_QUESTIONS
import models
import schemas

router = APIRouter(prefix="/api/systems/{system_id}/surveys", tags=["surveys"])


@router.get("/questions")
def get_questions(
    system_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    system = db.query(models.AISystem).filter(
        models.AISystem.id == system_id,
        models.AISystem.org_id == current_user.org_id,
    ).first()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    return {"questions": SURVEY_QUESTIONS}


@router.post("", response_model=schemas.SurveySessionOut, status_code=201)
def start_survey(
    system_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    system = db.query(models.AISystem).filter(
        models.AISystem.id == system_id,
        models.AISystem.org_id == current_user.org_id,
    ).first()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    session = models.SurveySession(system_id=system_id, answers={}, status="in_progress")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.patch("/{session_id}", response_model=schemas.SurveySessionOut)
def save_answers(
    system_id: uuid.UUID,
    session_id: uuid.UUID,
    body: schemas.SurveyAnswers,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = db.query(models.SurveySession).filter(
        models.SurveySession.id == session_id,
        models.SurveySession.system_id == system_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.answers = {**(session.answers or {}), **body.answers}
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/complete", response_model=schemas.RiskAssessmentOut)
def complete_survey(
    system_id: uuid.UUID,
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = db.query(models.SurveySession).filter(
        models.SurveySession.id == session_id,
        models.SurveySession.system_id == system_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Run classifier
    answers: dict[str, Any] = session.answers or {}
    # Merge system info into answers for keyword analysis
    system = session.system
    if system and system.purpose:
        answers.setdefault("q_purpose", system.purpose)

    risk_level, rationale = classify_risk(answers)

    assessment = models.RiskAssessment(
        system_id=system_id,
        session_id=session_id,
        risk_level=risk_level,
        rationale=rationale,
    )
    db.add(assessment)
    session.status = "completed"

    db.add(models.AuditLog(
        org_id=current_user.org_id,
        actor=current_user.email,
        action="assessment.complete",
        payload={
            "system_id": str(system_id),
            "session_id": str(session_id),
            "risk_level": risk_level,
        },
    ))
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/{session_id}/assessment", response_model=schemas.RiskAssessmentOut)
def get_assessment(
    system_id: uuid.UUID,
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    assessment = db.query(models.RiskAssessment).filter(
        models.RiskAssessment.session_id == session_id,
        models.RiskAssessment.system_id == system_id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment
