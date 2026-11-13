from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
from app.schemas.registration import RegistrationCreateRequest, RegistrationResponse

router = APIRouter()


@router.post("", response_model=RegistrationResponse, status_code=201)
async def submit_registration(payload: RegistrationCreateRequest):
    if not (payload.accepted_terms and payload.accepted_privacy and payload.consent_registration_notifications):
        raise HTTPException(
            status_code=400,
            detail="Terms, Privacy Policy, and Registration Notifications consent are required.",
        )
    reg_id = f"REG-{datetime.utcnow().year}-{str(uuid.uuid4())[:6].upper()}"
    return RegistrationResponse(
        id=reg_id,
        status="Pending Approval",
        submission_date=datetime.utcnow(),
    )
