from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    org_id = current_user.org_id

    total_systems = (
        db.query(func.count(models.AISystem.id))
        .filter(models.AISystem.org_id == org_id)
        .scalar()
    ) or 0

    # Latest assessment per system via subquery
    latest_subq = (
        db.query(
            models.RiskAssessment.system_id,
            func.max(models.RiskAssessment.created_at).label("max_created"),
        )
        .group_by(models.RiskAssessment.system_id)
        .subquery()
    )

    latest_assessments = (
        db.query(models.RiskAssessment)
        .join(
            latest_subq,
            (models.RiskAssessment.system_id == latest_subq.c.system_id)
            & (models.RiskAssessment.created_at == latest_subq.c.max_created),
        )
        .join(models.AISystem, models.AISystem.id == models.RiskAssessment.system_id)
        .filter(models.AISystem.org_id == org_id)
        .all()
    )

    counts = {"minimal": 0, "limited": 0, "high": 0, "prohibited": 0}
    assessed_ids = set()
    for a in latest_assessments:
        counts[a.risk_level] = counts.get(a.risk_level, 0) + 1
        assessed_ids.add(a.system_id)

    all_system_ids = {
        row[0]
        for row in db.query(models.AISystem.id)
        .filter(models.AISystem.org_id == org_id)
        .all()
    }
    pending = len(all_system_ids - assessed_ids)

    return schemas.DashboardStats(
        total_systems=total_systems,
        prohibited=counts["prohibited"],
        high_risk=counts["high"],
        limited=counts["limited"],
        minimal=counts["minimal"],
        pending=pending,
    )
