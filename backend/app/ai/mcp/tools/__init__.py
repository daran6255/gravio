"""
AI Engine — Tools package.

All tool modules import and register into the global registry at import time.
Add new tools by creating a new module in this package and importing it here.

Phase 2: crm_tools (create_lead, create_contact, create_company, ...)
Phase 3: placement_tools, training_tools
Phase 4: candidate_tools, hr_tools
Phase 5: notification_tools
"""

# Tools are loaded on-demand by importing this package.
# Each tool module self-registers via: from app.ai.tool_registry import registry
from . import crm_tools
from . import placement_tools
from . import candidate_tools
from . import operational_tools
