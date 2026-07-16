from sqlalchemy.orm import Session
from app import models


def log_activity(db: Session, user_id: str, action: str, meta: dict = None):
    entry = models.ActivityLog(user_id=user_id, action=action, meta=meta or {})
    db.add(entry)
    db.commit()
