import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/knowledge_assistant")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-this-secret-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MIN: int = int(os.getenv("JWT_ACCESS_EXPIRE_MIN", "60"))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "20"))
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    # Email (OTP + notifications). If not configured, OTPs are printed to
    # the backend console instead of emailed — the app still works fully
    # for local dev/demo without any SMTP account.
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASS: str = os.getenv("SMTP_PASS", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "no-reply@stacks.local")
    OTP_EXPIRE_MIN: int = int(os.getenv("OTP_EXPIRE_MIN", "10"))

    BACKUP_DIR: str = os.getenv("BACKUP_DIR", "./backups")
    SIGNUP_SECRET_ADMIN: str = os.getenv("SIGNUP_SECRET_ADMIN", "")
    SIGNUP_SECRET_MANAGER: str = os.getenv("SIGNUP_SECRET_MANAGER", "")
    SIGNUP_SECRET_EMPLOYEE: str = os.getenv("SIGNUP_SECRET_EMPLOYEE", "")

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.BACKUP_DIR, exist_ok=True)
