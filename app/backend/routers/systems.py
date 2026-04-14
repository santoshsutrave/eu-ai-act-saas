from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/systems", tags=["systems"])


def _latest_risk(system: models.AISystem) -> str | None:
    if system.risk_assessments:
        latest = max(system.risk_assessments, key=lambda r: r.created_at)
        return latest.risk_level
    return None


@router.get("", response_model=List[schemas.AISystemOut])
def list_systems(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    systems = (
        db.query(models.AISystem)
        .filter(models.AISystem.org_id == current_user.org_id)
        .order_by(models.AISystem.created_at.desc())
        .all()
    )
    out = []
    for s in systems:
        d = schemas.AISystemOut.model_validate(s)
        d.latest_risk_level = _latest_risk(s)
        out.append(d)
    return out


@router.post("", response_model=schemas.AISystemOut, status_code=201)
def create_system(
    body: schemas.AISystemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    system = models.AISystem(
        org_id=current_user.org_id,
        name=body.name,
        purpose=body.purpose,
        sector=body.sector,
        owner=current_user.id,
    )
    db.add(system)
    db.add(models.AuditLog(
        org_id=current_user.org_id,
        actor=current_user.email,
        action="system.create",
        payload={"name": body.name, "sector": body.sector},
    ))
    db.commit()
    db.refresh(system)
    d = schemas.AISystemOut.model_validate(system)
    d.latest_risk_level = None
    return d


@router.get("/{system_id}", response_model=schemas.AISystemOut)
def get_system(
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
    d = schemas.AISystemOut.model_validate(system)
    d.latest_risk_level = _latest_risk(system)
    return d


@router.delete("/{system_id}", status_code=204)
def delete_system(
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
    db.add(models.AuditLog(
        org_id=current_user.org_id,
        actor=current_user.email,
        action="system.delete",
        payload={"system_id": str(system_id), "name": system.name},
    ))
    db.delete(system)
    db.commit()
