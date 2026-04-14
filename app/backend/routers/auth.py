from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user
import models
import schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    org = models.Org(name=req.org_name)
    db.add(org)
    db.flush()

    user = models.User(
        email=req.email,
        hashed_password=hash_password(req.password),
        org_id=org.id,
        role="admin",
    )
    db.add(user)

    log = models.AuditLog(
        org_id=org.id,
        actor=req.email,
        action="user.register",
        payload={"org_name": req.org_name},
    )
    db.add(log)
    db.commit()

    token = create_access_token({"sub": str(user.id)})
    return schemas.TokenResponse(access_token=token)


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({"sub": str(user.id)})

    db.add(models.AuditLog(
        org_id=user.org_id,
        actor=user.email,
        action="user.login",
        payload={},
    ))
    db.commit()
    return schemas.TokenResponse(access_token=token)


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
