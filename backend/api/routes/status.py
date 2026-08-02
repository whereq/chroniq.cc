"""Health / status endpoints (unauthenticated)."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from chroniq.database import get_db

router = APIRouter(tags=["status"])


@router.get("/health")
async def health() -> dict:
    """Liveness probe for Docker — must pass without a token or DB."""
    return {"status": "ok", "service": "chroniq-api"}


@router.get("/ready")
async def ready(db: AsyncSession = Depends(get_db)) -> dict:
    """Readiness probe — verifies DB connectivity."""
    await db.execute(text("SELECT 1"))
    return {"status": "ready"}
