from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UserAccountModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="builder", nullable=False)
    status: Mapped[str] = mapped_column(String(48), default="pending_approval", nullable=False)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False)
    auth_provider: Mapped[str] = mapped_column(String(32), default="password")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RegistrationRequestModel(Base):
    __tablename__ = "customer_registrations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    submission_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    job_title: Mapped[str] = mapped_column(String(160), nullable=False)
    application_types: Mapped[list] = mapped_column(JSON, nullable=False)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    project_description: Mapped[str] = mapped_column(Text, nullable=False)
    preferred_backend_language: Mapped[str] = mapped_column(String(64), default="Python")
    preferred_frontend_framework: Mapped[str] = mapped_column(String(120), default="React + TypeScript")
    theme_option: Mapped[str] = mapped_column(String(120), nullable=False)
    theme_mode_preference: Mapped[str] = mapped_column(String(32), default="dark")
    consent_registration_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    consent_marketing: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(48), default="Pending Approval", nullable=False)
    approval_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    admin_comments: Mapped[str | None] = mapped_column(Text, nullable=True)


class ApprovalHistoryModel(Base):
    __tablename__ = "approval_history"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    registration_id: Mapped[str] = mapped_column(ForeignKey("customer_registrations.id"), nullable=False)
    previous_status: Mapped[str] = mapped_column(String(48), nullable=False)
    new_status: Mapped[str] = mapped_column(String(48), nullable=False)
    admin_id: Mapped[str] = mapped_column(String(255), nullable=False)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class NotificationLogModel(Base):
    __tablename__ = "notification_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    registration_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    template: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(48), nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
