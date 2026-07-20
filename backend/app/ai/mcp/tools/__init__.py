"""
AI Engine — Tools package.

Importing this package must import every tool module below, so each tool's
`registry.register(...)` call at module scope actually runs. A tool file that
exists but isn't imported here is silently invisible to the planner.
"""

from app.ai.mcp.tools import productivity  # noqa: F401

