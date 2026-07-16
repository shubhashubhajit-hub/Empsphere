from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.config import settings
from app.routers import auth, documents, chat, users, reports, notifications, feedback, settings as settings_router, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Stacks — AI Knowledge Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(users.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(feedback.router)
app.include_router(settings_router.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
