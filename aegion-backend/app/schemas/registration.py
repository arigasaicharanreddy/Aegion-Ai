from datetime import datetime
from pydantic import BaseModel, EmailStr


class RegistrationCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    country: str
    company_name: str
    company_website: str | None = None
    job_title: str
    application_types: list[str]
    project_name: str
    project_description: str
    preferred_backend_language: str = "Python"
    preferred_frontend_framework: str = "React + TypeScript"
    theme_option: str
    theme_mode_preference: str = "dark"
    accepted_terms: bool
    accepted_privacy: bool
    consent_registration_notifications: bool
    consent_marketing: bool = False


class RegistrationDecisionRequest(BaseModel):
    decision: str
    comments: str = ""


class RegistrationResponse(BaseModel):
    id: str
    status: str
    submission_date: datetime
