"""
AI Engine — Prompt Template Loader
==================================

Robust Jinja2-based template loader for AI prompts. Supports variable
injection, conditional logic, and automatic inclusion of knowledge
reference files (e.g., skills.md).
"""

import os
import logging
from typing import Any, Dict
from jinja2 import Environment, FileSystemLoader, TemplateNotFound

logger = logging.getLogger(__name__)

class PromptLoader:
    """
    Loads and renders AI prompt templates from the prompts directory.
    """

    def __init__(self):
        # Base directory: backend/app/ai/prompts
        self._base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Initialize Jinja2 environment
        self._env = Environment(
            loader=FileSystemLoader(self._base_dir),
            trim_blocks=True,
            lstrip_blocks=True,
            autoescape=False, # Prompts are plain text, not HTML
        )
        
        # Cache for loaded reference knowledge (skills.md, etc.)
        self._knowledge_cache: Dict[str, str] = {}

    def render(self, template_path: str, variables: Dict[str, Any] = None) -> str:
        """
        Loads a template from the filesystem and renders it with variables.
        
        Args:
            template_path: Relative path from prompts/ (e.g. 'system/aria_planner.md')
            variables: Context variables to inject into the template
            
        Returns:
            The rendered prompt string
        """
        try:
            template = self._env.get_template(template_path)
            
            # Automatically inject knowledge references if requested by the template
            # (or we can just inject them by default if they are common)
            context = variables or {}
            
            # Example: Always provide 'skills_ref' if not explicitly provided
            if "skills_ref" not in context:
                context["skills_ref"] = self.load_knowledge("skills.md")
            
            return template.render(**context)
            
        except TemplateNotFound:
            logger.error(f"AI Prompt template not found: {template_path}")
            raise FileNotFoundError(f"Prompt template '{template_path}' not found in {self._base_dir}")
        except Exception as e:
            logger.error(f"Error rendering prompt '{template_path}': {str(e)}")
            raise

    def load_knowledge(self, filename: str) -> str:
        """
        Loads a reference file from prompts/knowledge/.
        Caches the result in memory.
        """
        if filename in self._knowledge_cache:
            return self._knowledge_cache[filename]
            
        path = os.path.join(self._base_dir, "knowledge", filename)
        if not os.path.exists(path):
            # Fallback to root prompts dir for backward compatibility
            path = os.path.join(self._base_dir, filename)
            
        if not os.path.exists(path):
            logger.warning(f"Knowledge file not found: {filename}")
            return ""
            
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                self._knowledge_cache[filename] = content
                return content
        except Exception as e:
            logger.error(f"Failed to load knowledge file '{filename}': {str(e)}")
            return ""

# Singleton instance
loader = PromptLoader()

def render_prompt(path: str, variables: Dict[str, Any] = None) -> str:
    """Helper for legacy-style calls."""
    return loader.render(path, variables)
