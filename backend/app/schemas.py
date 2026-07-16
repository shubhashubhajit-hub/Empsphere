from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr


# ---- Auth ----
class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    secret_code: str
    department: Optional[str] = None
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str


# ---- User ----
class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None
    is_blocked: bool
    is_verified: bool
    profile_picture: Optional[str] = None
    theme: str
    language: str
    ai_model_pref: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


class RoleUpdateIn(BaseModel):
    role: str
class DepartmentUpdateIn(BaseModel):
    department: Optional[str] = None


# ---- Category ----
class CategoryOut(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True


# ---- Document ----
class DocumentOut(BaseModel):
    id: str
    title: str
    file_type: str
    category_id: Optional[str]
    tags: Optional[str]
    view_count: int
    expiry_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentUpdateIn(BaseModel):
    title: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[str] = None
    expiry_date: Optional[datetime] = None


class DocumentVersionOut(BaseModel):
    id: str
    version_number: int
    file_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Auth (OTP / password reset) ----
class VerifyOtpIn(BaseModel):
    email: EmailStr
    otp: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class MessageOut(BaseModel):
    message: str


# ---- Notifications ----
class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BroadcastIn(BaseModel):
    title: str
    message: str


# ---- Feedback ----
class FeedbackIn(BaseModel):
    chat_message_id: Optional[str] = None
    rating: int
    comment: Optional[str] = None


# ---- Quiz ----
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str


class QuizOut(BaseModel):
    id: str
    document_id: str
    questions: List[QuizQuestion]
    created_at: datetime

    class Config:
        from_attributes = True


class SummaryOut(BaseModel):
    document_id: str
    summary: str


# ---- Settings ----
class SettingsUpdateIn(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    ai_model_pref: Optional[str] = None


class SettingsOut(BaseModel):
    theme: str
    language: str
    ai_model_pref: str

class AskIn(BaseModel):
    question: str
    session_id: Optional[str] = None


class SourceRef(BaseModel):
    document_id: str
    title: str
    snippet: str
    confidence: float


class AskOut(BaseModel):
    session_id: str
    answer: str
    sources: List[SourceRef]


class ChatSessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageOut(BaseModel):
    id: str
    sender: str
    message: str
    referenced_documents: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True
