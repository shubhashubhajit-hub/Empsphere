from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_admin
from app.services.retrieval import search_documents, match_by_title
from app.services.llm import generate_answer

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/ask", response_model=schemas.AskOut)
def ask(payload: schemas.AskIn, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if payload.session_id:
        session = db.query(models.ChatSession).filter(
            models.ChatSession.id == payload.session_id,
            models.ChatSession.user_id == current_user.id,
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        session = models.ChatSession(user_id=current_user.id, title=payload.question[:60])
        db.add(session)
        db.commit()
        db.refresh(session)

    docs = db.query(models.Document).all()
    doc_dicts = [{"id": d.id, "title": d.title, "text": d.extracted_text or ""} for d in docs]

    title_matches = match_by_title(payload.question, doc_dicts, top_k=3)
    content_matches = search_documents(payload.question, doc_dicts, top_k=3)

    seen_ids = set()
    sources = []
    for m in title_matches + content_matches:
        if m["document_id"] in seen_ids:
            continue
        seen_ids.add(m["document_id"])
        sources.append(m)
    sources = sources[:3]

    answer = generate_answer(payload.question, sources, model_pref=current_user.ai_model_pref)
    user_msg = models.ChatMessage(session_id=session.id, sender="user", message=payload.question)
    ai_msg = models.ChatMessage(
        session_id=session.id,
        sender="ai",
        message=answer,
        referenced_documents=sources,
    )
    db.add_all([user_msg, ai_msg])
    db.commit()

    return schemas.AskOut(
        session_id=session.id,
        answer=answer,
        sources=[schemas.SourceRef(**s) for s in sources],
    )


@router.get("/sessions", response_model=List[schemas.ChatSessionOut])
def list_sessions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id).order_by(
        models.ChatSession.created_at.desc()
    ).all()


@router.get("/sessions/{session_id}/messages", response_model=List[schemas.ChatMessageOut])
def session_messages(session_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(
        models.ChatMessage.created_at
    ).all()


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    db.delete(session)
    db.commit()
    return {"deleted": True}
# ---------- Admin: browse every user's chat history ----------

@router.get("/admin/sessions")
def admin_list_sessions(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    rows = (
        db.query(models.ChatSession, models.User)
        .join(models.User, models.ChatSession.user_id == models.User.id)
        .order_by(models.ChatSession.created_at.desc())
        .all()
    )
    return [
        {
            "id": session.id,
            "title": session.title,
            "created_at": session.created_at,
            "user_name": user.name,
            "user_email": user.email,
        }
        for session, user in rows
    ]


@router.get("/admin/sessions/{session_id}/messages", response_model=List[schemas.ChatMessageOut])
def admin_session_messages(session_id: str, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(
        models.ChatMessage.created_at
    ).all()
