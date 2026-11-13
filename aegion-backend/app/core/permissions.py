from fastapi import Depends, HTTPException, Header, status


def require_role(allowed_roles: list[str]):
    async def role_checker(x_aegion_role: str = Header(default="builder")):
        if x_aegion_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for protected Aegion resource.",
            )
        return x_aegion_role

    return role_checker
