"""Shared LLM utilities for SOL (chroniq's AI assistant).

Provider-agnostic via LiteLLM. Ported from the flowdesk/NOVA platform layer:
  1. Provider resolution — which provider/key to use for platform (non-BYOK) calls
  2. Chat model tiers — a cheap "light" model for simple asks, escalated to a
     "heavy" reasoning model for analytical/multi-step questions (smart routing).

Kept free of API-layer imports so it can be imported anywhere without side effects.
"""
from __future__ import annotations

import logging
import os
import re
from typing import Any

from chroniq.config import get_settings

logger = logging.getLogger(__name__)

# Default model per provider (platform mode) — cheap/fast defaults.
DEFAULT_MODELS: dict[str, str] = {
    "openai":    "gpt-4o-mini",
    "anthropic": "claude-haiku-4-5-20251001",
    "google":    "gemini-2.0-flash",
    "deepseek":  "deepseek-chat",
    "qwen":      "qwen-plus",
    "minimax":   "MiniMax-M3",
}

# Chat tiers — light = simple lookups; heavy = analytical/multi-step (escalated).
# Same provider/key/base; only the model id changes, so escalation never switches
# credentials.
CHAT_LIGHT_MODELS: dict[str, str] = dict(DEFAULT_MODELS)
CHAT_HEAVY_MODELS: dict[str, str] = {
    "openai":    "gpt-4o",
    "anthropic": "claude-opus-4-8",
    "google":    "gemini-2.5-pro",
    "deepseek":  "deepseek-reasoner",
    "qwen":      "qwen-max",
    "minimax":   "MiniMax-M2.7",
}


def chat_model_for(provider: str, *, heavy: bool) -> str:
    table = CHAT_HEAVY_MODELS if heavy else CHAT_LIGHT_MODELS
    return table.get(provider) or DEFAULT_MODELS.get(provider, "")


def is_anthropic_adaptive_model(model: str) -> bool:
    """True for Anthropic models that use adaptive thinking and reject
    temperature (Opus 4.x, Fable 5, Sonnet 4.6)."""
    m = model.lower()
    return any(tag in m for tag in ("claude-opus-4", "claude-fable-5", "claude-sonnet-4-6"))


# Settings attribute holding each provider's API key.
KEY_MAP: dict[str, str] = {
    "openai":    "openai_api_key",
    "anthropic": "anthropic_api_key",
    "google":    "google_ai_api_key",
    "deepseek":  "deepseek_api_key",
    "qwen":      "qwen_api_key",
    "minimax":   "minimax_api_key",
}

# Auto-selection order when platform_llm_provider is not set.
PROVIDER_ORDER: list[str] = ["anthropic", "openai", "google", "deepseek", "qwen", "minimax"]

# Providers that wrap output in <think>…</think> reasoning blocks.
_REASONING_PROVIDERS: frozenset[str] = frozenset({"deepseek", "minimax"})

# LiteLLM model-string prefix per provider (native routing).
_MODEL_PREFIX: dict[str, str] = {
    "openai":    "openai/",
    "anthropic": "anthropic/",
    "google":    "gemini/",
    "deepseek":  "deepseek/",
    "qwen":      "qwen/",
    "minimax":   "minimax/",
}

# Custom api_base overrides (MiniMax global platform API).
_API_BASE_OVERRIDES: dict[str, str] = {
    "minimax": "https://api.minimax.io/v1",
}


def resolve_platform_provider() -> tuple[str, str, str]:
    """Return (provider, default_model, api_key) for the configured platform provider.

    Respects platform_llm_provider; else falls back to the first provider with a
    configured key in PROVIDER_ORDER. Raises ValueError if none configured.
    """
    settings = get_settings()
    explicit = (settings.platform_llm_provider or "").strip().lower()
    order = [explicit] if explicit and explicit in KEY_MAP else PROVIDER_ORDER

    for name in order:
        key = getattr(settings, KEY_MAP[name], "")
        if key:
            _apply_provider_env(name, settings)
            return name, DEFAULT_MODELS[name], key

    raise ValueError(
        "No platform LLM provider configured. Set at least one *_API_KEY "
        "and optionally PLATFORM_LLM_PROVIDER."
    )


def _apply_provider_env(name: str, settings: Any) -> None:
    if name == "minimax" and getattr(settings, "minimax_group_id", ""):
        os.environ["MINIMAX_GROUP_ID"] = settings.minimax_group_id


def provider_api_base(provider: str) -> str | None:
    return _API_BASE_OVERRIDES.get(provider)


def build_litellm_model_string(provider: str, model: str, api_base: str | None = None) -> str:
    if api_base:
        return f"openai/{model}"  # OpenAI-compatible mode for custom endpoints
    return f"{_MODEL_PREFIX.get(provider, provider + '/')}{model}"


def is_reasoning_provider(provider: str) -> bool:
    return provider in _REASONING_PROVIDERS


def strip_thinking(text: str) -> str:
    """Remove <think>…</think> reasoning blocks from LLM output."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
