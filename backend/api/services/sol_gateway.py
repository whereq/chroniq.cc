"""SOL gateway — orchestrates chroniq's AI assistant over LiteLLM.

Ported/adapted from flowdesk's NOVA LLMGateway: provider-agnostic streaming, a
bounded tool-call loop, smart light/heavy model routing, and an action-proposal
passthrough (for the confirmation cards that gate write actions in a later phase).
"""
from __future__ import annotations

import json
import logging
import time as _time
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import AsyncIterator
from zoneinfo import ZoneInfo

import litellm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from chroniq.llm_platform import (
    build_litellm_model_string,
    chat_model_for,
    is_anthropic_adaptive_model,
    is_reasoning_provider,
    strip_thinking,
)
from chroniq.models.availability import AvailabilitySchedule
from chroniq.models.user_profile import UserProfile
from api.services.tool_registry import ToolRegistry

logger = logging.getLogger(__name__)

_MAX_TOOL_ROUNDS = 6
_MAX_HISTORY = 20  # trailing turns kept (system prompt is added separately)

# Analytical cues → escalate to the heavy model (EN + ZH). Simple lookups stay light.
_HEAVY_HINTS = (
    "analyz", "analys", "compare", "plan my", "optimi", "suggest", "recommend",
    "why", "how should", "best time", "reschedule everything", "free up", "busiest",
    "summar", "overview", "strategy", "rearrange", "conflict",
)
_HEAVY_HINTS_ZH = ("分析", "对比", "比较", "建议", "推荐", "为什么", "怎么安排", "最佳", "总结", "冲突", "优化")

_SOL_PERSONA = """You are SOL, the AI scheduling assistant inside chroniq.cc — a calendar-first booking platform.
You help the signed-in host with everything about their calendar: understanding their availability, meeting types, upcoming and past bookings, and finding open time slots.

Guidelines:
- Be concise, warm, and practical. Prefer short answers and tidy lists.
- Always use the tools to ground answers in the host's real data — never invent bookings, times, or availability.
- Times from tools are the host's own timezone unless stated. When you show times, include the weekday/date for clarity.
- If the host has no event types or availability yet, gently guide them to set those up (Manage → Event Types / Availability).
- You currently can READ and explain the calendar; you cannot yet change bookings or availability. If asked to create, reschedule, or cancel, say that's coming soon and, for now, point to the relevant dashboard section.
- Match the user's language."""


class LLMError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def _last_user_text(messages: list[dict]) -> str:
    for m in reversed(messages):
        if m.get("role") == "user":
            c = m.get("content")
            return c if isinstance(c, str) else json.dumps(c)
    return ""


def _classify_heavy(messages: list[dict]) -> bool:
    last = _last_user_text(messages)
    low = last.lower()
    if any(h in low for h in _HEAVY_HINTS):
        return True
    if any(h in last for h in _HEAVY_HINTS_ZH):
        return True
    return len(last) > 260 or (low.count("?") + last.count("？")) >= 2


def _classify_rate_limit(exc: Exception) -> str:
    lower = str(exc).lower()
    if any(k in lower for k in ("insufficient_quota", "credit balance", "billing", "quota exceeded", "upgrade your plan")):
        return "quota_exhausted"
    return "rate_limit"


