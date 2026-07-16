import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from app.config import settings
from app.security import hash_password, verify_password
from app.services.email_service import send_email


def generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def create_and_send_otp(db: Session, user: models.User, purpose: models.OtpPurpose) -> str:
    code = generate_otp()
    otp = models.OtpVerification(
        user_id=user.id,
        otp_hash=hash_password(code),
        purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MIN),
    )
    db.add(otp)
    db.commit()

    subject = "Your Stacks verification code" if purpose == models.OtpPurpose.signup else "Your Stacks password reset code"
    body = f"Your one-time code is: {code}\nIt expires in {settings.OTP_EXPIRE_MIN} minutes."
    send_email(user.email, subject, body)
    return code  # returned for dev/testing convenience; real flow relies on email


def verify_otp(db: Session, user: models.User, code: str, purpose: models.OtpPurpose) -> bool:
    otp_records = (
        db.query(models.OtpVerification)
        .filter(
            models.OtpVerification.user_id == user.id,
            models.OtpVerification.purpose == purpose,
            models.OtpVerification.is_used == False,  # noqa: E712
        )
        .order_by(models.OtpVerification.created_at.desc())
        .all()
    )
    for record in otp_records:
        if record.expires_at < datetime.utcnow():
            continue
        if verify_password(code, record.otp_hash):
            record.is_used = True
            db.commit()
            return True
    return False
