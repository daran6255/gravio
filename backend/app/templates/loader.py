"""
HTML Template Loader
=====================

Jinja2-based loader for HTML templates (emails, and any future HTML output)
stored under backend/app/templates/. Mirrors the pattern used by
app/ai/prompts/loader.py, but with autoescape enabled since these templates
render HTML rather than plain text — protects against XSS if any rendered
value ever originates from user input (e.g. a full_name).
"""

import os
import logging
from typing import Any
from jinja2 import Environment, FileSystemLoader, TemplateNotFound, select_autoescape

logger = logging.getLogger(__name__)


class TemplateLoader:
    """Loads and renders HTML templates from the templates directory."""

    def __init__(self):
        # Base directory: backend/app/templates
        self._base_dir = os.path.dirname(os.path.abspath(__file__))

        self._env = Environment(
            loader=FileSystemLoader(self._base_dir),
            autoescape=select_autoescape(["html"]),
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def render(self, template_path: str, **variables: Any) -> str:
        """Render a template by its path relative to app/templates/.

        Args:
            template_path: Relative path from templates/ (e.g. 'email/verification.html')
            variables: Context variables to inject into the template

        Returns:
            The rendered HTML string
        """
        try:
            template = self._env.get_template(template_path)
            return template.render(**variables)
        except TemplateNotFound:
            logger.error(f"Template not found: {template_path}")
            raise FileNotFoundError(f"Template '{template_path}' not found in {self._base_dir}")
        except Exception as e:
            logger.error(f"Error rendering template '{template_path}': {str(e)}")
            raise


# Singleton instance
loader = TemplateLoader()


def render_template(path: str, **variables: Any) -> str:
    """Helper for simple call sites — see TemplateLoader.render."""
    return loader.render(path, **variables)
