"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import (
    availability,
    chat,
    event_types,
    integrations,
    me_bookings,
    me_entitlements,
    me_profile,
    payments,
    public_booking,
    status as status_route,
)
from chroniq.config import get_settings
from chroniq.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting chroniq API...")
    await init_db()
    logger.info("Database reachable")
    yield
    logger.info("Shutting down chroniq API...")


app = FastAPI(
    title="chroniq.cc API",
    description="Scheduling & booking platform API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_API = "/api/v1"
app.include_router(status_route.router, prefix=_API)
app.include_router(me_profile.router, prefix=_API)
app.include_router(event_types.router, prefix=_API)
app.include_router(availability.router, prefix=_API)
app.include_router(me_bookings.router, prefix=_API)
app.include_router(me_entitlements.router, prefix=_API)
app.include_router(public_booking.router, prefix=_API)
app.include_router(integrations.router, prefix=_API)
app.include_router(payments.router, prefix=_API)
app.include_router(chat.router, prefix=_API)
