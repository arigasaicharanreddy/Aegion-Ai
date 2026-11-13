from fastapi import APIRouter, Depends
from app.core.permissions import require_role

router = APIRouter()


@router.get("/")
async def list_projects(_role: str = Depends(require_role(["builder", "super_admin"]))):
    return {"items": [], "note": "Connect SQLAlchemy AsyncSession repository"}


@router.post("/")
async def create_project(payload: dict, _role: str = Depends(require_role(["builder", "super_admin"]))):
    return {"status": "created", "project": payload}
