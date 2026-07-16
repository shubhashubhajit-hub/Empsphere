import os
import subprocess
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.deps import require_admin
from app.config import settings
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/logs")
def get_logs(
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    logs = db.query(models.ActivityLog).order_by(models.ActivityLog.created_at.desc()).limit(limit).all()
    result = []
    for l in logs:
        user = db.query(models.User).filter(models.User.id == l.user_id).first() if l.user_id else None
        result.append({
            "id": l.id,
            "user_email": user.email if user else "system",
            "action": l.action,
            "meta": l.meta,
            "created_at": l.created_at,
        })
    return result


@router.post("/backup")
def run_backup(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    """Runs pg_dump against the configured DATABASE_URL and stores the file server-side.
    Requires the `postgresql-client` package (pg_dump) to be available — already
    included in the provided Dockerfile."""
    filename = f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.sql"
    filepath = os.path.join(settings.BACKUP_DIR, filename)

    try:
        result = subprocess.run(
            ["pg_dump", settings.DATABASE_URL, "-f", filepath],
            capture_output=True, text=True, timeout=120,
        )
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Backup failed: {result.stderr[:500]}")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="pg_dump is not installed in this environment. Install postgresql-client.")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Backup timed out.")

    log_activity(db, admin.id, "backup_created", {"filename": filename})
    return {"filename": filename, "created_at": datetime.utcnow()}


@router.get("/backups")
def list_backups(admin: models.User = Depends(require_admin)):
    files = sorted(os.listdir(settings.BACKUP_DIR), reverse=True)
    return [f for f in files if f.endswith(".sql")]


@router.get("/backups/{filename}/download")
def download_backup(filename: str, admin: models.User = Depends(require_admin)):
    filepath = os.path.join(settings.BACKUP_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Backup file not found")
    return FileResponse(filepath, filename=filename, media_type="application/sql")


@router.post("/restore")
async def restore_backup(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """Restores the database from an uploaded .sql dump. This will overwrite
    existing data — use with caution, intended for disaster recovery."""
    if not file.filename.endswith(".sql"):
        raise HTTPException(status_code=400, detail="Please upload a .sql backup file")

    temp_path = os.path.join(settings.BACKUP_DIR, f"restore_{uuid.uuid4()}.sql")
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    try:
        result = subprocess.run(
            ["psql", settings.DATABASE_URL, "-f", temp_path],
            capture_output=True, text=True, timeout=180,
        )
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Restore failed: {result.stderr[:500]}")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="psql is not installed in this environment. Install postgresql-client.")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Restore timed out.")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    log_activity(db, admin.id, "backup_restored", {"filename": file.filename})
    return {"message": "Database restored successfully."}
