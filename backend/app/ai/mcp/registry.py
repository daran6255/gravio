"""
AI Engine — Tool Registry
==========================

Central registry for MCP-compatible AI tools.
Handles tool discovery, filtering, and prompt generation.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from app.ai.brain.schemas import ToolDefinition
from app.ai.mcp.base_tool import BaseTool

logger = logging.getLogger(__name__)


class ToolRegistry:
    """
    Central repository for AI Tools.
    """

    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}
        logger.info("ToolRegistry initialized.")

    def register(self, tool: BaseTool) -> None:
        """Register a tool instance."""
        name = tool.definition.name
        self._tools[name] = tool
        logger.debug(f"Registered tool: {name} [{tool.definition.category}]")

    def get(self, name: str) -> BaseTool:
        """Retrieve a tool by name."""
        if name not in self._tools:
            from app.ai.brain.exceptions import ToolNotFoundError
            raise ToolNotFoundError(name)
        return self._tools[name]

    def all(self) -> List[BaseTool]:
        """Return all registered tools."""
        return list(self._tools.values())

    def to_prompt_block(self, categories: List[str] | None = None) -> str:
        """
        Generates the formatted tool block for LLM system prompts.
        """
        tools = self.all() if not categories else [
            t for t in self._tools.values() if t.definition.category in categories
        ]

        if not tools:
            return "(No tools available)"

        blocks = []
        for tool in sorted(tools, key=lambda t: (t.definition.category, t.definition.name)):
            d = tool.definition
            param_lines = []
            for pname, pschema in d.parameters.items():
                required_tag = "(required)" if pname in d.required_parameters else "(optional)"
                enum_tag = f" One of: {pschema.enum}" if pschema.enum else ""
                param_lines.append(f"    - {pname} ({pschema.type}, {required_tag}): {pschema.description}{enum_tag}")

            param_section = "\n".join(param_lines) if param_lines else "    (none)"
            read_only_tag = " [READ-ONLY]" if d.is_read_only else ""
            approval_tag = " [REQUIRES HUMAN APPROVAL]" if d.requires_approval else ""

            blocks.append(
                f"TOOL: {d.name}{read_only_tag}{approval_tag}\n"
                f"DESCRIPTION: {d.description}\n"
                f"CATEGORY: {d.category}\n"
                f"PARAMETERS:\n{param_section}"
            )

        return "\n---\n".join(blocks)

    def count(self) -> int:
        return len(self._tools)


# Singleton Registry Instance
registry = ToolRegistry()
