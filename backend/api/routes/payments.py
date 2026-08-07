"""Stripe payments — checkout + billing portal + webhook → Keycloak tier role.

Checkout grants a ch-tier-* realm role; canceling the subscription revokes it
(auto-downgrade). The Billing Portal lets the user self-serve manage/cancel.
"""

import logging
from typing import Literal

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.services import keycloak_admin
from chroniq.auth import CurrentUser
from chroniq.config import get_settings
from chroniq.database import get_db
from chroniq.models.user_profile import UserProfile

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


class UrlResponse(BaseModel):
    url: str


async def _update_profile_billing(
    db: AsyncSession,
    user_id: str,
    *,
    customer_id: str | None = None,
    remove_branding: bool | None = None,
) -> None:
    """Best-effort sync of billing state onto the host profile: the Stripe
    customer id (for the portal) and the branding flag the public page reads.
    No-op if the profile row is absent."""
    profile = await db.get(UserProfile, user_id)
    if profile is None:
        return
    if customer_id:
        profile.stripe_customer_id = customer_id
    if remove_branding is not None:
        profile.remove_branding = remove_branding
    await db.commit()


@router.post("/me/payments/checkout", response_model=UrlResponse)
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
        # Stamp the Keycloak id onto the subscription so a later
        # customer.subscription.deleted event knows whose role to revoke.
        subscription_data={"metadata": {"keycloak_id": user["sub"]}},
        success_url=f"{s.public_base_url}/dashboard?checkout=success",
        cancel_url=f"{s.public_base_url}/dashboard?checkout=cancel",
    )
    return UrlResponse(url=session.url)


@router.post("/me/payments/portal", response_model=UrlResponse)
async def customer_portal(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Return a Stripe Billing Portal URL so the user can manage/cancel their
    subscription and update their card themselves."""
    s = get_settings()
    if not s.stripe_secret_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Payments not configured")

    profile = await db.get(UserProfile, user["sub"])
    if profile is None or not profile.stripe_customer_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active subscription")

    stripe.api_key = s.stripe_secret_key
    portal = stripe.billing_portal.Session.create(
        customer=profile.stripe_customer_id,
        return_url=f"{s.public_base_url}/dashboard",
    )
    return UrlResponse(url=portal.url)


@router.post("/payments/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    s = get_settings()
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, s.stripe_webhook_secret)
    except Exception as exc:
        logger.warning("Stripe webhook verification failed: %s", exc)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid signature")

    etype = event["type"]
    obj = event["data"]["object"]

    if etype == "checkout.session.completed":
        # Subscription started → grant the tier role + record the customer id.
        stripe.api_key = s.stripe_secret_key
        user_id = obj.get("client_reference_id")
        customer_id = obj.get("customer")
        line_items = stripe.checkout.Session.list_line_items(obj["id"], limit=1)
        price_id = line_items["data"][0]["price"]["id"] if line_items["data"] else None
        role = _price_to_role().get(price_id)
        if user_id and role:
            await keycloak_admin.assign_realm_role(user_id, role)
            await _update_profile_billing(db, user_id, customer_id=customer_id, remove_branding=True)
            logger.info("Granted %s to %s (subscription started)", role, user_id)

    elif etype == "customer.subscription.deleted":
        # Subscription canceled/ended → revoke the tier role (downgrade to Free)
        # and re-show the public "Powered by" badge.
        user_id = (obj.get("metadata") or {}).get("keycloak_id")
        items = (obj.get("items") or {}).get("data") or []
        price_id = items[0]["price"]["id"] if items else None
        role = _price_to_role().get(price_id)
        if user_id and role:
            await keycloak_admin.remove_realm_role(user_id, role)
            await _update_profile_billing(db, user_id, remove_branding=False)
            logger.info("Revoked %s from %s (subscription canceled)", role, user_id)

    return {"received": True}
