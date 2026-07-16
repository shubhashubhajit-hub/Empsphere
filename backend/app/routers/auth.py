from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.services.otp_service import create_and_send_otp, verify_otp
from app.services.activity_service import log_activity
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

_ROLE_SECRETS = {
    "admin": lambda: settings.SIGNUP_SECRET_ADMIN,
    "manager": lambda: settings.SIGNUP_SECRET_MANAGER,
    "employee": lambda: settings.SIGNUP_SECRET_EMPLOYEE,
}


@router.post("/signup", response_model=schemas.MessageOut)
def signup(payload: schemas.SignupIn, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    role = payload.role.strip().lower()
    if role not in _ROLE_SECRETS:
        raise HTTPException(status_code=400, detail="Invalid role selected")

    expected_code = _ROLE_SECRETS[role]()
    if not expected_code or payload.secret_code.strip() != expected_code:
        raise HTTPException(status_code=403, detail="Incorrect secret code for the selected role")

    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=models.RoleEnum(role),
        department=payload.department,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    create_and_send_otp(db, user, models.OtpPurpose.signup)
    log_activity(db, user.id, "signup")

    return schemas.MessageOut(message="Account created. Check your email for a 6-digit verification code.")


@router.post("/verify-otp", response_model=schemas.TokenOut)
def verify_signup_otp(payload: schemas.VerifyOtpIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found for this email")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Account already verified")

    if not verify_otp(db, user, payload.otp, models.OtpPurpose.signup):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user.is_verified = True
    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return schemas.TokenOut(access_token=token, role=user.role.value, name=user.name, email=user.email)


@router.post("/resend-otp", response_model=schemas.MessageOut)
def resend_otp(payload: schemas.ForgotPasswordIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found for this email")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Account already verified")
    create_and_send_otp(db, user, models.OtpPurpose.signup)
    return schemas.MessageOut(message="A new code has been sent.")


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Account is blocked. Contact an admin.")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in.")

    user.last_login = datetime.utcnow()
    db.commit()
    log_activity(db, user.id, "login")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return schemas.TokenOut(access_token=token, role=user.role.value, name=user.name, email=user.email)


@router.post("/forgot-password", response_model=schemas.MessageOut)
def forgot_password(payload: schemas.ForgotPasswordIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        create_and_send_otp(db, user, models.OtpPurpose.forgot_password)
    return schemas.MessageOut(message="If that email is registered, a reset code has been sent.")


@router.post("/reset-password", response_model=schemas.MessageOut)
def reset_password(payload: schemas.ResetPasswordIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found for this email")

    if not verify_otp(db, user, payload.otp, models.OtpPurpose.forgot_password):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    log_activity(db, user.id, "password_reset")

    return schemas.MessageOut(message="Password updated. You can now log in.")


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user