class SolGateway:
    def __init__(self) -> None:
        self.tool_registry = ToolRegistry()

    async def _build_system_prompt(self, db: AsyncSession, user_id: str | None, locale: str | None) -> str:
        parts = [_SOL_PERSONA]
        tz = "UTC"
        if user_id:
            profile = await db.get(UserProfile, user_id)
            sched = (
                await db.execute(
                    select(AvailabilitySchedule).where(
                        AvailabilitySchedule.keycloak_id == user_id,
                        AvailabilitySchedule.is_default.is_(True),
                    )
                )
            ).scalars().first()
            if sched and sched.timezone:
                tz = sched.timezone
            elif profile and profile.timezone:
                tz = profile.timezone
            ctx = ["\n## The host"]
            if profile:
                if profile.display_name:
                    ctx.append(f"- Name: {profile.display_name}")
                if profile.username:
                    ctx.append(f"- Booking link: chroniq.cc/{profile.username}")
            ctx.append(f"- Timezone: {tz}")
            parts.append("\n".join(ctx))
        now_local = datetime.now(timezone.utc).astimezone(ZoneInfo(tz))
        parts.append(f"\n## Now\n- Current date/time ({tz}): {now_local.strftime('%A, %Y-%m-%d %H:%M')}")
        if locale:
            parts.append(f"\n(Reply in locale: {locale}.)")
        return "\n".join(parts)

    @staticmethod
    def _apply_anthropic_cache(messages: list[dict]) -> None:
        try:
            for msg in messages:
                if msg.get("role") == "system" and isinstance(msg.get("content"), str):
                    msg["content"] = [{
                        "type": "text",
                        "text": msg["content"],
                        "cache_control": {"type": "ephemeral"},
                    }]
                    break
        except Exception as exc:  # never let caching break a chat
            logger.debug("anthropic cache setup skipped: %s", exc)

    async def stream_chat(
        self,
        *,
        provider_name: str,
        model: str,
        api_key: str,
        messages: list[dict],
        db: AsyncSession,
        user_id: str | None = None,
        locale: str | None = None,
        temperature: float = 0.5,
        max_tokens: int = 2048,
        api_base: str | None = None,
        allow_routing: bool = True,
        tool_names: list[str] | None = None,
        system_suffix: str | None = None,
        force_tier: str | None = None,
    ) -> AsyncIterator[dict]:
        system_prompt = await self._build_system_prompt(db, user_id, locale)
        if system_suffix:
            system_prompt = f"{system_prompt}\n\n{system_suffix}"

        # Smart routing: pick model tier for this turn (platform mode only).
        if allow_routing:
            heavy = force_tier == "heavy" if force_tier in ("light", "heavy") else _classify_heavy(messages)
            routed = chat_model_for(provider_name, heavy=heavy)
            if routed:
                model = routed

        litellm_model = build_litellm_model_string(provider_name, model, api_base)
        is_adaptive = provider_name == "anthropic" and is_anthropic_adaptive_model(model)

        trimmed = messages[-_MAX_HISTORY:]
        current_messages: list[dict] = [{"role": "system", "content": system_prompt}, *trimmed]
        if provider_name == "anthropic":
            self._apply_anthropic_cache(current_messages)

        tool_defs = self.tool_registry.get_definitions(tool_names)
        _t0 = _time.monotonic()

        try:
            is_first_pass = True
            tool_rounds = 0
            tools_used: list[str] = []

            while True:
                kwargs: dict = dict(
                    model=litellm_model,
                    messages=current_messages,
                    tools=tool_defs,
                    stream=True,
                    api_key=api_key,
                    max_tokens=max_tokens,
                )
                if is_adaptive:
                    kwargs["thinking"] = {"type": "adaptive"}
                else:
                    kwargs["temperature"] = temperature
                if tool_rounds >= _MAX_TOOL_ROUNDS:
                    kwargs["tool_choice"] = "none"
                if api_base:
                    kwargs["api_base"] = api_base

                response = await litellm.acompletion(**kwargs)

                full_content = ""
                tc_accum: dict[int, dict] = {}
                finish_reason = None

                async for chunk in response:
                    if not chunk.choices:
                        continue
                    choice = chunk.choices[0]
                    delta = choice.delta
                    finish_reason = choice.finish_reason

                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            slot = tc_accum.setdefault(idx, {"id": "", "type": "function", "function": {"name": "", "arguments": ""}})
                            if tc.id:
                                slot["id"] = tc.id
                            if tc.function:
                                if tc.function.name:
                                    slot["function"]["name"] += tc.function.name
                                if tc.function.arguments:
                                    slot["function"]["arguments"] += tc.function.arguments

                    if delta.content:
                        full_content += delta.content
                        if not is_first_pass:
                            yield {"delta": delta.content}

                if finish_reason == "tool_calls" and tc_accum:
                    tool_rounds += 1
                    for _tc in tc_accum.values():
                        try:
                            json.loads(_tc["function"].get("arguments") or "")
                        except Exception:
                            _tc["function"]["arguments"] = "{}"
                    ordered = [tc_accum[i] for i in sorted(tc_accum)]
                    call_objs = [
                        SimpleNamespace(id=tc["id"], function=SimpleNamespace(
                            name=tc["function"]["name"], arguments=tc["function"]["arguments"]))
                        for tc in ordered
                    ]
                    for tc in ordered:
                        if tc["function"]["name"] and tc["function"]["name"] not in tools_used:
                            tools_used.append(tc["function"]["name"])

                    tool_results = await self.tool_registry.execute(call_objs, db, user_id)

                    yield {"status": "working", "clear_content": True}
                    for tr in tool_results:
                        if tr.get("proposal"):
                            yield {"type": "action_proposal", **tr["proposal"]}

                    current_messages.append({
                        "role": "assistant",
                        "content": full_content or None,
                        "tool_calls": ordered,
                    })
                    for tr in tool_results:
                        current_messages.append({
                            "role": "tool",
                            "tool_call_id": tr["tool_call_id"],
                            "content": tr["content"],
                        })
                    is_first_pass = False
                    continue

                if is_first_pass and full_content:
                    clean = strip_thinking(full_content) if is_reasoning_provider(provider_name) else full_content
                    if clean:
                        yield {"delta": clean}
                if tools_used:
                    yield {"type": "tools_used", "tools": tools_used}
                logger.info(
                    "SOL run: model=%s rounds=%s tools=%s latency_ms=%s",
                    model, tool_rounds, tools_used, int((_time.monotonic() - _t0) * 1000),
                )
                break

        except litellm.RateLimitError as exc:
            raise LLMError(_classify_rate_limit(exc), str(exc)[:300]) from exc
        except litellm.AuthenticationError as exc:
            raise LLMError("auth_error", str(exc)[:300]) from exc
        except litellm.ContextWindowExceededError as exc:
            raise LLMError("context_too_long", str(exc)[:300]) from exc
        except Exception as exc:
            logger.error("SOL streaming error: %s", exc)
            raise LLMError("transient", str(exc)[:300]) from exc
