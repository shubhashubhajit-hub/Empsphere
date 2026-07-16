import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.deps import require_admin, require_admin_or_manager, get_current_user
from app.security import hash_password, verify_password
from app.services.activity_service import log_activity
from app.config import settings

router = APIRouter(prefix="/api/users", tags=["users"])


# ---------- Self-service profile ----------
@router.put("/me", response_model=schemas.UserOut)
def update_profile(payload: schemas.ProfileUpdateIn, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if payload.name:
        current_user.name = payload.name
    if payload.department is not None:
        current_user.department = payload.department
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password", response_model=schemas.MessageOut)
def change_password(payload: schemas.ChangePasswordIn, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    log_activity(db, current_user.id, "password_changed")
    return schemas.MessageOut(message="Password updated successfully.")


@router.put("/me/avatar", response_model=schemas.UserOut)
async def upload_avatar(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("png", "jpg", "jpeg", "webp"):
        raise HTTPException(status_code=400, detail="Only PNG/JPG/WEBP images are supported")

    safe_name = f"avatar_{uuid.uuid4()}.{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    current_user.profile_picture = dest_path
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/activity")
def my_activity(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    logs = (
        db.query(models.ActivityLog)
        .filter(models.ActivityLog.user_id == current_user.id)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [{"id": l.id, "action": l.action, "meta": l.meta, "created_at": l.created_at} for l in logs]


# ---------- Admin ----------
@router.get("/", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db), viewer: models.User = Depends(require_admin_or_manager)):
    query = db.query(models.User)
    if viewer.role == models.RoleEnum.manager:
        query = query.filter(models.User.department == viewer.department)
    return query.order_by(models.User.created_at.desc()).all()


@router.post("/", response_model=schemas.UserOut)
def add_user(payload: schemas.SignupIn, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")
    # Admin-created users are pre-verified — no OTP round trip needed.
    user = models.User(name=payload.name, email=payload.email, password_hash=hash_password(payload.password), is_verified=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    log_activity(db, admin.id, "admin_added_user", {"new_user_email": user.email})
    return user


@router.put("/{user_id}/role", response_model=schemas.UserOut)
def set_role(user_id: str, payload: schemas.RoleUpdateIn, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role not in ("admin", "manager", "employee"):
        raise HTTPException(status_code=400, detail="Role must be 'admin', 'manager', or 'employee'")
    user.role = models.RoleEnum(payload.role)
    db.commit()
    db.refresh(user)
    log_activity(db, admin.id, "role_changed", {"target_user": user.email, "new_role": payload.role})
    return user
@router.put("/{user_id}/department", response_model=schemas.UserOut)
def set_department(user_id: str, payload: schemas.DepartmentUpdateIn, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.department = payload.department
    db.commit()
    db.refresh(user)
    log_activity(db, admin.id, "department_changed", {"target_user": user.email, "new_department": payload.department})
    return user


@router.put("/{user_id}/block", response_model=schemas.UserOut)
def toggle_block(user_id: str, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_blocked = not user.is_blocked
    db.commit()
    db.refresh(user)
    log_activity(db, admin.id, "block_toggled", {"target_user": user.email, "is_blocked": user.is_blocked})
    return user


@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    log_activity(db, admin.id, "user_deleted", {"target_user": user.email})
    return {"deleted": True}
