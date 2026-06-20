"""
HTML Templates Package
=======================

Directory layout (mirrors app/ai/prompts/):
    templates/
        email/      HTML templates for outbound emails (verification, etc.)
        docs/       HTML templates for documentation pages (ReDoc branding, etc.)

Add new template categories as their own subdirectory — keep templates grouped
by where they're rendered, not by which feature created them.
"""

from app.templates.loader import loader, render_template

__all__ = ["loader", "render_template"]
