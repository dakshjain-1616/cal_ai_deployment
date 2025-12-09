from fastapi import APIRouter
from models.schemas import AnonymousSessionResponse

router = APIRouter(tags=["auth"])

@router.post("/auth/anonymous-session", response_model=AnonymousSessionResponse)
async def create_anonymous_session():
    """
    Auth/session disabled: return a static demo token and user.

    This completely removes DB and session logic from this endpoint so it
    cannot 500 due to database issues on Vercel. The rest of the API uses
    a shared 'demo_user' via verify_token, so this token is effectively a
    dummy value kept only to satisfy existing mobile/web client code.
    """
    return AnonymousSessionResponse(token="demo-token", user_id="demo_user")