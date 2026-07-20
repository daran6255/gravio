"""
AI Engine — Extraction Service (Simplified & Decoupled)
======================================================

Handles structured data extraction from unstructured sources (JDs, Resumes).
Uses the Jinja2 PromptLoader and the AI Provider system.
"""

import json
import logging
from typing import Any, Dict, Optional

from app.ai.providers import get_llm_provider
from app.ai.prompts.loader import loader
from app.ai.brain.exceptions import LLMProviderError
from app.core.constants import DISABILITY_TYPES, QUALIFICATIONS, COMMON_SKILLS

logger = logging.getLogger(__name__)

class JobRoleExtractionService:
    """
    Service for extracting Job Role details from JDs.
    """

    def __init__(self, db, user):
        self._db = db
        self._user = user

    async def extract_from_source(self, jd_text: str = None, pdf_file: bytes = None) -> Dict[str, Any]:
        """
        Extracts structured job role data from text or PDF.
        """
        # 1. Prepare source text
        source_text = jd_text or ""
        if pdf_file:
            import io
            import PyPDF2
            try:
                reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
                pdf_text = ""
                for page in reader.pages:
                    pdf_text += page.extract_text() + "\n"
                source_text = (jd_text + "\n" + pdf_text) if jd_text else pdf_text
            except Exception as e:
                logger.error(f"Failed to extract text from PDF: {str(e)}")

        if not source_text.strip():
            raise ValueError("No text provided for extraction.")

        # 2. Prepare & Truncate source text
        source_text = self._truncate_source_text(source_text)

        # 3. Render Prompt using Jinja2
        system_prompt = loader.render("extraction/job_role_extraction.md", {
            "DISABILITY_TYPES": DISABILITY_TYPES,
            "QUALIFICATIONS": QUALIFICATIONS,
            "COMMON_SKILLS": COMMON_SKILLS
        })

        # 3. Call LLM
        provider = await get_llm_provider(
            self._db, org_id=self._user.organization_id, user_id=self._user.id,
            action_type="jd_extraction",
        )
        response = await provider.complete(
            system_prompt=system_prompt,
            user_message=f"Analyze this JD and extract the fields:\n\n{source_text}",
            temperature=0.1
        )

        # 4. Parse & Clean
        try:
            extracted_data = self._parse_json(response.content)
            extracted_data = await self._post_process(extracted_data)
        except Exception as e:
            logger.error(f"Failed to parse extraction response: {str(e)}")
            raise ValueError("AI failed to return valid structured data. Please try again.")

        # 5. Domain Lookups (Suggestions) - stubbed to prevent DB errors
        suggestions = await self._generate_suggestions(extracted_data)

        return {
            "data": extracted_data,
            "suggestions": suggestions,
            "raw_content": response.content
        }

    def _parse_json(self, content: str) -> Dict[str, Any]:
        """Robustly extracts JSON from LLM response."""
        import re
        content = content.strip()
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1).strip())
        
        first_brace = content.find('{')
        last_brace = content.rfind('}')
        if first_brace != -1 and last_brace != -1:
            return json.loads(content[first_brace:last_brace+1])
            
        return json.loads(content)

    async def _post_process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Final validation of extracted data (stubbed).
        """
        return data

    async def _generate_suggestions(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Finds matching company/contact IDs in the DB (stubbed)."""
        company_name = data.get("company_name")
        contact_name = data.get("contact_name")

        return {
            "company_id": None,
            "company_name": company_name,
            "contact_id": None,
            "contact_name": contact_name,
        }

    def _truncate_source_text(self, text: str, max_chars: int = 8000) -> str:
        """Truncates source text to stay within LLM provider limits."""
        if len(text) <= max_chars:
            return text
        
        logger.warning(f"Source text truncated from {len(text)} to {max_chars} characters.")
        return text[:max_chars] + "\n... [TRUNCATED DUE TO SIZE] ..."


class CandidateExtractionService:
    """
    Service for extracting Candidate details from Resumes.
    """

    def __init__(self, db, user):
        self._db = db
        self._user = user

    async def extract_from_source(
        self, 
        resume_text: str = None, 
        pdf_file: bytes = None,
        document_id: int = None
    ) -> Dict[str, Any]:
        """
        Extracts structured candidate data from text, PDF bytes.
        """
        if document_id:
            raise ValueError("Document lookup is disabled.")

        source_text = resume_text or ""

        if pdf_file:
            import io
            import PyPDF2
            try:
                reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
                pdf_text = ""
                for page in reader.pages:
                    pdf_text += page.extract_text() + "\n"
                source_text = (resume_text + "\n" + pdf_text) if resume_text else pdf_text
            except Exception as e:
                logger.error(f"Failed to extract text from PDF: {str(e)}")

        if not source_text.strip():
            raise ValueError("No text provided for extraction.")

        # 2. Prepare & Truncate source text
        source_text = self._truncate_source_text(source_text)

        # 3. Render Prompt using Jinja2
        system_prompt = loader.render("extraction/candidate_extraction.md", {
            "DISABILITY_TYPES": DISABILITY_TYPES,
            "QUALIFICATIONS": QUALIFICATIONS,
            "COMMON_SKILLS": COMMON_SKILLS
        })

        # 3. Call LLM
        provider = await get_llm_provider(
            self._db, org_id=self._user.organization_id, user_id=self._user.id,
            action_type="candidate_extraction",
        )
        response = await provider.complete(
            system_prompt=system_prompt,
            user_message=f"Analyze this Resume and extract the fields:\n\n{source_text}",
            temperature=0.1
        )

        # 4. Parse & Clean
        try:
            extracted_data = self._parse_json(response.content)
            extracted_data = await self._post_process(extracted_data)
        except Exception as e:
            logger.error(f"Failed to parse extraction response: {str(e)}")
            raise ValueError("AI failed to return valid structured data. Please try again.")

        return {
            "data": extracted_data,
            "raw_content": response.content
        }

    def _parse_json(self, content: str) -> Dict[str, Any]:
        """Robustly extracts JSON from LLM response."""
        import re
        content = content.strip()
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1).strip())
        
        first_brace = content.find('{')
        last_brace = content.rfind('}')
        if first_brace != -1 and last_brace != -1:
            return json.loads(content[first_brace:last_brace+1])
            
        return json.loads(content)

    async def _post_process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return data

    def _truncate_source_text(self, text: str, max_chars: int = 8000) -> str:
        if len(text) <= max_chars:
            return text
        
        logger.warning(f"Source text truncated from {len(text)} to {max_chars} characters.")
        return text[:max_chars] + "\n... [TRUNCATED DUE TO SIZE] ..."


class SkillRecommendationService:
    """
    Service for identifying skill gaps and recommending tags.
    """

    def __init__(self, db, user):
        self._db = db
        self._user = user

    async def get_recommendations(self, candidate_skills: list[str]) -> list[str]:
        """
        Suggests high-demand skills the candidate might be missing (stubbed).
        """
        return []
