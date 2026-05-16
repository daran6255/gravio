from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.placement_mapping import PlacementMapping
from app.models.job_role import JobRole
from app.models.candidate import Candidate
from app.repositories.placement_mapping_repository import PlacementMappingRepository
from app.repositories.job_role_repository import JobRoleRepository
from app.repositories.candidate_repository import CandidateRepository
from app.schemas.placement_mapping import (
    PlacementMappingCreate, 
    CandidateMatchResult, 
    MatchMatchInfo,
    PlacementMappingBulkCreate
)


class PlacementMappingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = PlacementMappingRepository(db)
        self.job_role_repo = JobRoleRepository(db)
        self.candidate_repo = CandidateRepository(db)

    async def get_mapped_candidates(self, job_role_public_id: UUID) -> List[PlacementMapping]:
        job_role = await self.job_role_repo.get_by_public_id(job_role_public_id)
        if not job_role:
            raise HTTPException(status_code=404, detail="Job role not found")
        return await self.repository.get_by_job_role_active(job_role.id)

    async def map_candidate(self, mapping_in: PlacementMappingCreate, user_id: int) -> PlacementMapping:
        # Check if already mapped
        existing = await self.repository.get_by_candidate_and_job_role(
            mapping_in.candidate_id, mapping_in.job_role_id
        )
        if existing:
            raise HTTPException(
                status_code=400, detail="Candidate is already mapped to this job role"
            )

        mapping_data = {
            "candidate_id": mapping_in.candidate_id,
            "job_role_id": mapping_in.job_role_id,
            "match_score": mapping_in.match_score,
            "notes": mapping_in.notes,
            "mapped_by_id": user_id,
            "mapped_at": datetime.utcnow()
        }
        return await self.repository.create(mapping_data)

    async def bulk_map_candidates(
        self, bulk_mapping: PlacementMappingBulkCreate, user_id: int
    ) -> List[PlacementMapping]:
        """Map multiple candidates to a job role in one pass"""
        results = []
        for item in bulk_mapping.mappings:
            # Check if already mapped
            existing = await self.repository.get_by_candidate_and_job_role(
                item.candidate_id, bulk_mapping.job_role_id
            )
            if existing:
                continue # Skip if already mapped
            
            mapping_data = {
                "candidate_id": item.candidate_id,
                "job_role_id": bulk_mapping.job_role_id,
                "match_score": item.match_score,
                "notes": bulk_mapping.notes,
                "mapped_by_id": user_id,
                "mapped_at": datetime.utcnow()
            }
            mapping = await self.repository.create(mapping_data)
            results.append(mapping)
        return results

    async def unmap_candidate(self, candidate_id: int, job_role_id: int) -> bool:
        mapping = await self.repository.get_by_candidate_and_job_role(candidate_id, job_role_id)
        if not mapping:
            raise HTTPException(status_code=404, detail="Mapping not found")
        # Use hard delete since PlacementMapping doesn't support soft delete
        return await self.repository.delete(mapping.id, soft=False)

    async def get_matches_for_job_role(self, job_role_public_id: UUID) -> List[CandidateMatchResult]:
        job_role = await self.job_role_repo.get_by_public_id(job_role_public_id)
        if not job_role:
            raise HTTPException(status_code=404, detail="Job role not found")

        # requirements: {"skills": [], "qualifications": [], "disability_preferred": []}
        reqs = job_role.requirements or {}
        
        def normalize_text(obj):
            if not obj: return []
            if isinstance(obj, str): return [obj.strip().lower()]
            if isinstance(obj, list): return [str(item).strip().lower() for item in obj if item]
            return []

        def normalize_qual(q_list):
            normalized = set()
            # Common aliases to bridge variations
            aliases = {
                "b.com": ["bcom", "b. com", "b com", "bachelor of commerce"],
                "b.e": ["be", "b. e", "b e", "bachelor of engineering"],
                "b.tech": ["btech", "b. tech", "b tech", "bachelor of technology"],
                "m.com": ["mcom", "m. com", "m com", "master of commerce"],
                "any graduation": ["any degree", "graduation", "any", "all", "graduation required", "any graduate"]
            }
            
            for q in q_list:
                q = q.lower().strip()
                if not q: continue
                normalized.add(q)
                # Add aliases
                for canonical, variations in aliases.items():
                    if q == canonical or q in variations:
                        normalized.add(canonical)
                        for v in variations: normalized.add(v)
            return normalized

        job_skills = set(normalize_text(reqs.get("skills")))
        job_quals = normalize_qual(normalize_text(reqs.get("qualifications")))
        job_disability = set(normalize_text(reqs.get("disability_preferred")))
        
        # Check for global match keywords early
        global_match_keywords = {"any graduation", "any degree", "graduation", "any", "all", "graduation required", "any graduate"}
        has_global_requirement = any(kw in job_quals for kw in global_match_keywords)

        # Fetch only placement-ready candidates: Screened (Completed) AND Counseled (Selected)
        candidates, _ = await self.candidate_repo.get_screened(
            limit=1000,
            screening_status='Completed',
            counseling_status='selected'
        )
        
        # Get existing mappings for this job role to mark them
        existing_mappings = await self.repository.get_by_job_role_active(job_role.id)
        # Map of candidate_id -> (mapping_id, status)
        mapping_info = {m.candidate_id: (m.id, m.status) for m in existing_mappings}

        results = []
        for candidate in candidates:
            # 1. Skill Match (60%)
            candidate_skills = []
            candidate_skills = []
            
            def get_names_from_skills(obj):
                names = []
                if not obj: return names
                if isinstance(obj, dict):
                    # Handle categorized dict: {"technical": [], "soft": []}
                    names.extend(obj.get("technical") or [])
                    names.extend(obj.get("soft") or [])
                    # Handle flat dict if names are keys or something else? 
                    # Usually it's categorized per our models.
                elif isinstance(obj, list):
                    # Handle list of objects: [{"name": "Skill", "level": "..."}]
                    for item in obj:
                        if isinstance(item, dict):
                            name = item.get("name") or item.get("skill")
                            if name: names.append(name)
                        elif isinstance(item, str):
                            names.append(item)
                return names

            # Extract from screening
            if candidate.screening and candidate.screening.skills:
                candidate_skills.extend(get_names_from_skills(candidate.screening.skills))
            
            # Extract from counseling
            if candidate.counseling and candidate.counseling.skills:
                candidate_skills.extend(get_names_from_skills(candidate.counseling.skills))
            
            c_skills_set = set(s.lower() for s in candidate_skills)
            skill_hits = job_skills.intersection(c_skills_set)
            skill_score = 0.0
            skill_detail = "No skills specified in job role" if not job_skills else "No matching skills"
            
            if job_skills:
                skill_ratio = len(skill_hits) / len(job_skills)
                skill_score = skill_ratio * 60.0
                skill_detail = f"Matched {len(skill_hits)}/{len(job_skills)} skills: {', '.join(skill_hits)}"

            # 2. Qualification Match (20%)
            raw_c_quals = []
            if candidate.education_details and 'degrees' in candidate.education_details:
                for deg in candidate.education_details['degrees']:
                    if isinstance(deg, dict):
                        # Extract both degree name and major to catch variations like B.Com (Computer Science)
                        c_deg = (deg.get('degree_name') or deg.get('degree') or deg.get('name') or '').lower().strip()
                        c_major = (deg.get('major') or deg.get('specialization') or '').lower().strip()
                        if c_deg: raw_c_quals.append(c_deg)
                        if c_major: raw_c_quals.append(c_major)
            
            # Normalize candidate qualifications using the same alias logic
            candidate_quals = normalize_qual(raw_c_quals)
            
            # Match logic: True if global match OR any candidate qualification matches job requirements
            qual_match = has_global_requirement or any(q in job_quals for q in candidate_quals if q)
            
            qual_score = 20.0 if qual_match else 0.0
            qual_detail = "Matched qualification" if qual_match else "Qualification does not match"
            
            if not job_quals or has_global_requirement:
                qual_score = 20.0
                qual_detail = "Any graduation/qualification acceptable"

            # 3. Disability Match (20%)
            candidate_disability = ""
            if candidate.disability_details:
                candidate_disability = (candidate.disability_details.get("disability_type") or "").lower()
            
            dis_match = candidate_disability in job_disability
            dis_score = 20.0 if dis_match else 0.0
            dis_detail = f"Matched disability type: {candidate_disability}" if dis_match else "Disability type mismatch"
            if not job_disability:
                dis_score = 20.0
                dis_detail = "No disability preference specified"

            total_score = skill_score + qual_score + dis_score
            
            # Count and fetch other mappings for this candidate (Only Active roles)
            other_mappings = await self.repository.get_by_candidate_active(candidate.id)
            other_role_names = [
                m.job_role.title for m in other_mappings 
                if m.job_role_id != job_role.id and m.job_role.status == "active"
            ]
            other_count = len(other_role_names)

            # Extract top-level qualification and disability
            main_qual = ""
            if candidate.education_details and 'degrees' in candidate.education_details and candidate.education_details['degrees']:
                 deg = candidate.education_details['degrees'][0]
                 main_qual = deg.get('degree_name') or deg.get('degree', '')

            main_disability = ""
            if candidate.disability_details:
                main_disability = candidate.disability_details.get("disability_type")

            # Extract year of experience
            year_of_exp = None
            if candidate.work_experience and isinstance(candidate.work_experience, dict):
                year_of_exp = candidate.work_experience.get("year_of_experience")

            results.append(
                CandidateMatchResult(
                    public_id=candidate.public_id,
                    candidate_id=candidate.id,
                    name=candidate.name,
                    match_score=round(total_score, 2),
                    disability=main_disability,
                    qualification=main_qual,
                    skills=candidate_skills[:5],  # Top 5 skills
                    skill_match=MatchMatchInfo(is_match=len(skill_hits) > 0, details=skill_detail),
                    qualification_match=MatchMatchInfo(is_match=qual_match or not job_quals, details=qual_detail),
                    disability_match=MatchMatchInfo(is_match=dis_match or not job_disability, details=dis_detail),
                    other_mappings_count=other_count,
                    other_mappings=other_role_names,
                    is_already_mapped=candidate.id in mapping_info,
                    status=mapping_info.get(candidate.id)[1] if candidate.id in mapping_info else None,
                    mapping_id=mapping_info.get(candidate.id)[0] if candidate.id in mapping_info else None,
                    year_of_experience=year_of_exp
                )
            )

        # Sort by match score descending
        results.sort(key=lambda x: x.match_score, reverse=True)
        return results
