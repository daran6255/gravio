"""Candidate Repository"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, func, Integer, or_, and_, case, cast, Numeric
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.candidate import Candidate
from app.models.candidate_screening import CandidateScreening
from app.models.candidate_document import CandidateDocument
from app.models.candidate_counseling import CandidateCounseling
from app.models.candidate_assignment import CandidateAssignment
from app.repositories.base import BaseRepository


MAIN_STATUSES = ['Completed', 'In Progress', 'Rejected', 'Pending']


class CandidateRepository(BaseRepository[Candidate]):
    """Repository for Candidate model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Candidate, db)
    
    async def get_by_email(self, email: str) -> Optional[Candidate]:
        """Get candidate by email"""
        result = await self.db.execute(select(Candidate).where(Candidate.email == email))
        return result.scalars().first()
    
    async def get_by_phone(self, phone: str) -> Optional[Candidate]:
        """Get candidate by phone"""
        result = await self.db.execute(select(Candidate).where(Candidate.phone == phone))
        return result.scalars().first()
    
    async def get_by_public_id(self, public_id: UUID) -> Optional[Candidate]:
        """Get candidate by public_id (UUID) without relationships"""
        result = await self.db.execute(
            select(Candidate).where(Candidate.public_id == public_id)
        )
        return result.scalars().first()
    
    async def get_by_public_id_with_details(self, public_id: UUID) -> Optional[Candidate]:
        """Get candidate by public_id with all related data (screening, documents, counseling)"""
        result = await self.db.execute(
            select(Candidate)
            .where(Candidate.public_id == public_id)
            .options(
                joinedload(Candidate.screening).joinedload(CandidateScreening.screened_by),
                selectinload(Candidate.documents),
                joinedload(Candidate.counseling)
            )
        )
        return result.scalars().first()

    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        include_deleted: bool = False, 
        search: Optional[str] = None, 
        sort_by: Optional[str] = None, 
        sort_order: str = "desc",
        disability_types: Optional[list] = None,
        education_levels: Optional[list] = None,
        cities: Optional[list] = None,
        counseling_status: Optional[str] = None,
        is_experienced: Optional[bool] = None,
        screening_status: Optional[str] = None,
        disability_percentages: Optional[list] = None,
        screening_reasons: Optional[list] = None,
        gender: Optional[str] = None,
        year_of_passing: Optional[list] = None,
        year_of_experience: Optional[str] = None,
        currently_employed: Optional[bool] = None,
        assigned_to_id: Optional[int] = None,
        extra_filters: Optional[dict] = None,
        registration_type: Optional[str] = None
    ):
        """Get multiples candidates with counseling loaded for list view, with optional search filtering, category filters, and sorting"""
        from sqlalchemy import or_, and_
        stmt = (
            select(Candidate)
            .outerjoin(Candidate.screening)
            .outerjoin(Candidate.counseling)
            .outerjoin(Candidate.assignment)
            .options(
                joinedload(Candidate.screening).joinedload(CandidateScreening.screened_by),
                selectinload(Candidate.documents),
                joinedload(Candidate.counseling).joinedload(CandidateCounseling.counselor),
                joinedload(Candidate.assignment).joinedload(CandidateAssignment.user)
            )
        )

        if assigned_to_id is not None:
            # If assigned_to_id is 0 or -1 (depending on convention), we might want to filter for unassigned
            if assigned_to_id == 0:
                stmt = stmt.where(CandidateAssignment.id.is_(None))
            else:
                stmt = stmt.where(CandidateAssignment.user_id == assigned_to_id)

        
        if not include_deleted:
            stmt = stmt.where(Candidate.is_deleted == False) 
        
        # Base count query
        count_stmt = select(func.count(Candidate.id)).select_from(Candidate).outerjoin(Candidate.screening).outerjoin(Candidate.counseling).outerjoin(Candidate.assignment)
        if not include_deleted:
            count_stmt = count_stmt.where(Candidate.is_deleted == False)
        
        if assigned_to_id is not None:
            if assigned_to_id == 0:
                count_stmt = count_stmt.where(CandidateAssignment.id.is_(None))
            else:
                count_stmt = count_stmt.where(CandidateAssignment.user_id == assigned_to_id)
        
        # Apply search filters if provided
        if search:
            search_filter = or_(
                Candidate.name.ilike(f"%{search}%"),
                Candidate.email.ilike(f"%{search}%"),
                Candidate.phone.ilike(f"%{search}%"),
                Candidate.city.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)
        
        # Apply category filters
        if disability_types and len(disability_types) > 0:
            # Filter by disability_type in JSON field
            disability_filters = []
            for d_type in disability_types:
                if d_type:
                    disability_filters.append(
                        Candidate.disability_details['disability_type'].as_string() == d_type
                    )
            if disability_filters:
                stmt = stmt.where(or_(*disability_filters))
                count_stmt = count_stmt.where(or_(*disability_filters))
        
        if disability_percentages and len(disability_percentages) > 0:
            # Filter by disability_percentage range (min-max)
            # Expecting format "min-max" e.g. "40-80" in the first element if passed as list of strings from query param
            # Or handle if it's passed as a single string argument in the controller (it's passed as list here but likely contains one range string)
            
            percentage_filters = []
            for d_range in disability_percentages:
                if d_range and '-' in d_range:
                    try:
                        min_val, max_val = map(float, d_range.split('-'))
                        # Use Float type for casting
                        from sqlalchemy import Float
                        
                        percentage_filters.append(
                            Candidate.disability_details['disability_percentage'].as_string().cast(Float) >= min_val
                        )
                        percentage_filters.append(
                            Candidate.disability_details['disability_percentage'].as_string().cast(Float) <= max_val
                        )
                    except ValueError:
                        pass # Ignore invalid format

            if percentage_filters:
                # Use AND for range bounds (min AND max)
                # But if multiple ranges were supported (unlikely here), they'd be OR'd.
                # Here we have one range effectively.
                stmt = stmt.where(and_(*percentage_filters))
                count_stmt = count_stmt.where(and_(*percentage_filters))

        if gender:
            stmt = stmt.where(Candidate.gender == gender)
            count_stmt = count_stmt.where(Candidate.gender == gender)

        if registration_type:
            stmt = stmt.where(Candidate.other['registration_type'].as_string() == registration_type)
            count_stmt = count_stmt.where(Candidate.other['registration_type'].as_string() == registration_type)

        if extra_filters:
            # Handle dynamic JSON filters for screening/counseling 'others' field
            # Values may be comma-separated for multi-select filter selections (e.g. "option1,option2")
            # Storage formats differ by field type:
            #   single_choice  -> stored as plain string: "Yes"
            #   multiple_choice -> stored as JSON array:  ["Yes","No"]
            # Using ilike '%value%' handles BOTH cases without needing to know the field type.
            for key, value in extra_filters.items():
                if not value:
                    continue

                selected_values = [v.strip() for v in str(value).split(',') if v.strip()]
                if not selected_values:
                    continue

                print(f"[DEBUG] Dynamic filter: key={key}, selected_values={selected_values}")

                if key.startswith('screening_others.'):
                    field_name = key.replace('screening_others.', '')
                    conditions = [
                        func.json_extract_path_text(CandidateScreening.others, field_name).ilike(f'%{v}%')
                        for v in selected_values
                    ]
                    filter_clause = or_(*conditions) if len(conditions) > 1 else conditions[0]
                    stmt = stmt.where(filter_clause)
                    count_stmt = count_stmt.where(filter_clause)
                elif key.startswith('counseling_others.'):
                    field_name = key.replace('counseling_others.', '')
                    conditions = [
                        func.json_extract_path_text(CandidateCounseling.others, field_name).ilike(f'%{v}%')
                        for v in selected_values
                    ]
                    filter_clause = or_(*conditions) if len(conditions) > 1 else conditions[0]
                    stmt = stmt.where(filter_clause)
                    count_stmt = count_stmt.where(filter_clause)



        
        if education_levels and len(education_levels) > 0:
            # Filter by education level (degree name) in JSON field
            education_filters = []
            for edu_level in education_levels:
                if edu_level:
                    # For JSON arrays, we can use contains with a string check 
                    # but it's better to cast to string if it's a generic JSON column
                    education_filters.append(
                        Candidate.education_details['degrees'].as_string().ilike(f"%{edu_level}%")
                    )
            if education_filters:
                stmt = stmt.where(or_(*education_filters))
                count_stmt = count_stmt.where(or_(*education_filters))

        
        if cities and len(cities) > 0:
            stmt = stmt.where(Candidate.city.in_(cities))
            count_stmt = count_stmt.where(Candidate.city.in_(cities))
        
        if counseling_status:
            stmt = stmt.where(CandidateCounseling.status == counseling_status)
            count_stmt = count_stmt.where(CandidateCounseling.status == counseling_status)
        
        if is_experienced is not None:
            if is_experienced:
                stmt = stmt.where(Candidate.work_experience['is_experienced'].as_string() == 'true')
                count_stmt = count_stmt.where(Candidate.work_experience['is_experienced'].as_string() == 'true')
            else:
                stmt = stmt.where(or_(
                    Candidate.work_experience['is_experienced'].as_string() == 'false',
                    Candidate.work_experience['is_experienced'].as_string().is_(None),
                    Candidate.work_experience.is_(None)
                ))
                count_stmt = count_stmt.where(or_(
                    Candidate.work_experience['is_experienced'].as_string() == 'false',
                    Candidate.work_experience['is_experienced'].as_string().is_(None),
                    Candidate.work_experience.is_(None)
                ))
        
        if currently_employed is not None:
            if currently_employed:
                stmt = stmt.where(Candidate.work_experience['currently_employed'].as_string() == 'true')
                count_stmt = count_stmt.where(Candidate.work_experience['currently_employed'].as_string() == 'true')
            else:
                stmt = stmt.where(or_(
                    Candidate.work_experience['currently_employed'].as_string() == 'false',
                    Candidate.work_experience['currently_employed'].as_string().is_(None),
                    Candidate.work_experience.is_(None)
                ))
                count_stmt = count_stmt.where(or_(
                    Candidate.work_experience['currently_employed'].as_string() == 'false',
                    Candidate.work_experience['currently_employed'].as_string().is_(None),
                    Candidate.work_experience.is_(None)
                ))

        if year_of_experience:
            print(f"[DEBUG] Experience Filter: {year_of_experience}")
            if '-' in year_of_experience:
                try:
                    min_exp, max_exp = map(float, year_of_experience.split('-'))
                    # Extract numeric part and cast to numeric for range comparison
                    # astext is used for Postgres JSON access. Use NULLIF for safety if regex returns empty.
                    numeric_expr = cast(
                        func.nullif(
                            func.regexp_replace(Candidate.work_experience['year_of_experience'].as_string(), '[^0-9.]', '', 'g'),
                            ''
                        ),
                        Numeric
                    )
                    stmt = stmt.where(numeric_expr >= min_exp).where(numeric_expr <= max_exp)
                    count_stmt = count_stmt.where(numeric_expr >= min_exp).where(numeric_expr <= max_exp)
                except (ValueError, TypeError):
                    stmt = stmt.where(Candidate.work_experience['year_of_experience'].as_string().ilike(f"%{year_of_experience}%"))
                    count_stmt = count_stmt.where(Candidate.work_experience['year_of_experience'].as_string().ilike(f"%{year_of_experience}%"))
            else:
                stmt = stmt.where(Candidate.work_experience['year_of_experience'].as_string().ilike(f"%{year_of_experience}%"))
                count_stmt = count_stmt.where(Candidate.work_experience['year_of_experience'].as_string().ilike(f"%{year_of_experience}%"))

        if year_of_passing and len(year_of_passing) > 0:
            yop_filters = []
            for yop in year_of_passing:
                if yop:
                    yop_filters.append(
                        Candidate.education_details['degrees'].as_string().ilike(f'%"year_of_passing": {yop}%')
                    )
            if yop_filters:
                stmt = stmt.where(or_(*yop_filters))
                count_stmt = count_stmt.where(or_(*yop_filters))
        
        if screening_status:
            if screening_status == 'Pending':
                stmt = stmt.where(CandidateScreening.id.is_(None))
                count_stmt = count_stmt.where(CandidateScreening.id.is_(None))
            elif screening_status == 'In Progress':
                # Treat empty/null as In Progress
                stmt = stmt.where(or_(
                    CandidateScreening.status == 'In Progress',
                    CandidateScreening.status.is_(None),
                    CandidateScreening.status == ''
                ), CandidateScreening.id.isnot(None))
                count_stmt = count_stmt.where(or_(
                    CandidateScreening.status == 'In Progress',
                    CandidateScreening.status.is_(None),
                    CandidateScreening.status == ''
                ), CandidateScreening.id.isnot(None))
            else:
                stmt = stmt.where(CandidateScreening.status == screening_status)
                count_stmt = count_stmt.where(CandidateScreening.status == screening_status)
        
        # Count total matching records
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Apply sorting
        if sort_by:
            # Handle sorting by fields that might be in relationships or complex
            # For now, focus on main Candidate fields
            if hasattr(Candidate, sort_by):
                column = getattr(Candidate, sort_by)
                if sort_order.lower() == "asc":
                    stmt = stmt.order_by(column.asc())
                else:
                    stmt = stmt.order_by(column.desc())
        else:
            # Default sorting
            stmt = stmt.order_by(Candidate.created_at.desc())

        # Now apply pagination for the data fetch
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().unique().all(), total

    async def get_new_candidates_by_date(self, start_date: datetime, end_date: datetime) -> List[Candidate]:
        """Get candidates created within a date range"""
        stmt = (
            select(Candidate)
            .where(Candidate.created_at >= start_date)
            .where(Candidate.created_at <= end_date)
            .where(Candidate.is_deleted == False)
            .order_by(Candidate.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


    async def get_unscreened(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        search: Optional[str] = None, 
        sort_by: Optional[str] = None, 
        sort_order: str = "desc",
        disability_types: Optional[list] = None,
        education_levels: Optional[list] = None,
        cities: Optional[list] = None,
        screening_status: Optional[str] = None,
        is_experienced: Optional[bool] = None,
        counseling_status: Optional[str] = None,
        gender: Optional[str] = None,
        assigned_to_id: Optional[int] = None,
        extra_filters: Optional[dict] = None
    ):
        """Get candidates without screening records or with non-completed screening, with optional search filtering, category filters, and sorting"""
        # A candidate is "unscreened" ONLY if they have no screening record at all
        unscreened_filter = CandidateScreening.id.is_(None)

        stmt = (
            select(Candidate)
            .outerjoin(Candidate.screening)
            .outerjoin(Candidate.counseling)
            .outerjoin(Candidate.assignment)
            .where(unscreened_filter)
            .options(
                joinedload(Candidate.screening).joinedload(CandidateScreening.screened_by),
                joinedload(Candidate.counseling).joinedload(CandidateCounseling.counselor),
                joinedload(Candidate.assignment).joinedload(CandidateAssignment.user)
            )
        )
        
        if assigned_to_id is not None:
            if assigned_to_id == 0:
                stmt = stmt.where(CandidateAssignment.id.is_(None))
            else:
                stmt = stmt.where(CandidateAssignment.user_id == assigned_to_id)

        # Base count query
        count_stmt = select(func.count(Candidate.id)).outerjoin(Candidate.screening).outerjoin(Candidate.assignment).where(unscreened_filter)

        if assigned_to_id is not None:
            if assigned_to_id == 0:
                count_stmt = count_stmt.where(CandidateAssignment.id.is_(None))
            else:
                count_stmt = count_stmt.where(CandidateAssignment.user_id == assigned_to_id)
        
        # Apply screening status filter if provided
        if screening_status:
            if screening_status == 'Pending':
                stmt = stmt.where(CandidateScreening.id.is_(None))
                count_stmt = count_stmt.where(CandidateScreening.id.is_(None))
            elif screening_status == 'Other':
                # Explicitly 'Other' or something else not in main list
                stmt = stmt.where(or_(
                    CandidateScreening.status.notin_(MAIN_STATUSES),
                    CandidateScreening.status.is_(None),
                    CandidateScreening.status == ''
                ), CandidateScreening.id.isnot(None))
                count_stmt = count_stmt.where(or_(
                    CandidateScreening.status.notin_(MAIN_STATUSES),
                    CandidateScreening.status.is_(None),
                    CandidateScreening.status == ''
                ), CandidateScreening.id.isnot(None))
            else:
                stmt = stmt.where(CandidateScreening.status == screening_status)
                count_stmt = count_stmt.where(CandidateScreening.status == screening_status)
        
        # Apply search filters if provided
        if search:
            search_filter = or_(
                Candidate.name.ilike(f"%{search}%"),
                Candidate.email.ilike(f"%{search}%"),
                Candidate.phone.ilike(f"%{search}%"),
                Candidate.city.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        # Apply category filters
        if disability_types and len(disability_types) > 0:
            disability_filters = []
            for d_type in disability_types:
                if d_type:
                    disability_filters.append(
                        Candidate.disability_details['disability_type'].as_string() == d_type
                    )
            if disability_filters:
                stmt = stmt.where(or_(*disability_filters))
                count_stmt = count_stmt.where(or_(*disability_filters))
        
        if education_levels and len(education_levels) > 0:
            education_filters = []
            for edu_level in education_levels:
                if edu_level:
                    education_filters.append(
                        Candidate.education_details['degrees'].as_string().ilike(f"%{edu_level}%")
                    )
            if education_filters:
                stmt = stmt.where(or_(*education_filters))
                count_stmt = count_stmt.where(or_(*education_filters))
        
        if cities and len(cities) > 0:
            stmt = stmt.where(Candidate.city.in_(cities))
            count_stmt = count_stmt.where(Candidate.city.in_(cities))

        # Apply Counseling Status filters
        if counseling_status:
            if counseling_status.lower() == 'pending':
                # No counseling record OR status is 'pending'
                stmt = stmt.where(or_(CandidateCounseling.id.is_(None), CandidateCounseling.status == 'pending'))
                count_stmt = count_stmt.outerjoin(Candidate.counseling).where(or_(CandidateCounseling.id.is_(None), CandidateCounseling.status == 'pending'))
            elif counseling_status.lower() == 'counseled':
                # Has counseling record AND status is 'selected' or 'rejected'
                stmt = stmt.where(CandidateCounseling.status.in_(['selected', 'rejected']))
                count_stmt = count_stmt.outerjoin(Candidate.counseling).where(CandidateCounseling.status.in_(['selected', 'rejected']))
            else:
                # Specific status (selected, rejected, etc.)
                stmt = stmt.where(CandidateCounseling.status == counseling_status)
                count_stmt = count_stmt.outerjoin(Candidate.counseling).where(CandidateCounseling.status == counseling_status)

        if is_experienced is not None:
            is_exp_val = 'true' if is_experienced else 'false'
            stmt = stmt.where(Candidate.work_experience['is_experienced'].as_string() == is_exp_val)
            count_stmt = count_stmt.where(Candidate.work_experience['is_experienced'].as_string() == is_exp_val)


        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Apply sorting
        if sort_by:
            if hasattr(Candidate, sort_by):
                column = getattr(Candidate, sort_by)
                if sort_order.lower() == "asc":
                    stmt = stmt.order_by(column.asc())
                else:
                    stmt = stmt.order_by(column.desc())
        else:
            stmt = stmt.order_by(Candidate.created_at.desc())

        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().unique().all(), total

    async def get_screened(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        counseling_status: Optional[str] = None, 
        search: Optional[str] = None, 
        document_status: Optional[str] = None, 
        sort_by: Optional[str] = None, 
        sort_order: str = "desc",
        disability_types: Optional[list] = None,
        education_levels: Optional[list] = None,
        cities: Optional[list] = None,
        screening_status: Optional[str] = None,
        is_experienced: Optional[bool] = None,
        gender: Optional[str] = None,
        assigned_to_id: Optional[int] = None,
        extra_filters: Optional[dict] = None
    ):
        """Get candidates with 'Completed' screening records loaded, with optional counseling status filter, document status filter, search filtering, category filters, and sorting"""

        from sqlalchemy import or_
        stmt = (
            select(Candidate)
            .join(Candidate.screening)
            .outerjoin(Candidate.counseling)
            .outerjoin(Candidate.assignment)
            .where(CandidateScreening.id.isnot(None))
            .options(
                joinedload(Candidate.screening).joinedload(CandidateScreening.screened_by),
                selectinload(Candidate.documents),
                joinedload(Candidate.counseling).joinedload(CandidateCounseling.counselor),
                joinedload(Candidate.assignment).joinedload(CandidateAssignment.user)
            )
        )
        
        if assigned_to_id is not None:
            if assigned_to_id == 0:
                stmt = stmt.where(CandidateAssignment.id.is_(None))
            else:
                stmt = stmt.where(CandidateAssignment.user_id == assigned_to_id)
        
        # Base count statement for screened candidates
        count_stmt = select(func.count(Candidate.id)).join(Candidate.screening).outerjoin(Candidate.counseling).outerjoin(Candidate.assignment).where(CandidateScreening.id.isnot(None))

        if assigned_to_id is not None:
            if assigned_to_id == 0:
                count_stmt = count_stmt.where(CandidateAssignment.id.is_(None))
            else:
                count_stmt = count_stmt.where(CandidateAssignment.user_id == assigned_to_id)
        
        # Apply screening status filter if provided (though mostly would be 'Completed' based on logic above)
        if screening_status:
            if screening_status == 'Other':
                # Exclude standard statuses
                # Standard ones: 'Completed', 'In Progress', 'Rejected', 'Pending'
                # We also EXCLUDE Empty and None because they now map to 'In Progress'
                excluded_statuses = MAIN_STATUSES
                
                stmt = stmt.where(
                    and_(
                        CandidateScreening.status.notin_(excluded_statuses),
                        CandidateScreening.status.isnot(None),
                        CandidateScreening.status != ''
                    )
                )
                count_stmt = count_stmt.where(
                    and_(
                        CandidateScreening.status.notin_(excluded_statuses),
                        CandidateScreening.status.isnot(None),
                        CandidateScreening.status != ''
                    )
                )
            elif screening_status == 'In Progress':
                # Treat empty/null status as 'In Progress' for filtering
                in_progress_filter = or_(
                    CandidateScreening.status == 'In Progress',
                    CandidateScreening.status.is_(None),
                    CandidateScreening.status == ''
                )
                stmt = stmt.where(in_progress_filter)
                count_stmt = count_stmt.where(in_progress_filter)
            else:
                stmt = stmt.where(CandidateScreening.status == screening_status)
                count_stmt = count_stmt.where(CandidateScreening.status == screening_status)
        
        # Apply counseling status filter
        if counseling_status:
            if counseling_status == 'not_counseled':
                # No counseling record
                stmt = stmt.where(CandidateCounseling.id.is_(None))
                count_stmt = count_stmt.where(CandidateCounseling.id.is_(None))
            elif counseling_status == 'pending':
                # Explicitly 'pending' status in counseling record
                stmt = stmt.where(CandidateCounseling.status == 'pending')
                count_stmt = count_stmt.where(CandidateCounseling.status == 'pending')
            elif counseling_status == 'counseled':
                # Counseled includes 'selected' or 'rejected'
                stmt = stmt.where(CandidateCounseling.status.in_(['selected', 'rejected']))
                count_stmt = count_stmt.where(CandidateCounseling.status.in_(['selected', 'rejected']))
            else:
                stmt = stmt.where(CandidateCounseling.status == counseling_status)
                count_stmt = count_stmt.where(CandidateCounseling.status == counseling_status)

        # Apply document status filter
        if document_status:
            # We need to filter based on whether all required documents are present
            # Base required docs: resume, 10th_certificate, 12th_certificate, degree_certificate
            # Optional required: disability_certificate (if is_disabled is True)
            
            # Subquery to count required documents per candidate
            # This is complex in a single query with conditional disability cert.
            # We'll use a CASE statement within the subquery to count matches.
            
            # Define core required documents
            CORE_DOCS = ['resume', '10th_certificate', '12th_certificate', 'degree_certificate', 'pan_card', 'aadhar_card']
            
            # Subquery to calculate uploaded vs required counts per candidate
            # This logic MUST match get_stats logic exactly
            doc_counts_sub = (
                select(
                    Candidate.id.label('c_id'),
                    func.count(func.distinct(
                        case(
                            (CandidateDocument.document_type.in_(CORE_DOCS), CandidateDocument.document_type),
                            (and_(
                                CandidateDocument.document_type == 'disability_certificate',
                                Candidate.disability_details['is_disabled'].as_boolean() == True
                            ), CandidateDocument.document_type),
                            else_=None
                        )
                    )).label('uploaded_count'),
                    (len(CORE_DOCS) + case(
                        (Candidate.disability_details['is_disabled'].as_boolean() == True, 1),
                        else_=0
                    )).label('target_count')
                )
                .outerjoin(CandidateDocument, Candidate.id == CandidateDocument.candidate_id)
                .group_by(Candidate.id)
            ).subquery()

            if document_status == 'collected':
                # Fully collected: uploaded == target
                stmt = stmt.join(doc_counts_sub, Candidate.id == doc_counts_sub.c.c_id).where(doc_counts_sub.c.uploaded_count == doc_counts_sub.c.target_count)
                count_stmt = count_stmt.join(doc_counts_sub, Candidate.id == doc_counts_sub.c.c_id).where(doc_counts_sub.c.uploaded_count == doc_counts_sub.c.target_count)
            elif document_status == 'pending':
                # Partially collected: 0 < uploaded < target
                stmt = stmt.join(doc_counts_sub, Candidate.id == doc_counts_sub.c.c_id).where(and_(doc_counts_sub.c.uploaded_count > 0, doc_counts_sub.c.uploaded_count < doc_counts_sub.c.target_count))
                count_stmt = count_stmt.join(doc_counts_sub, Candidate.id == doc_counts_sub.c.c_id).where(and_(doc_counts_sub.c.uploaded_count > 0, doc_counts_sub.c.uploaded_count < doc_counts_sub.c.target_count))
            elif document_status == 'not_collected':
                # Not collected: uploaded == 0
                stmt = stmt.join(doc_counts_sub, Candidate.id == doc_counts_sub.c.c_id).where(doc_counts_sub.c.uploaded_count == 0)
                count_stmt = count_stmt.join(doc_counts_sub, Candidate.id == doc_counts_sub.c.c_id).where(doc_counts_sub.c.uploaded_count == 0)

        # Apply search filters if provided
        if search:
            search_filter = or_(
                Candidate.name.ilike(f"%{search}%"),
                Candidate.email.ilike(f"%{search}%"),
                Candidate.phone.ilike(f"%{search}%"),
                Candidate.city.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        # Apply category filters
        if disability_types and len(disability_types) > 0:
            disability_filters = []
            for d_type in disability_types:
                if d_type:
                    disability_filters.append(
                        Candidate.disability_details['disability_type'].as_string() == d_type
                    )
            if disability_filters:
                stmt = stmt.where(or_(*disability_filters))
                count_stmt = count_stmt.where(or_(*disability_filters))
        
        if education_levels and len(education_levels) > 0:
            education_filters = []
            for edu_level in education_levels:
                if edu_level:
                    education_filters.append(
                        Candidate.education_details['degrees'].as_string().ilike(f"%{edu_level}%")
                    )
            if education_filters:
                stmt = stmt.where(or_(*education_filters))
                count_stmt = count_stmt.where(or_(*education_filters))
        if cities and len(cities) > 0:
            stmt = stmt.where(Candidate.city.in_(cities))
            count_stmt = count_stmt.where(Candidate.city.in_(cities))

        if is_experienced is not None:
            is_exp_val = 'true' if is_experienced else 'false'
            stmt = stmt.where(Candidate.work_experience['is_experienced'].as_string() == is_exp_val)
            count_stmt = count_stmt.where(Candidate.work_experience['is_experienced'].as_string() == is_exp_val)


        # Count total screened (with filter)
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Apply sorting
        if sort_by:
            if hasattr(Candidate, sort_by):
                column = getattr(Candidate, sort_by)
                if sort_order.lower() == "asc":
                    stmt = stmt.order_by(column.asc())
                else:
                    stmt = stmt.order_by(column.desc())
        else:
            stmt = stmt.order_by(Candidate.created_at.desc())

        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().unique().all(), total


    async def get_stats(self) -> dict:
        """Get candidate statistics"""
        # Lazy imports to avoid circular dependency
        # Lazy imports to avoid circular dependency
        from sqlalchemy import func
        from datetime import datetime, time, timedelta
        from app.models.candidate_counseling import CandidateCounseling
        from app.models.candidate_screening import CandidateScreening
        from app.models.candidate_document import CandidateDocument
        from app.models.training_candidate_allocation import TrainingCandidateAllocation
        from app.models.training_batch import TrainingBatch
        from app.models.placement_mapping import PlacementMapping
        
        try:
            # Helper to execute count query
            async def get_count(filter_expr=None):
                stmt = select(func.count(Candidate.id))
                start_filter = (Candidate.is_deleted == False)
                if filter_expr is not None:
                    stmt = stmt.where(start_filter, filter_expr)
                else:
                    stmt = stmt.where(start_filter)
                result = await self.db.execute(stmt)
                return result.scalar() or 0

            async def get_weekly_stats():
                # Get stats for last 7 days
                today = datetime.now().date()
                stats = []
                # Loop for last 7 days including today (or 6 days + today)
                for i in range(6, -1, -1):
                    day = today - timedelta(days=i)
                    start = datetime.combine(day, time.min)
                    end = datetime.combine(day, time.max)
                    count = await get_count((Candidate.created_at >= start) & (Candidate.created_at <= end))
                    stats.append(count)
                return stats

            total = await get_count()
            male = await get_count(func.lower(Candidate.gender) == 'male')
            female = await get_count(func.lower(Candidate.gender) == 'female')
            
            # All others that are not male/female (case insensitive)
            others = total - (male + female)
            
            # Candidates registered today
            today_start = datetime.combine(datetime.now().date(), time.min)
            today_count = await get_count(Candidate.created_at >= today_start)
            
            # Screening stats - count all candidates with ANY screening record
            stmt_screened = select(func.count(CandidateScreening.id)).join(Candidate).where(
                Candidate.is_deleted == False
            )
            result_screened = await self.db.execute(stmt_screened)
            screened = result_screened.scalar() or 0
            
            # Screening distribution
            # Screening distribution
            stmt_dist = select(CandidateScreening.status, func.count(CandidateScreening.id)).join(Candidate).where(Candidate.is_deleted == False).group_by(CandidateScreening.status)
            res_dist = await self.db.execute(stmt_dist)
            raw_dist = dict(res_dist.all())
            
            # Merge None and empty string into 'In Progress'
            screening_distribution = {}
            for status_key, count in raw_dist.items():
                target_key = status_key
                if status_key is None or status_key == '':
                    target_key = 'In Progress'
                
                screening_distribution[target_key] = screening_distribution.get(target_key, 0) + count
            
            not_screened = total - screened

            # Counseling stats
            # Normalize status to lowercase for consistent counting
            stmt_counseling = select(func.lower(CandidateCounseling.status), func.count(CandidateCounseling.id)).join(Candidate).where(Candidate.is_deleted == False).group_by(func.lower(CandidateCounseling.status))
            result_counseling = await self.db.execute(stmt_counseling)
            counseling_counts = dict(result_counseling.all())
            
            # Get raw counts
            raw_selected = counseling_counts.get('selected', 0)
            raw_rejected = counseling_counts.get('rejected', 0)
            
            # Pending counseling should include:
            # 1. Candidates with explicit 'pending' status
            # 2. Screening COMPLETED candidates who have NOT started counseling yet
            # So: Pending = Screening Completed - (Selected + Rejected)
            screened_completed = screening_distribution.get('Completed', 0)
            counseling_pending = max(0, screened_completed - (raw_selected + raw_rejected))
            
            counseling_selected = raw_selected
            counseling_rejected = raw_rejected
            total_counseled = sum(counseling_counts.values())

            # Document collection stats (for Selected candidates)
            # 1. Total to collect from (status == 'selected')
            docs_total = raw_selected
            
            # 2. Detailed collections
            # Strategy: Get IDs of selected candidates and their document types.
            stmt_sel_docs = (
                select(Candidate.id, Candidate.disability_details, func.array_agg(CandidateDocument.document_type))
                .join(CandidateCounseling, Candidate.id == CandidateCounseling.candidate_id)
                .outerjoin(CandidateDocument, Candidate.id == CandidateDocument.candidate_id)
                .where(CandidateCounseling.status == 'selected')
                .where(Candidate.is_deleted == False)
                .group_by(Candidate.id)
            )
            res_sel_docs = await self.db.execute(stmt_sel_docs)
            sel_rows = res_sel_docs.all()
            
            docs_completed = 0
            files_collected = 0
            files_to_collect = 0
            candidates_fully_submitted = 0
            candidates_partially_submitted = 0
            candidates_not_submitted = 0
            
            required_base = {'resume', '10th_certificate', '12th_certificate', 'degree_certificate', 'pan_card', 'aadhar_card'}
            
            for row in sel_rows:
                c_id, disp_details, doc_types = row
                # doc_types might have None if no docs uploaded
                uploaded = set(filter(None, doc_types))
                
                # Check disability cert if applicable
                is_disabled = False
                if disp_details and isinstance(disp_details, dict):
                    is_disabled = disp_details.get('is_disabled', False)
                
                # Set of required docs for THIS specific candidate
                candidate_required = set(required_base)
                if is_disabled:
                    candidate_required.add('disability_certificate')
                
                # Calculate metrics for THIS candidate in terms of required files
                intersection = uploaded.intersection(candidate_required)
                uploaded_count = len(intersection)
                target_count = len(candidate_required)
                
                files_collected += uploaded_count
                files_to_collect += target_count
                
                if uploaded_count == target_count:
                    candidates_fully_submitted += 1
                elif uploaded_count > 0:
                    candidates_partially_submitted += 1
                else:
                    candidates_not_submitted += 1

            docs_completed = candidates_fully_submitted
            docs_pending = docs_total - docs_completed

            weekly = await get_weekly_stats()

            # New metrics for dashboard
            # 1. In Training: count distinct candidates assigned to active batches who have not dropped out
            stmt_training = select(func.count(func.distinct(TrainingCandidateAllocation.candidate_id))).join(
                TrainingBatch, TrainingCandidateAllocation.batch_id == TrainingBatch.id
            ).where(
                and_(
                    TrainingBatch.status.in_(['planned', 'running', 'extended']),
                    TrainingCandidateAllocation.is_deleted == False,
                    TrainingCandidateAllocation.is_dropout == False,
                    TrainingBatch.is_deleted == False
                )
            )
            result_training = await self.db.execute(stmt_training)
            in_training_count = result_training.scalar() or 0

            # 2. Moved to Placement: count distinct candidates in placement_mappings 
            # (any candidate who has reached the placement stage)
            stmt_moved_placement = select(func.count(func.distinct(PlacementMapping.candidate_id)))
            result_moved_placement = await self.db.execute(stmt_moved_placement)
            moved_to_placement_count = result_moved_placement.scalar() or 0

            # 3. Got Job: count distinct candidates who have accepted offers or joined
            stmt_got_job = select(func.count(func.distinct(PlacementMapping.candidate_id))).where(
                PlacementMapping.status.in_(['offer_accepted', 'joined'])
            )
            result_got_job = await self.db.execute(stmt_got_job)
            got_job_count = result_got_job.scalar() or 0
            
            return {
                "total": total,
                "male": male,
                "female": female,
                "others": others,
                "today": today_count,
                "weekly": weekly,
                "screened": screened,
                "not_screened": not_screened,
                "total_counseled": total_counseled,
                "counseling_pending": counseling_pending,
                "counseling_selected": counseling_selected,
                "counseling_rejected": counseling_rejected,
                "docs_total": docs_total,
                "docs_completed": docs_completed,
                "docs_pending": docs_pending,
                "files_collected": files_collected,
                "files_to_collect": files_to_collect,
                "candidates_fully_submitted": candidates_fully_submitted,
                "candidates_partially_submitted": candidates_partially_submitted,
                "candidates_not_submitted": candidates_not_submitted,
                "screening_distribution": screening_distribution,
                "counseling_distribution": counseling_counts,
                "in_training": in_training_count,
                "moved_to_placement": moved_to_placement_count,
                "got_job": got_job_count
            }
        except Exception as e:
            import traceback
            print(f"Error getting stats: {e}")
            print(traceback.format_exc())
            return {
                "total": 0, "male": 0, "female": 0, "others": 0,
                "today": 0, "weekly": [], "screened": 0, "not_screened": 0,
                "total_counseled": 0, "counseling_pending": 0,
                "counseling_selected": 0, "counseling_rejected": 0,
                "docs_total": 0, "docs_completed": 0, "docs_pending": 0
            }

    async def get_filter_options(self) -> dict:
        """Get all unique values for filterable fields across all candidates"""
        try:
            # Get unique disability types
            stmt_disability = select(Candidate.disability_details).where(
                Candidate.disability_details.isnot(None),
                Candidate.is_deleted == False
            )
            result_disability = await self.db.execute(stmt_disability)
            disability_types = set()
            for row in result_disability.scalars().all():
                if row and isinstance(row, dict):
                    disability_type = row.get('disability_type')
                    if disability_type:
                        disability_types.add(disability_type)
            
            # Get unique education levels (from degree names)
            stmt_education = select(Candidate.education_details).where(
                Candidate.education_details.isnot(None),
                Candidate.is_deleted == False
            )
            result_education = await self.db.execute(stmt_education)
            education_levels = set()
            for row in result_education.scalars().all():
                if row and isinstance(row, dict):
                    degrees = row.get('degrees', [])
                    for degree in degrees:
                        if isinstance(degree, dict):
                            degree_name = degree.get('degree_name')
                            if degree_name:
                                education_levels.add(degree_name)
            
            # Get unique years of passing
            result_education_yop = await self.db.execute(stmt_education)
            years_of_passing = set()
            for row in result_education_yop.scalars().all():
                if row and isinstance(row, dict):
                    degrees = row.get('degrees', [])
                    for degree in degrees:
                        if isinstance(degree, dict):
                            yop = degree.get('year_of_passing')
                            if yop:
                                years_of_passing.add(str(yop))
            
            # Get unique cities
            stmt_cities = select(func.distinct(Candidate.city)).where(
                Candidate.city.isnot(None),
                Candidate.city != '',
                Candidate.is_deleted == False
            )
            result_cities = await self.db.execute(stmt_cities)
            cities = sorted([city for city in result_cities.scalars().all() if city])
            
            # Get unique registration types
            stmt_reg_types = select(Candidate.other).where(
                Candidate.other.isnot(None),
                Candidate.is_deleted == False
            )
            result_reg_types = await self.db.execute(stmt_reg_types)
            registration_types = set()
            for row in result_reg_types.scalars().all():
                if row and isinstance(row, dict):
                    reg_type = row.get('registration_type')
                    if reg_type:
                        registration_types.add(reg_type)
            
            # Get unique screening statuses
            stmt_screening = select(func.distinct(CandidateScreening.status)).where(
                CandidateScreening.status.isnot(None)
            )
            result_screening = await self.db.execute(stmt_screening)
            screening_statuses = [status for status in result_screening.scalars().all() if status]
            # Add 'Pending' as a virtual status for candidates with no screening record
            if 'Pending' not in screening_statuses:
                screening_statuses.append('Pending')
            
            # Get unique counseling statuses
            stmt_counseling = select(func.distinct(CandidateCounseling.status)).where(
                CandidateCounseling.status.isnot(None)
            )
            result_counseling = await self.db.execute(stmt_counseling)
            counseling_statuses = sorted([status for status in result_counseling.scalars().all() if status])

            # Get unique disability percentages
            stmt_disability_perc = select(Candidate.disability_details).where(Candidate.disability_details.isnot(None))
            result_disability_perc = await self.db.execute(stmt_disability_perc)
            disability_percentages = set()
            for row in result_disability_perc.scalars().all():
                if row and isinstance(row, dict):
                    perc = row.get('disability_percentage')
                    if perc is not None:
                        disability_percentages.add(perc)

            # Get unique screening reasons
            stmt_screening_reasons = select(CandidateScreening.others).where(CandidateScreening.others.isnot(None))
            result_screening_reasons = await self.db.execute(stmt_screening_reasons)
            screening_reasons = set()
            for row in result_screening_reasons.scalars().all():
                if row and isinstance(row, dict):
                    reason = row.get('reason')
                    if reason:
                        screening_reasons.add(reason)
            
            return {
                "disability_types": sorted(list(disability_types)),
                "education_levels": sorted(list(education_levels)),
                "cities": cities,
                "counseling_statuses": counseling_statuses,
                "screening_statuses": sorted(screening_statuses),
                "disability_percentages": sorted(list(disability_percentages)),
                "screening_reasons": sorted(list(screening_reasons)),
                "years_of_passing": sorted(list(years_of_passing), reverse=True),
                "registration_types": sorted(list(registration_types))
            }
        except Exception as e:
            import traceback
            print(f"Error getting filter options: {e}")
            print(traceback.format_exc())
            return {
                "disability_types": [],
                "education_levels": [],
                "cities": [],
                "counseling_statuses": []
            }



    async def get_screening_stats(self, assigned_to_id: Optional[int] = None) -> dict:
        """Get candidate screening statistics for tabs, with optional assignment filter"""
        from sqlalchemy import func
        from app.models.candidate_screening import CandidateScreening
        from app.models.candidate_assignment import CandidateAssignment
        
        try:
            # Helper to execute count query
            async def get_count(filter_expr=None):
                stmt = select(func.count(Candidate.id)).select_from(Candidate)
                if assigned_to_id is not None:
                    stmt = stmt.join(Candidate.assignment).where(CandidateAssignment.user_id == assigned_to_id)
                
                start_filter = (Candidate.is_deleted == False)
                if filter_expr is not None:
                    stmt = stmt.where(start_filter, filter_expr)
                else:
                    stmt = stmt.where(start_filter)
                result = await self.db.execute(stmt)
                return result.scalar() or 0

            total = await get_count()
            
            # Screening stats
            stmt_screened = select(func.count(CandidateScreening.id)).join(Candidate).where(
                Candidate.is_deleted == False
            )
            if assigned_to_id is not None:
                stmt_screened = stmt_screened.join(Candidate.assignment).where(CandidateAssignment.user_id == assigned_to_id)
                
            result_screened = await self.db.execute(stmt_screened)
            screened = result_screened.scalar() or 0
            
            # Screening distribution
            stmt_dist = select(CandidateScreening.status, func.count(CandidateScreening.id)).join(Candidate).where(Candidate.is_deleted == False)
            if assigned_to_id is not None:
                stmt_dist = stmt_dist.join(Candidate.assignment).where(CandidateAssignment.user_id == assigned_to_id)
            stmt_dist = stmt_dist.group_by(CandidateScreening.status)
            res_dist = await self.db.execute(stmt_dist)
            raw_dist = dict(res_dist.all())
            
            screening_distribution = {}
            for status_key, count in raw_dist.items():
                target_key = status_key
                if status_key is None or status_key == '':
                    target_key = 'In Progress'
                screening_distribution[target_key] = screening_distribution.get(target_key, 0) + count
            
            not_screened = total - screened

            return {
                "not_screened": not_screened,
                "screening_distribution": screening_distribution
            }
        except Exception as e:
            # Log error
            import logging
            logging.error(f"Error in get_screening_stats: {e}")
            return {
                "not_screened": 0,
                "screening_distribution": {}
            }
