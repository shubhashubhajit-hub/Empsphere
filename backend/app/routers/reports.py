from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.deps import get_current_user, require_admin

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/dashboard-summary")
def dashboard_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_documents = db.query(func.count(models.Document.id)).scalar()
    total_users = db.query(func.count(models.User.id)).scalar()
    total_queries = db.query(func.count(models.ChatMessage.id)).filter(models.ChatMessage.sender == "user").scalar()
    recent_uploads = db.query(models.Document).order_by(models.Document.created_at.desc()).limit(5).all()

    return {
        "total_documents": total_documents,
        "total_users": total_users,
        "total_ai_queries": total_queries,
        "recent_uploads": [
            {"id": d.id, "title": d.title, "created_at": d.created_at} for d in recent_uploads
        ],
    }


@router.get("/most-viewed-documents")
def most_viewed(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    docs = db.query(models.Document).order_by(models.Document.view_count.desc()).limit(10).all()
    return [{"id": d.id, "title": d.title, "views": d.view_count} for d in docs]
@router.get("/documents-by-category")
def documents_by_category(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.Category.name, func.count(models.Document.id))
        .outerjoin(models.Document, models.Document.category_id == models.Category.id)
        .group_by(models.Category.name)
        .all()
    )
    uncategorized = db.query(func.count(models.Document.id)).filter(models.Document.category_id.is_(None)).scalar()
    result = [{"name": name, "count": count} for name, count in rows]
    if uncategorized:
        result.append({"name": "Uncategorized", "count": uncategorized})
    return result


@router.get("/uploads-by-month")
def uploads_by_month(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rows = (
        db.query(func.date_trunc("month", models.Document.created_at).label("month"), func.count(models.Document.id))
        .group_by("month")
        .order_by("month")
        .limit(12)
        .all()
    )
    return [{"month": month.strftime("%b %Y"), "count": count} for month, count in rows]


@router.get("/users-by-department")
def users_by_department(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rows = db.query(models.User.department, func.count(models.User.id)).group_by(models.User.department).all()
    return [{"name": dept or "Unassigned", "count": count} for dept, count in rows]


@router.get("/queries-by-day")
def queries_by_day(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rows = (
        db.query(func.date_trunc("day", models.ChatMessage.created_at).label("day"), func.count(models.ChatMessage.id))
        .filter(models.ChatMessage.sender == "user")
        .group_by("day")
        .order_by("day")
        .limit(30)
        .all()
    )
    return [{"date": day.strftime("%d %b"), "count": count} for day, count in rows]


@router.get("/ai-queries")
def list_ai_queries(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    """Every question asked in AI Chat, with who asked it and when —
    backs the 'AI queries' stat card on the dashboard."""
    rows = (
        db.query(models.ChatMessage, models.ChatSession, models.User)
        .join(models.ChatSession, models.ChatMessage.session_id == models.ChatSession.id)
        .join(models.User, models.ChatSession.user_id == models.User.id)
        .filter(models.ChatMessage.sender == "user")
        .order_by(models.ChatMessage.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        {
            "id": msg.id,
            "question": msg.message,
            "asked_by": user.name,
            "asked_by_email": user.email,
            "created_at": msg.created_at,
        }
        for msg, session, user in rows
    ]