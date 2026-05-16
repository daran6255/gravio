"""Candidate Pydantic schemas"""

from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field, model_validator, ConfigDict

# Import related schemas (forward compatibility)
from app.schemas.candidate_screening import CandidateScreeningResponse
from app.schemas.candidate_document import CandidateDocumentResponse
from app.schemas.candidate_counseling import CandidateCounselingResponse


# Nested Schemas for JSON fields


class Degree(BaseModel):
    degree_name: str
    specialization: str
    college_name: str
    year_of_passing: int
    percentage: float


class EducationDetails(BaseModel):
    degrees: List[Degree] = []


class WorkExperience(BaseModel):
    is_experienced: bool = False
    currently_employed: bool = False
    year_of_experience: Optional[str] = None


class DisabilityDetails(BaseModel):
    is_disabled: bool = False
    disability_type: Optional[str] = None
    disability_percentage: Optional[float] = None


# CRUD Schemas

class CandidateBase(BaseModel):
    name: str
    gender: str
    email: EmailStr
    phone: str
    whatsapp_number: Optional[str] = None
    dob: Optional[date] = None
    pincode: str
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country_code: str = Field(default="IN", description="Country code for address validation")
    
    guardian_details: Optional[dict] = None
    work_experience: Optional[WorkExperience] = None
    education_details: Optional[EducationDetails] = None
    disability_details: Optional[DisabilityDetails] = None
    other: Optional[dict] = None


class CandidateCreate(CandidateBase):
    pass


class CandidateCheck(BaseModel):
    email: EmailStr
    phone: str
    pincode: str
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country_code: str = "IN"
    exclude_public_id: Optional[UUID] = None


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    dob: Optional[date] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country_code: Optional[str] = "IN"
    guardian_details: Optional[dict] = None
    work_experience: Optional[dict] = None
    education_details: Optional[EducationDetails] = None
    disability_details: Optional[DisabilityDetails] = None


class CandidateResponse(CandidateBase):
    """
    Candidate response schema.
    Note: Uses public_id (UUID) instead of internal id for security.
    """
    id: int
    public_id: UUID  # Secure UUID for external API
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional nested relationships (filled by trainers)
    screening: Optional[CandidateScreeningResponse] = None
    documents: List[CandidateDocumentResponse] = []
    counseling: Optional[CandidateCounselingResponse] = None
    
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        """Custom validation to handle unloaded SQLAlchemy relationships"""
        from sqlalchemy.orm import object_session
        from sqlalchemy.inspect import inspect
        
        # If this is a SQLAlchemy object, check which relationships are loaded
        if hasattr(obj, '__dict__'):
            state = inspect(obj)
            if state:
                # Only include relationships that are actually loaded
                data = {}
                for key in cls.model_fields.keys():
                    if key in ['screening', 'documents', 'counseling']:
                        # Check if the relationship is loaded
                        if key in state.unloaded:
                            # Skip unloaded relationships
                            continue
                    # Get the attribute value
                    try:
                        data[key] = getattr(obj, key)
                    except:
                        # If we can't get it, skip it
                        continue
                        
                return super().model_validate(data, *args, **kwargs)
        
        return super().model_validate(obj, *args, **kwargs)
    
    class Config:
        from_attributes = True


