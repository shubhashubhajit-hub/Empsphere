import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.config import settings
from app.services.text_extract import extract_text, detect_file_type
from app.services.ocr_service import ocr_pdf, needs_ocr
from app.services.summarizer_service import summarize_document
from app.services.quiz_service import generate_quiz
from app.services.llm import llm_summarize, llm_generate_quiz
from app.services.notification_service import create_notification
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _can_modify_document(current_user: models.User, doc: models.Document, db: Session) -> bool:
    if current_user.role == models.RoleEnum.admin:
        return True
    if doc.uploaded_by == current_user.id:
        return True
    if current_user.role == models.RoleEnum.manager:
        uploader = db.query(models.User).filter(models.User.id == doc.uploaded_by).first()
        if uploader and uploader.department and uploader.department == current_user.department:
            return True
    return False


@router.get("/categories", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(models.Category).all()
    if not cats:
        defaults = ["HR", "IT", "Finance", "Policies"]
        for name in defaults:
            db.add(models.Category(name=name))
        db.commit()
        cats = db.query(models.Category).all()
    return cats


@router.post("/upload", response_model=schemas.DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    category_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    file_type = detect_file_type(file.filename)
    if file_type == "unknown":
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")

    safe_name = f"{uuid.uuid4()}_{file.filename}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(dest_path, "wb") as f:
        f.write(contents)

    text = extract_text(dest_path, file_type)

    ocr_used = False
    if file_type == "pdf" and needs_ocr(text):
        ocr_text = ocr_pdf(dest_path)
        if ocr_text:
            text = ocr_text
            ocr_used = True

    doc = models.Document(
        title=file.filename,
        file_path=dest_path,
        file_type=file_type,
        extracted_text=text,
        is_ocr_processed=ocr_used,
        category_id=category_id or None,
        tags=tags or "",
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    create_notification(
        db,
        title="New document uploaded",
        message=f'"{doc.title}" was added by {current_user.name}.',
        type_=models.NotificationType.document_upload,
        user_id=None,
    )
    log_activity(db, current_user.id, "document_uploaded", {"title": doc.title, "ocr_used": ocr_used})

    return doc


@router.post("/upload-bulk", response_model=List[schemas.DocumentOut])
async def upload_documents_bulk(
    files: List[UploadFile] = File(...),
    category_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    uploaded_docs = []
    errors = []

    for file in files:
        file_type = detect_file_type(file.filename)
        if file_type == "unknown":
            errors.append(f"{file.filename}: unsupported file type")
            continue

        contents = await file.read()
        if len(contents) > settings.MAX_UPLOAD_MB * 1024 * 1024:
            errors.append(f"{file.filename}: exceeds {settings.MAX_UPLOAD_MB}MB limit")
            continue

        safe_name = f"{uuid.uuid4()}_{file.filename}"
        dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)
        with open(dest_path, "wb") as f:
            f.write(contents)

        text = extract_text(dest_path, file_type)
        ocr_used = False
        if file_type == "pdf" and needs_ocr(text):
            ocr_text = ocr_pdf(dest_path)
            if ocr_text:
                text = ocr_text
                ocr_used = True

        doc = models.Document(
            title=file.filename,
            file_path=dest_path,
            file_type=file_type,
            extracted_text=text,
            is_ocr_processed=ocr_used,
            category_id=category_id or None,
            tags=tags or "",
            uploaded_by=current_user.id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        uploaded_docs.append(doc)
        log_activity(db, current_user.id, "document_uploaded", {"title": doc.title, "ocr_used": ocr_used})

    if uploaded_docs:
        create_notification(
            db,
            title="New documents uploaded",
            message=f'{len(uploaded_docs)} document(s) were added by {current_user.name}.',
            type_=models.NotificationType.document_upload,
            user_id=None,
        )

    if errors and not uploaded_docs:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    return uploaded_docs


@router.get("/", response_model=List[schemas.DocumentOut])
def list_documents(
    category_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Document)
    if category_id:
        query = query.filter(models.Document.category_id == category_id)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(models.Document.title.ilike(like), models.Document.extracted_text.ilike(like)))
    return query.order_by(models.Document.created_at.desc()).all()


@router.get("/expiring", response_model=List[schemas.DocumentOut])
def list_expiring_documents(days: int = Query(7, le=90), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cutoff = datetime.utcnow() + timedelta(days=days)
    docs = db.query(models.Document).filter(
        models.Document.expiry_date.isnot(None),
        models.Document.expiry_date <= cutoff,
    ).order_by(models.Document.expiry_date.asc()).all()

    for doc in docs:
        if not doc.expiry_notified:
            create_notification(
                db,
                title="Document expiring soon",
                message=f'"{doc.title}" is due for review by {doc.expiry_date.strftime("%d %b %Y")}.',
                type_=models.NotificationType.document_upload,
                user_id=None,
            )
            doc.expiry_notified = True
    db.commit()

    return docs


@router.get("/{doc_id}", response_model=schemas.DocumentOut)
def get_document(doc_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.view_count += 1
    db.commit()
    return doc


_FILE_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}


@router.get("/{doc_id}/file")
def view_document_file(doc_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="The file is missing from storage")
    return FileResponse(
        doc.file_path,
        media_type=_FILE_MEDIA_TYPES.get(doc.file_type, "application/octet-stream"),
        filename=doc.title,
    )


@router.put("/{doc_id}/replace", response_model=schemas.DocumentOut)
async def replace_document_file(
    doc_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not _can_modify_document(current_user, doc, db):
        raise HTTPException(status_code=403, detail="You can only replace documents you uploaded, or your department's documents")

    file_type = detect_file_type(file.filename)
    if file_type == "unknown":
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")

    existing_version_count = db.query(models.DocumentVersion).filter(models.DocumentVersion.document_id == doc.id).count()
    archived = models.DocumentVersion(
        document_id=doc.id,
        version_number=existing_version_count + 1,
        file_path=doc.file_path,
        file_type=doc.file_type,
        extracted_text=doc.extracted_text,
        replaced_by=current_user.id,
    )
    db.add(archived)

    safe_name = f"{uuid.uuid4()}_{file.filename}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(dest_path, "wb") as f:
        f.write(contents)

    text = extract_text(dest_path, file_type)
    ocr_used = False
    if file_type == "pdf" and needs_ocr(text):
        ocr_text = ocr_pdf(dest_path)
        if ocr_text:
            text = ocr_text
            ocr_used = True

    doc.file_path = dest_path
    doc.file_type = file_type
    doc.extracted_text = text
    doc.is_ocr_processed = ocr_used
    db.commit()
    db.refresh(doc)
    log_activity(db, current_user.id, "document_replaced", {"title": doc.title})
    return doc


@router.get("/{doc_id}/versions", response_model=List[schemas.DocumentVersionOut])
def list_versions(doc_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return db.query(models.DocumentVersion).filter(models.DocumentVersion.document_id == doc_id).order_by(
        models.DocumentVersion.version_number.desc()
    ).all()


@router.get("/{doc_id}/versions/{version_id}/file")
def download_version(doc_id: str, version_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    version = db.query(models.DocumentVersion).filter(
        models.DocumentVersion.id == version_id, models.DocumentVersion.document_id == doc_id
    ).first()
    if not version or not os.path.exists(version.file_path):
        raise HTTPException(status_code=404, detail="This version's file is no longer available")
    return FileResponse(version.file_path, filename=f"v{version.version_number}_{os.path.basename(version.file_path)}")


@router.put("/{doc_id}", response_model=schemas.DocumentOut)
def update_document(
    doc_id: str,
    payload: schemas.DocumentUpdateIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not _can_modify_document(current_user, doc, db):
        raise HTTPException(status_code=403, detail="You can only edit documents you uploaded, or your department's documents")

    if payload.title is not None:
        doc.title = payload.title
    if payload.category_id is not None:
        doc.category_id = payload.category_id
    if payload.tags is not None:
        doc.tags = payload.tags
    if payload.expiry_date is not None:
        doc.expiry_date = payload.expiry_date
        doc.expiry_notified = False
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not _can_modify_document(current_user, doc, db):
        raise HTTPException(status_code=403, detail="You can only delete documents you uploaded, or your department's documents")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    log_activity(db, current_user.id, "document_deleted", {"title": doc.title})
    return {"deleted": True}


@router.post("/{doc_id}/summarize", response_model=schemas.SummaryOut)
def summarize(doc_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.extracted_text or not doc.extracted_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in this document")

    def llm_fn(text):
        return llm_summarize(text, model_pref=current_user.ai_model_pref)

    summary = summarize_document(doc.extracted_text, llm_summarize_fn=llm_fn)
    log_activity(db, current_user.id, "document_summarized", {"title": doc.title})
    return schemas.SummaryOut(document_id=doc.id, summary=summary)


@router.post("/{doc_id}/generate-quiz", response_model=schemas.QuizOut)
def make_quiz(doc_id: str, num_questions: int = Query(5, le=10), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.extracted_text or not doc.extracted_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in this document")

    def llm_fn(text, n):
        return llm_generate_quiz(text, n, model_pref=current_user.ai_model_pref)

    questions = generate_quiz(doc.extracted_text, num_questions=num_questions, llm_quiz_fn=llm_fn)
    if not questions:
        raise HTTPException(status_code=400, detail="Couldn't generate quiz questions from this document — it may be too short.")

    quiz = models.Quiz(document_id=doc.id, questions=questions)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    log_activity(db, current_user.id, "quiz_generated", {"title": doc.title})
    return quiz