"""SOL chat endpoint — streaming AI assistant over SSE.

Phase 1: authenticated, platform-mode only, stateless (no persistence yet), with
read-only calendar tools. Gating (free-trial → Pro) and write actions come in
later phases.
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.services.sol_gateway import LLMError, SolGateway
from chroniq.auth import CurrentUser
from chroniq.database import get_db
from chroniq.llm_platform import provider_api_base, resolve_platform_provider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["sol"])


class MessageIn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[MessageIn]
    locale: str | None = None


@router.get("/available")
async def sol_available() -> dict:
    """Whether SOL has an LLM provider configured (frontend gates the UI on this)."""
    try:
        resolve_platform_provider()
        return {"available": True}
    except ValueError:
        return {"available": False}


@router.post("")
async def chat(request: ChatRequest, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    try:
        provider, model, api_key = resolve_platform_provider()
    except ValueError:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "SOL is not configured")

    api_base = provider_api_base(provider)
    gateway = SolGateway()
    user_id = user["sub"]
    msgs = [m.model_dump() for m in request.messages]

    async def event_stream():
        try:
            async for chunk in gateway.stream_chat(
                provider_name=provider,
                model=model,
                api_key=api_key,
                messages=msgs,
                db=db,
                user_id=user_id,
                locale=request.locale,
                allow_routing=True,
                api_base=api_base,
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
            yield "data: [DONE]\n\n"
        except LLMError as exc:
            logger.error("SOL LLM error [%s]: %s", exc.code, exc)
            yield f"data: {json.dumps({'error_code': exc.code, 'error': str(exc)})}\n\n"
        except Exception as exc:  # noqa: BLE001
            logger.error("SOL chat error: %s", exc)
            yield f"data: {json.dumps({'error_code': 'transient', 'error': str(exc)[:300]})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store"},
    )