class CandidateMini(BaseModel):
    """Simplified candidate schema for nested responses"""
    id: int
    public_id: UUID
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    documents: List[CandidateDocumentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CandidateListResponse(BaseModel):
    """Simplified response for list endpoints"""
    id: int
    public_id: UUID
    name: str
    gender: str
    email: Any
    phone: str
    whatsapp_number: Optional[str] = None
    dob: Optional[date] = None
    pincode: str
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    created_at: datetime
    is_disabled: bool = False
    disability_type: Optional[str] = None
    disability_percentage: Optional[float] = None
    education_level: Optional[str] = None
    screening_status: str = "Pending"
    counseling_status: Optional[str] = None
    counselor_name: Optional[str] = None
    counseling_date: Optional[datetime] = None
    documents_uploaded: List[str] = []
    family_details: Optional[List[dict]] = None
    
    # Assignment fields
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    
    # Counseling fields
    feedback: Optional[str] = None
    skills: Optional[List[dict]] = None
    questions: Optional[List[dict]] = None
    workexperience: Optional[List[dict]] = None
    suitable_job_roles: Optional[List[str]] = None
    assigned_to: Optional[List[str]] = None
    remarks: Optional[str] = None
    
    # New Screening fields
    source_of_info: Optional[str] = None
    family_annual_income: Optional[Any] = None
    screening_comments: Optional[str] = None
    screened_by_name: Optional[str] = None
    screening_date: Optional[datetime] = None
    screening_updated_at: Optional[datetime] = None
    screening: Optional[dict] = None
    counseling: Optional[dict] = None
    
    # Flattened Experience & Education
    is_experienced: bool = False
    year_of_experience: Optional[str] = None
    currently_employed: bool = False
    year_of_passing: Optional[int] = None
    registration_type: Optional[str] = None
    
    @model_validator(mode='before')
    @classmethod
    def extract_flattened_data(cls, data: Any) -> Any:
        # data could be ORM object or dict
        is_disabled = False
        disability_type = None
        disability_percentage = None
        education_level = None
        screening_status = "Pending"
        counseling_status = None
        counselor_name = None
        counseling_date = None
        feedback = None
        skills = []
        questions = []
        workexperience = []
        suitable_job_roles = []
        documents_uploaded = []
        family_details = None
        source_of_info = None
        family_annual_income = None
        screened_by_name = None
        screening_date = None
        screening_updated_at = None
        screening_comments = None
        assigned_to_id = None
        assigned_to_name = None
        assigned_to = []
        remarks = None
        registration_type = None
        
        screening_data = None
        counseling_data = None
        
        # ... (rest of helper functions)
        def get_val(obj, key, default=None):
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)

        # 1. Disability Data
        details = get_val(data, 'disability_details')
        if details and isinstance(details, dict):
            is_disabled = details.get('is_disabled', False)
            disability_type = details.get('disability_type')
            disability_percentage = details.get('disability_percentage')

        # 1.1 Work Experience Data
        is_experienced = False
        year_of_experience = None
        currently_employed = False
        work_exp = get_val(data, 'work_experience')
        if work_exp and isinstance(work_exp, dict):
            is_experienced = work_exp.get('is_experienced', False)
            year_of_experience = work_exp.get('year_of_experience')
            currently_employed = work_exp.get('currently_employed', False)

        # 2. Education Data
        year_of_passing = None
        edu_details = get_val(data, 'education_details')
        if edu_details and isinstance(edu_details, dict):
            degrees = edu_details.get('degrees', [])
            if degrees and len(degrees) > 0:
                education_level = degrees[0].get('degree_name')
                year_of_passing = degrees[0].get('year_of_passing')

        # 3. Screening Data
        screening = None
        if isinstance(data, dict):
            screening = data.get('screening')
        elif hasattr(data, '__dict__') and 'screening' in data.__dict__:
            screening = data.screening
        
        if screening:
            status_val = get_val(screening, 'status')
            screening_status = status_val if status_val else "In Progress"
            family_details = get_val(screening, 'family_details')
            screening_date = get_val(screening, 'created_at')
            screening_updated_at = get_val(screening, 'updated_at')
            
            # Extract from others JSON field
            others = get_val(screening, 'others')
            if others:
                if isinstance(others, dict):
                    source_of_info = others.get('source_of_info')
                    family_annual_income = others.get('family_annual_income')
                    # Check for 'reason' first (as per user request), then 'comments'
                    screening_comments = others.get('reason')
                
                # Expose full others in screening object for dynamic fields
                screening_data = {'others': others}
            
            # Extract screened_by info
            screened_by = None
            if isinstance(screening, dict):
                screened_by = screening.get('screened_by')
            elif hasattr(screening, '__dict__'):
                # Handle SQLAlchemy relationship carefully
                try:
                    screened_by = screening.screened_by
                except:
                    screened_by = None
            
            if screened_by:
                fname = get_val(screened_by, 'full_name')
                uname = get_val(screened_by, 'username')
                screened_by_name = fname if fname else uname

        # 4. Counseling Data (Relationship)
        counseling = None
        if isinstance(data, dict):
            counseling = data.get('counseling')
        elif hasattr(data, '__dict__') and 'counseling' in data.__dict__:
            counseling = data.counseling

        if counseling:
            counseling_status = get_val(counseling, 'status')
            counseling_date = get_val(counseling, 'counseling_date')
            counselor_name = get_val(counseling, 'counselor_name')
            feedback = get_val(counseling, 'feedback')
            skills = get_val(counseling, 'skills', [])
            questions = get_val(counseling, 'questions', [])
            workexperience = get_val(counseling, 'workexperience', [])
            
            # Extract suitable job roles, assigned_to, and remarks (from property or others)
            suitable_job_roles = get_val(counseling, 'suitable_job_roles', [])
            assigned_to = get_val(counseling, 'assigned_to')
            remarks = get_val(counseling, 'remarks')
            
            if assigned_to and isinstance(assigned_to, str):
                assigned_to = [assigned_to]
            elif not assigned_to:
                assigned_to = []

            c_others = get_val(counseling, 'others')
            if c_others and isinstance(c_others, dict):
                if not suitable_job_roles:
                    suitable_job_roles = c_others.get('suitable_job_roles', [])
                if not assigned_to or len(assigned_to) == 0:
                    val = c_others.get('assigned_to')
                    if isinstance(val, str):
                        assigned_to = [val]
                    else:
                        assigned_to = val or []
                if not remarks:
                    remarks = c_others.get('remarks')
            
            # Extract others for dynamic fields
            counseling_others = get_val(counseling, 'others')
            if counseling_others:
                counseling_data = {'others': counseling_others}
            
            counselor = None
            if isinstance(counseling, dict):
                counselor = counseling.get('counselor')
            elif hasattr(counseling, '__dict__') and 'counselor' in counseling.__dict__:
                counselor = counseling.counselor
            
            if counselor:
                fname = get_val(counselor, 'full_name')
                if fname:
                    counselor_name = fname

        # 5. Documents (Relationship)
        docs_list = None
        if isinstance(data, dict):
            docs_list = data.get('documents')
        elif hasattr(data, '__dict__') and 'documents' in data.__dict__:
            docs_list = data.documents

        if docs_list:
            documents_uploaded = [get_val(d, 'document_type') for d in docs_list]

        # 6. Assignment Data
        assignment = None
        if isinstance(data, dict):
            assignment = data.get('assignment')
        elif hasattr(data, '__dict__') and 'assignment' in data.__dict__:
            assignment = data.assignment
        
        if assignment:
            assigned_to_id = get_val(assignment, 'user_id')
            user = None
            if isinstance(assignment, dict):
                user = assignment.get('user')
            elif hasattr(assignment, '__dict__'):
                try:
                    user = assignment.user
                except:
                    user = None
            
            if user:
                fname = get_val(user, 'full_name')
                uname = get_val(user, 'username')
                assigned_to_name = fname if fname else uname

        # 6.5 Registration Type (from other JSON)
        other = get_val(data, 'other')
        if other and isinstance(other, dict):
            registration_type = other.get('registration_type')

        # 7. Build response dict
        if isinstance(data, dict):
            data.update({
                'is_disabled': is_disabled,
                'disability_type': disability_type,
                'disability_percentage': disability_percentage,
                'education_level': education_level,
                'screening_status': screening_status,
                'counseling_status': counseling_status,
                'counselor_name': counselor_name,
                'counseling_date': counseling_date,
                'feedback': feedback,
                'skills': skills,
                'questions': questions,
                'workexperience': workexperience,
                'suitable_job_roles': suitable_job_roles,
                'documents_uploaded': documents_uploaded,
                'family_details': family_details,
                'source_of_info': source_of_info,
                'family_annual_income': family_annual_income,
                'screening_comments': screening_comments,
                'screened_by_name': screened_by_name,
                'screening_date': screening_date,
                'screening_updated_at': screening_updated_at,
                'screening': screening_data,
                'counseling': counseling_data,
                'assigned_to': assigned_to,
                'remarks': remarks,
                'is_experienced': is_experienced,
                'year_of_experience': year_of_experience,
                'currently_employed': currently_employed,
                'year_of_passing': year_of_passing,
                'assigned_to_id': assigned_to_id,
                'assigned_to_name': assigned_to_name,
                'registration_type': registration_type
            })
            return data
            
        # For ORM objects, create a complete dict
        return {
            'id': get_val(data, 'id'),
            'public_id': get_val(data, 'public_id'),
            'name': get_val(data, 'name'),
            'gender': get_val(data, 'gender'),
            'email': get_val(data, 'email'),
            'phone': get_val(data, 'phone'),
            'whatsapp_number': get_val(data, 'whatsapp_number'),
            'dob': get_val(data, 'dob'),
            'pincode': get_val(data, 'pincode'),
            'city': get_val(data, 'city'),
            'district': get_val(data, 'district'),
            'state': get_val(data, 'state'),
            'created_at': get_val(data, 'created_at'),
            'is_disabled': is_disabled,
            'disability_type': disability_type,
            'disability_percentage': disability_percentage,
            'education_level': education_level,
            'screening_status': screening_status,
            'counseling_status': counseling_status,
            'counselor_name': counselor_name,
            'counseling_date': counseling_date,
            'feedback': feedback,
            'skills': skills,
            'questions': questions,
            'workexperience': workexperience,
            'suitable_job_roles': suitable_job_roles,
            'assigned_to': assigned_to,
            'remarks': remarks,
            'documents_uploaded': documents_uploaded,
            'family_details': family_details,
            'source_of_info': source_of_info,
            'family_annual_income': family_annual_income,
            'screening_comments': screening_comments,
            'screened_by_name': screened_by_name,
            'screening_date': screening_date,
            'screening_updated_at': screening_updated_at,
            'screening': screening_data,
            'counseling': counseling_data,
            'is_experienced': is_experienced,
            'year_of_experience': year_of_experience,
            'currently_employed': currently_employed,
            'year_of_passing': year_of_passing,
            'assigned_to_id': assigned_to_id,
            'assigned_to_name': assigned_to_name,
            'registration_type': registration_type
        }



    class Config:
        from_attributes = True


class CandidateStats(BaseModel):
    total: int
    male: int
    female: int
    others: int
    today: int
    weekly: List[int] = []
    screened: int
    not_screened: int
    total_counseled: int = 0
    counseling_pending: int = 0
    counseling_selected: int = 0
    counseling_rejected: int = 0
    docs_total: int = 0
    docs_completed: int = 0
    docs_pending: int = 0
    files_collected: int = 0
    files_to_collect: int = 0
    candidates_fully_submitted: int = 0
    candidates_partially_submitted: int = 0
    candidates_not_submitted: int = 0
    screening_distribution: dict = {}
    counseling_distribution: dict = {}
    in_training: int = 0
    moved_to_placement: int = 0
    got_job: int = 0

class ScreeningStats(BaseModel):
    not_screened: int
    screening_distribution: dict = {}


class CandidatePaginatedResponse(BaseModel):
    """Paginated response for candidate listing"""
    items: List[CandidateListResponse]
    total: int



