from typing import Optional, List, Callable
from fastapi import Header, HTTPException, status, Depends
from app.models.users import CampusUser
from app.services.auth_service import auth_service
from app.services.users_service import users_service


async def get_current_user_optional(
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> Optional[CampusUser]:
    """Extracts authenticated user from Authorization Bearer header if present."""
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    payload = auth_service.decode_token(token.strip())
    if not payload:
        return None

    user = users_service.get_user(payload.get("sub") or payload.get("netid", ""))
    if not user:
        return None

    # If the token has a specific session specialization, attach it
    if payload.get("specialization"):
        user = user.model_copy(update={"specialization": payload.get("specialization")})

    return user


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> CampusUser:
    """Strictly requires a valid Authorization Bearer header, raising 401 if missing or invalid."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = auth_service.decode_token(token.strip())
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is invalid or has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = users_service.get_user(payload.get("sub") or payload.get("netid", ""))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("specialization"):
        user = user.model_copy(update={"specialization": payload.get("specialization")})

    return user


def require_roles(allowed_roles: List[str]) -> Callable:
    """Dependency factory that enforces role-based access control (RBAC)."""
    async def role_checker(current_user: CampusUser = Depends(get_current_user)) -> CampusUser:
        # Note: host role always has admin access
        user_role = current_user.role
        is_allowed = user_role in allowed_roles or (user_role == "host" and ("admin" in allowed_roles or "host" in allowed_roles))
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{current_user.role}' is not authorized to access this resource. Allowed roles: {allowed_roles}",
            )
        return current_user

    return role_checker


async def require_host(current_user: CampusUser = Depends(get_current_user)) -> CampusUser:
    """Strict Host / Admin role check."""
    if current_user.role not in ["host", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Host / Administrator privileges required.",
        )
    return current_user


async def require_technician_or_host(current_user: CampusUser = Depends(get_current_user)) -> CampusUser:
    """Technician or Host role check."""
    if current_user.role not in ["technician", "admin", "host"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Technician or Host privileges required.",
        )
    return current_user
