from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/", response_model=schemas.SettingsOut)
def get_settings(current_user: models.User = Depends(get_current_user)):
    return schemas.SettingsOut(theme=current_user.theme, language=current_user.language, ai_model_pref=current_user.ai_model_pref)


@router.put("/", response_model=schemas.SettingsOut)
def update_settings(payload: schemas.SettingsUpdateIn, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if payload.theme is not None:
        current_user.theme = payload.theme
    if payload.language is not None:
        current_user.language = payload.language
    if payload.ai_model_pref is not None:
        current_user.ai_model_pref = payload.ai_model_pref
    db.commit()
    db.refresh(current_user)
    return schemas.SettingsOut(theme=current_user.theme, language=current_user.language, ai_model_pref=current_user.ai_model_pref)
