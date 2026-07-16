from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_admin

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("/", response_model=schemas.MessageOut)
def submit_feedback(payload: schemas.FeedbackIn, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    fb = models.Feedback(
        user_id=current_user.id,
        chat_message_id=payload.chat_message_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(fb)
    db.commit()
    return schemas.MessageOut(message="Thanks for the feedback.")


@router.get("/summary")
def feedback_summary(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    all_fb = db.query(models.Feedback).all()
    if not all_fb:
        return {"total": 0, "average_rating": None}
    avg = sum(f.rating for f in all_fb) / len(all_fb)
    return {"total": len(all_fb), "average_rating": round(avg, 2)}
