"""Stripe payments — checkout session + webhook → Keycloak tier role.

Ported skeleton of the flowdesk pattern. Fill in Stripe keys + price ids in
settings to activate. The webhook assigns a ch-tier-* realm role on success.
"""

import logging
from typing import Literal

import stripe
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from api.services import keycloak_admin
from chroniq.auth import CurrentUser
from chroniq.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["payments"])

# Plan name (from the frontend) → (Stripe price setting attr, realm role granted).
_PLANS = {
    "tier-1": ("stripe_price_tier_1", "ch-tier-1"),
    "tier-2": ("stripe_price_tier_2", "ch-tier-2"),
}


def _price_to_role() -> dict[str, str]:
    """Maps a configured Stripe price id → the realm role granted on payment."""
    s = get_settings()
    mapping = {}
    for price_attr, role in _PLANS.values():
        price_id = getattr(s, price_attr)
        if price_id:
            mapping[price_id] = role
    return mapping


class CheckoutRequest(BaseModel):
    plan: Literal["tier-1", "tier-2"]


class CheckoutResponse(BaseModel):
    url: str


@router.post("/me/payments/checkout", response_model=CheckoutResponse)
async def create_checkout(payload: CheckoutRequest, user: CurrentUser):
    s = get_settings()
    if not s.stripe_secret_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Payments not configured")

    price_attr, _role = _PLANS[payload.plan]
    price_id = getattr(s, price_attr)
    if not price_id:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "This plan is not configured")

    stripe.api_key = s.stripe_secret_key
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        client_reference_id=user["sub"],
        success_url=f"{s.public_base_url}/dashboard?checkout=success",
        cancel_url=f"{s.public_base_url}/?checkout=cancel",
    )
    return CheckoutResponse(url=session.url)


@router.post("/payments/webhook")
async def stripe_webhook(request: Request):
    s = get_settings()
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, s.stripe_webhook_secret)
    except Exception as exc:
        logger.warning("Stripe webhook verification failed: %s", exc)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        # Resolve the purchased price → role.
        line_items = stripe.checkout.Session.list_line_items(session["id"], limit=1)
        price_id = line_items["data"][0]["price"]["id"] if line_items["data"] else None
        role = _price_to_role().get(price_id)
        if user_id and role:
            await keycloak_admin.assign_realm_role(user_id, role)

    return {"received": True}
