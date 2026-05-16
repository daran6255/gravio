"""
AI Engine — Extraction Service
==============================

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
from app.repositories.company_repository import CompanyRepository
from app.repositories.contact_repository import ContactRepository
from app.repositories.skill_repository import SkillRepository

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
                # Continue with jd_text if available

        if not source_text.strip():
            raise ValueError("No text provided for extraction.")

        # 2. Prepare & Truncate source text
        source_text = self._truncate_source_text(source_text)

        # 3. Render Prompt using Jinja2
        # Note: 'skills_ref' is automatically injected by the loader
        system_prompt = loader.render("extraction/job_role_extraction.md", {
            "DISABILITY_TYPES": DISABILITY_TYPES,
            "QUALIFICATIONS": QUALIFICATIONS,
            "COMMON_SKILLS": COMMON_SKILLS
        })

        # 3. Call LLM
        provider = await get_llm_provider(self._db)
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

        # 5. Domain Lookups (Suggestions)
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
        Final validation of extracted data.
        The LLM does the 'thinking', the code just ensures DB compatibility.
        """
        requirements = data.get("requirements", {})
        if requirements:
            # Sync skills with DB (create if missing)
            data = await self._sync_skills(data)
            
            # Simple validation for qualifications/disabilities
            # (If LLM hallucinated something outside our list, we keep it as-is 
            # but usually the prompt handles this now).
            pass
            
        return data

    async def _sync_skills(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensures all extracted skills exist in the DB."""
        requirements = data.get("requirements", {})
        skills = requirements.get("skills", [])
        if not skills:
            return data

        skill_repo = SkillRepository(self._db)
        final_skills = []
        for sname in skills:
            if not sname or not isinstance(sname, str): continue
            sname = sname.strip()
            existing = await skill_repo.get_by_name(sname)
            if existing:
                final_skills.append(existing.name)
            else:
                try:
                    new_skill = await skill_repo.create({"name": sname})
                    await self._db.commit()
                    final_skills.append(new_skill.name)
                except Exception:
                    await self._db.rollback()
                    final_skills.append(sname)
        
        requirements["skills"] = list(set(final_skills))
        return data

    async def _generate_suggestions(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Finds matching company/contact IDs in the DB."""
        company_name = data.get("company_name")
        contact_name = data.get("contact_name")
        contact_email = data.get("contact_email")

        suggestions = {
            "company_id": None,
            "company_name": company_name,
            "contact_id": None,
            "contact_name": contact_name,
        }

        if company_name:
            company_repo = CompanyRepository(self._db)
            companies, _ = await company_repo.get_multi(search=company_name, limit=1)
            if companies:
                comp = companies[0]
                suggestions["company_id"] = comp.id
                suggestions["company_name"] = comp.name

                if (contact_name or contact_email):
                    contact_repo = ContactRepository(self._db)
                    contacts = []
                    if contact_email:
                        existing = await contact_repo.get_by_email(contact_email)
                        if existing: contacts = [existing]
                    
                    if not contacts and contact_name:
                        contacts, _ = await contact_repo.get_multi(
                            company_id=comp.id, search=contact_name, limit=1
                        )
                    
                    if contacts:
                        suggestions["contact_id"] = contacts[0].id
                        suggestions["contact_name"] = f"{contacts[0].first_name} {contacts[0].last_name}"

        return suggestions

    def _truncate_source_text(self, text: str, max_chars: int = 8000) -> str:
        """
        Truncates source text to stay within LLM provider limits (e.g. Groq TPM).
        15,000 chars is roughly 4,000 tokens.
        """
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
        Extracts structured candidate data from text, PDF bytes, or a document ID.
        """
        # 1. Prepare source text
        source_text = resume_text or ""
        
        # If document_id is provided, fetch it from DB
        if document_id:
            from app.repositories.candidate_document_repository import CandidateDocumentRepository
            import os
            
            repo = CandidateDocumentRepository(self._db)
            doc = await repo.get(document_id)
            if not doc:
                raise ValueError(f"Document {document_id} not found.")
            
            # Read file from filesystem
            if os.path.exists(doc.file_path):
                with open(doc.file_path, "rb") as f:
                    pdf_file = f.read()
            else:
                logger.error(f"File not found at path: {doc.file_path}")

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
        provider = await get_llm_provider(self._db)
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
        """Ensures all extracted skills exist in the DB."""
        skills = data.get("skills", {})
        tech_skills = skills.get("technical_skills", [])
        soft_skills = skills.get("soft_skills", [])
        
        if tech_skills or soft_skills:
            skill_repo = SkillRepository(self._db)
            
            # Sync Technical Skills
            final_tech = []
            for sname in tech_skills:
                if not sname or not isinstance(sname, str): continue
                existing = await skill_repo.get_by_name(sname.strip())
                if existing:
                    final_tech.append(existing.name)
                else:
                    try:
                        new_skill = await skill_repo.create({"name": sname.strip()})
                        await self._db.commit()
                        final_tech.append(new_skill.name)
                    except Exception:
                        await self._db.rollback()
                        final_tech.append(sname)
            
            # Sync Soft Skills
            final_soft = []
            for sname in soft_skills:
                if not sname or not isinstance(sname, str): continue
                existing = await skill_repo.get_by_name(sname.strip())
                if existing:
                    final_soft.append(existing.name)
                else:
                    try:
                        new_skill = await skill_repo.create({"name": sname.strip()})
                        await self._db.commit()
                        final_soft.append(new_skill.name)
                    except Exception:
                        await self._db.rollback()
                        final_soft.append(sname)

            data["skills"]["technical_skills"] = list(set(final_tech))
            data["skills"]["soft_skills"] = list(set(final_soft))
            
        return data

    def _truncate_source_text(self, text: str, max_chars: int = 8000) -> str:
        """
        Truncates source text to stay within LLM provider limits (e.g. Groq TPM).
        15,000 chars is roughly 4,000 tokens.
        """
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
        Suggests high-demand skills the candidate might be missing.
        """
        from app.repositories.job_role_repository import JobRoleRepository
        from app.models.job_role import JobRoleStatus
        from collections import Counter

        # 1. Fetch active job roles to see what's in demand
        jr_repo = JobRoleRepository(self._db)
        active_roles = await jr_repo.get_multi_with_filters(status=JobRoleStatus.ACTIVE, limit=50)
        
        # 2. Aggregate skills from these roles
        demand_skills = []
        for role in active_roles:
            reqs = role.requirements or {}
            skills = reqs.get("skills", [])
            demand_skills.extend([s.lower().strip() for s in skills if isinstance(s, str)])
        
        if not demand_skills:
            return []

        # 3. Get most frequent skills
        common_demand = [s for s, count in Counter(demand_skills).most_common(20)]
        
        # 4. Filter out skills the candidate already has
        candidate_skills_lower = [s.lower().strip() for s in candidate_skills]
        recommendations = [s.title() for s in common_demand if s not in candidate_skills_lower]
        
        return recommendations[:10]  # Return top 10 suggestions
