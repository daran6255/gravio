"""
AI Engine — LLM Task Planner
==============================

Responsible for:
  1. Building the structured system prompt (tool list + persona)
  2. Sending the task request to the LLM provider
  3. Parsing the LLM JSON response into a validated ToolCallPlan

Refactored to use the Jinja2 PromptLoader.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from app.ai.brain.exceptions import (
    LLMProviderError,
    LLMResponseParseError,
    PlanningError,
)
from app.ai.prompts.loader import loader
from app.ai.brain.schemas import ToolCallPlan, ToolCallRequest
from app.ai.brain.memory import BrainMemory

if TYPE_CHECKING:
    from app.ai.providers import LLMProvider
    from app.ai.mcp.registry import ToolRegistry

logger = logging.getLogger(__name__)


class Planner:
    """
    Converts a task description + context into a structured ToolCallPlan.
    """

    def __init__(self, provider: 'LLMProvider', registry: 'ToolRegistry', db: Optional['AsyncSession'] = None) -> None:
        self._provider = provider
        self._registry = registry
        self._memory = BrainMemory(db) if db else None

    async def plan(
        self,
        task_hint: str,
        input_data: dict,
        history: list[dict] | None = None,
        context_snapshot: dict | None = None,
        allowed_categories: list[str] | None = None,
        system_prompt_override: str | None = None,
    ) -> ToolCallPlan:
        """
        Generate a tool execution plan for the given task.
        """
        # Render prompt using Jinja2
        if system_prompt_override:
            # If override is provided, we use it directly (legacy support)
            system_prompt = system_prompt_override.format(
                tool_block=self._registry.to_prompt_block(categories=allowed_categories)
            )
        else:
            # Use the new Jinja2 loader
            system_prompt = loader.render("system/aria_planner.md", {
                "tool_block": self._registry.to_prompt_block(categories=allowed_categories)
            })

        # Retrieval Phase — Learn from past successes
        past_examples = []
        if self._memory:
            past_examples = await self._memory.get_similar_successful_tasks(task_hint)

        user_message = self._build_user_message(task_hint, input_data, history, context_snapshot, past_examples)

        logger.info("Planner → LLM request: task='%s'", task_hint[:100])

        llm_response = await self._provider.complete(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=0.1,
            max_tokens=4096,
        )

        plan = self._parse_response(llm_response.content)

        logger.info(
            "Planner → Plan ready: steps=%d, impact=%d",
            len(plan.steps), plan.estimated_record_impact
        )
        return plan

    # ── Private Methods ───────────────────────────────────────────────────────

    def _build_user_message(
        self,
        task_hint: str,
        input_data: dict,
        history: list[dict] | None = None,
        context_snapshot: dict | None = None,
        past_examples: list[dict] | None = None,
    ) -> str:
        parts = []
        
        if past_examples:
            parts.append("## Learning from Experience (Previous Successes)")
            parts.append("The following are examples of how similar tasks were successfully executed in the past. Use them to maintain consistency.")
            for ex in past_examples:
                parts.append(f"- Task: {ex['task']}")
                parts.append(f"  Execution Plan: {json.dumps(ex['plan'])}")
                parts.append(f"  Outcome: {ex['outcome']}\n")
            parts.append("---\n")

        if history:
            parts.append("## Conversation History")
            for msg in history:
                role = msg.get("role", "user").upper()
                content = msg.get("content", "")
                parts.append(f"<{role}>: {content}")
            parts.append("---\n")
            
        parts.append(f"## Current Task\n{task_hint}\n")

        if input_data:
            parts.append(f"## Input Data\n```json\n{json.dumps(input_data, indent=2)}\n```\n")

        if context_snapshot:
            parts.append(
                f"## Existing Context (from DB)\n"
                f"```json\n{json.dumps(context_snapshot, indent=2)}\n```\n"
            )
            parts.append(
                "IMPORTANT: Use the above context to avoid creating duplicates. "
                "If a record already exists, UPDATE it rather than creating a new one.\n"
            )

        parts.append(
            "Now produce the JSON plan. "
            "Return ONLY the JSON object — no markdown fences, no explanation text."
        )
        return "\n".join(parts)

    def _parse_response(self, raw: str) -> ToolCallPlan:
        """Parse and validate the LLM's JSON response into a ToolCallPlan."""
        raw_strip = raw.strip()
        
        # Robust JSON extraction
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_strip, re.DOTALL)
        if json_match:
            cleaned = json_match.group(1).strip()
        else:
            first_brace = raw_strip.find('{')
            last_brace = raw_strip.rfind('}')
            if first_brace != -1 and last_brace != -1:
                cleaned = raw_strip[first_brace:last_brace+1].strip()
            else:
                cleaned = raw_strip

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            raise LLMResponseParseError(raw)

        # Validate required keys
        missing = [k for k in ("task_name", "reasoning", "steps") if k not in data]
        if missing:
            raise PlanningError(f"LLM response missing required fields: {missing}")

        # Normalize reasoning
        raw_reasoning = data.get("reasoning", "")
        reasoning = " ".join(str(r) for r in raw_reasoning) if isinstance(raw_reasoning, list) else str(raw_reasoning)

        steps = [
            ToolCallRequest(
                tool_name=step["tool_name"],
                parameters=step.get("parameters", {}),
                reasoning=step.get("reasoning"),
            )
            for step in data["steps"]
        ]

        return ToolCallPlan(
            task_name=data["task_name"],
            reasoning=reasoning,
            response_to_user=data.get("response_to_user"),
            steps=steps,
            estimated_record_impact=data.get("estimated_record_impact", 0),
        )
