import hmac
import hashlib
from fastapi import APIRouter, Header, HTTPException, Request, Response
from app.core.config import settings

router = APIRouter()


@router.get("/whatsapp")
async def verify_whatsapp_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge", "")
    if mode == "subscribe" and settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN and token == settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Webhook verification failed")


@router.post("/whatsapp")
async def handle_whatsapp_webhook(request: Request, x_hub_signature_256: str | None = Header(default=None)):
    raw_body = await request.body()
    if settings.WHATSAPP_APP_SECRET:
        expected = "sha256=" + hmac.new(
            settings.WHATSAPP_APP_SECRET.encode(), raw_body, hashlib.sha256
        ).hexdigest()
        if not x_hub_signature_256 or not hmac.compare_digest(expected, x_hub_signature_256):
            raise HTTPException(status_code=403, detail="Invalid HMAC-SHA256 webhook signature")
    return {"received": True}
