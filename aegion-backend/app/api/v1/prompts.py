from fastapi import APIRouter, Depends, HTTPException, status
from app.core.permissions import require_role

router = APIRouter()


@router.get("/")
async def list_prompts(role: str = Depends(require_role(["builder", "super_admin"]))):
    return {"role": role, "protected_prompts_redacted": role != "super_admin"}


@router.put("/{prompt_id}")
async def update_prompt(
    prompt_id: str,
    payload: dict,
    _role: str = Depends(require_role(["super_admin"])),
):
    if not prompt_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing prompt_id")
    return {"prompt_id": prompt_id, "updated": payload}
