"""
AI Engine — Modular "Brain" Architecture
========================================

Public API facade for the WinVinaya AI Engine.
Provides unified access to the core engine, services, and providers.
"""

from app.ai.brain.engine import AIEngine
from app.ai.brain.planner import Planner
from app.ai.brain.journal import TaskJournal
from app.ai.providers import get_llm_provider, LLMProvider
from app.ai.mcp.registry import registry
from app.ai.mcp.base_tool import BaseTool
from app.ai.prompts.loader import loader as prompt_loader

__all__ = [
    "AIEngine",
    "Planner",
    "TaskJournal",
    "get_llm_provider",
    "LLMProvider",
    "registry",
    "BaseTool",
    "prompt_loader",
]
