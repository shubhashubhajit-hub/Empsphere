from sqlalchemy.orm import Session
from app import models


def create_notification(db: Session, title: str, message: str, type_: models.NotificationType, user_id: str = None):
    """user_id=None means broadcast to all users (rendered for everyone)."""
    n = models.Notification(user_id=user_id, title=title, message=message, type=type_)
    db.add(n)
    db.commit()
    return n
