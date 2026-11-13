from fastapi import APIRouter, Depends
from app.core.permissions import require_role

router = APIRouter()


@router.get("/audit-logs")
async def get_audit_logs(_role: str = Depends(require_role(["super_admin"]))):
    return {"items": []}
