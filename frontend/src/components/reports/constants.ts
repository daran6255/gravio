// Column definitions
export const ALL_COLUMNS = [
	// General Info
	{ id: 'name', label: 'Candidate Name', default: true, group: 'general' },
	{ id: 'gender', label: 'Gender', default: true, group: 'general' },
	{ id: 'email', label: 'Email', default: true, group: 'general' },
	{ id: 'phone', label: 'Phone', default: true, group: 'general' },
	{ id: 'whatsapp_number', label: 'WhatsApp', default: false, group: 'general' },
	{ id: 'dob', label: 'DOB', default: false, group: 'general' },
	{ id: 'city', label: 'City', default: false, group: 'general' },
	{ id: 'district', label: 'District', default: false, group: 'general' },
	{ id: 'state', label: 'State', default: false, group: 'general' },
	{ id: 'pincode', label: 'Pincode', default: false, group: 'general' },
	{ id: 'year_of_passing', label: 'Year of Passing', default: false, group: 'general' },
	{ id: 'education_level', label: 'Education', default: false, group: 'general' },
	{ id: 'disability_type', label: 'Disability Type', default: true, group: 'general' },
	{ id: 'disability_percentage', label: 'Disability Percentage', default: false, group: 'general' },
	{ id: 'created_at', label: 'Registration Date', default: false, group: 'general' },

	// Screening Info
	{ id: 'screening_status', label: 'Screening Status', default: true, group: 'screening' },
	{ id: 'source_of_info', label: 'Where you know about us', default: false, group: 'screening' },
	{ id: 'family_annual_income', label: 'Family Annual Income', default: false, group: 'screening' },
	{ id: 'screened_by_name', label: 'Screened By', default: false, group: 'screening' },
	{ id: 'assigned_to_name', label: 'Screening Assigned To', default: false, group: 'screening' },
	{ id: 'screening_date', label: 'Screened Date', default: false, group: 'screening' },
	{ id: 'screening_updated_at', label: 'Screening Update Date', default: false, group: 'screening' },
	{ id: 'family_details', label: 'Family Details', default: false, group: 'screening' },
	{ id: 'documents_uploaded', label: 'Uploaded Documents', default: false, group: 'screening' },
	{ id: 'screening_comments', label: 'Screening Reason', default: false, group: 'screening' },

	// Counseling Info
	{ id: 'counseling_status', label: 'Counseling Status', default: true, group: 'counseling' },
	{ id: 'counselor_name', label: 'Counselor', default: false, group: 'counseling' },
	{ id: 'counseling_date', label: 'Counseling Date', default: false, group: 'counseling' },
	{ id: 'feedback', label: 'Counseling Feedback', default: false, group: 'counseling' },
	{ id: 'skills', label: 'Counseling Skills', default: false, group: 'counseling' },
	{ id: 'suitable_job_roles', label: 'Suitable Job Roles', default: false, group: 'counseling' },
	{ id: 'questions', label: 'Assignment Q&A', default: false, group: 'counseling' },
	{ id: 'workexperience', label: 'Counseling Work Experience', default: false, group: 'counseling' },

	// Work Experience (Direct)
	{ id: 'is_experienced', label: 'Is Experienced?', default: false, group: 'experience' },
	{ id: 'year_of_experience', label: 'Years of Experience', default: false, group: 'experience' },
	{ id: 'currently_employed', label: 'Currently Employed?', default: false, group: 'experience' },
];

export const TRAINING_COLUMNS = [
	// Candidate Details
	{ id: 'name', label: 'Candidate Name', default: true, group: 'candidate' },
	{ id: 'gender', label: 'Gender', default: true, group: 'candidate' },
	{ id: 'disability_type', label: 'Disability Type', default: true, group: 'candidate' },
	{ id: 'email', label: 'Email', default: true, group: 'candidate' },
	{ id: 'phone', label: 'Phone', default: true, group: 'candidate' },

	// Batch Details
	{ id: 'batch_name', label: 'Batch Name', default: true, group: 'batch' },
	{ id: 'batch_status', label: 'Batch Status', default: false, group: 'batch' },
	{ id: 'domain', label: 'Domain', default: false, group: 'batch' },
	{ id: 'training_mode', label: 'Training Mode', default: false, group: 'batch' },
	{ id: 'courses', label: 'Course(s)', default: false, group: 'batch' },
	{ id: 'duration', label: 'Duration', default: false, group: 'batch' },

	// Progress
	{ id: 'status', label: 'Training Status', default: false, group: 'progress' },
	{ id: 'attendance_percentage', label: 'Attendance (%)', default: false, group: 'progress' },
	{ id: 'assessment_score', label: 'Assessment Mark', default: false, group: 'progress' },
	{ id: 'created_at', label: 'Allocation Date', default: false, group: 'progress' },
];
