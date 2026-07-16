from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_admin
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=List[schemas.NotificationOut])
def list_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Notification)
        .filter(or_(models.Notification.user_id == current_user.id, models.Notification.user_id.is_(None)))
        .order_by(models.Notification.created_at.desc())
        .limit(30)
        .all()
    )


@router.put("/{notif_id}/read", response_model=schemas.NotificationOut)
def mark_read(notif_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif
@router.put("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    (
        db.query(models.Notification)
        .filter(or_(models.Notification.user_id == current_user.id, models.Notification.user_id.is_(None)))
        .update({models.Notification.is_read: True}, synchronize_session=False)
    )
    db.commit()
    return {"marked_read": True}


@router.post("/broadcast", response_model=schemas.NotificationOut)
def broadcast(payload: schemas.BroadcastIn, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    return create_notification(db, payload.title, payload.message, models.NotificationType.announcement, user_id=None)
