from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
async def login(payload: dict):
    return {"token_type": "bearer", "user": {"email": payload.get("email")}}
