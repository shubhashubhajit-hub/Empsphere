import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    employee = "employee"


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.employee, nullable=False)
    department = Column(String, nullable=True)
    is_blocked = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    profile_picture = Column(String, nullable=True)
    theme = Column(String, default="dark")
    language = Column(String, default="en")
    ai_model_pref = Column(String, default="auto")  # auto | openai | gemini
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    documents = relationship("Document", back_populates="uploader")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    otp_verifications = relationship("OtpVerification", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", cascade="all, delete-orphan")
    feedback_entries = relationship("Feedback", cascade="all, delete-orphan")
    notifications = relationship("Notification", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, nullable=False)

    documents = relationship("Document", back_populates="category")


class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=True)
    is_ocr_processed = Column(Boolean, default=False)
    category_id = Column(UUID(as_uuid=False), ForeignKey("categories.id"), nullable=True)
    uploaded_by = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    tags = Column(String, nullable=True)  # comma separated, simple for MVP
    view_count = Column(Integer, default=0)
    expiry_date = Column(DateTime, nullable=True)
    expiry_notified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="documents")
    uploader = relationship("User", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", order_by="DocumentVersion.version_number.desc()")


class DocumentVersion(Base):
    __tablename__ = "document_versions"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=True)
    replaced_by = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="versions")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    title = Column(String, default="New chat")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    session_id = Column(UUID(as_uuid=False), ForeignKey("chat_sessions.id"), nullable=False)
    sender = Column(String, nullable=False)  # 'user' or 'ai'
    message = Column(Text, nullable=False)
    referenced_documents = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class OtpPurpose(str, enum.Enum):
    signup = "signup"
    forgot_password = "forgot_password"


class OtpVerification(Base):
    __tablename__ = "otp_verifications"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    otp_hash = Column(String, nullable=False)
    purpose = Column(Enum(OtpPurpose), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationType(str, enum.Enum):
    document_upload = "document_upload"
    announcement = "announcement"
    system = "system"


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)  # null = broadcast to all
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.system)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    chat_message_id = Column(UUID(as_uuid=False), ForeignKey("chat_messages.id"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5, or 1/-1 for thumbs up/down
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    document_id = Column(UUID(as_uuid=False), ForeignKey("documents.id"), nullable=False)
    questions = Column(JSON, nullable=False)  # [{question, options[], correct_answer}]
    created_at = Column(DateTime, default=datetime.utcnow)
