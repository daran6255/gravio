import React, { useState, useEffect, useMemo } from 'react';
import {
	Dialog,
	Box,
	CircularProgress
} from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchFields, fetchSystemSettings } from '../../../store/slices/settingsSlice';
import type { CandidateCounselingCreate, WorkExperience } from '../../../models/candidate';

import EnterpriseForm, { type FormStep } from '../../common/form/EnterpriseForm';

// Tabs
import SkillAssessmentTab from './tabs/SkillAssessmentTab';
import WorkExperienceTab from './tabs/WorkExperienceTab';
import InterviewFeedbackTab from './tabs/InterviewFeedbackTab';
import CounselingInfoTab from './tabs/CounselingInfoTab';
import { useDateTime } from '../../../hooks/useDateTime';

const PREDEFINED_QUESTIONS = [
	'Tell us about yourself and your background?'
];

interface CounselingFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: CandidateCounselingCreate) => void;
	initialData?: CandidateCounselingCreate;
	candidateName?: string;
	candidateWorkExperience?: WorkExperience;
}

const CounselingFormDialog: React.FC<CounselingFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	initialData,
	candidateName,
	candidateWorkExperience
}) => {
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.auth.user);
	const loadingFields = useAppSelector(state => state.settings.loading);
	const [showErrors, setShowErrors] = useState(false);
	const { formatDate } = useDateTime();

	const [formData, setFormData] = useState<CandidateCounselingCreate>({
		skills: [],
		feedback: '',
		questions: [],
		status: 'pending',
		counselor_name: '',
		counseling_date: new Date().toISOString().split('T')[0],
		others: {},
		workexperience: [],
		suitable_job_roles: [],
		assigned_to: [],
		remarks: ''
	});

	useEffect(() => {
		if (open) {
			dispatch(fetchFields('counseling'));
			dispatch(fetchSystemSettings());

			if (initialData) {
				const othersValues = initialData.others || {};
				setFormData({
					...initialData,
					skills: initialData.skills || [],
					questions: initialData.questions || [],
					others: initialData.others || {},
					workexperience: initialData.workexperience || [],
					counseling_date: initialData.counseling_date ? initialData.counseling_date.split('T')[0] : new Date().toISOString().split('T')[0],
					status: initialData.status || 'pending',
					suitable_job_roles: initialData.suitable_job_roles || [],
					assigned_to: Array.isArray(initialData.assigned_to) ? initialData.assigned_to : 
								(initialData.assigned_to ? [initialData.assigned_to] : 
								(Array.isArray(othersValues.assigned_to) ? othersValues.assigned_to : 
								(othersValues.assigned_to ? [othersValues.assigned_to] : []))),
					remarks: initialData.remarks || othersValues.remarks || ''
				});
			} else {
				const defaultQuestions = PREDEFINED_QUESTIONS.map(q => ({
					question: q,
					answer: ''
				}));
				setFormData({
					skills: [],
					feedback: '',
					questions: defaultQuestions,
					status: 'pending',
					counselor_name: user ? (user.full_name || user.username) : '',
					counseling_date: new Date().toISOString().split('T')[0],
					others: {},
					workexperience: [],
					suitable_job_roles: [],
					assigned_to: [],
					remarks: ''
				});
			}
			setShowErrors(false);
		}
	}, [initialData, open, user, dispatch]);

	const handleChange = (field: string, value: unknown) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleUpdateOtherField = (name: string, value: unknown) => {
		setFormData((prev) => ({
			...prev,
			others: {
				...prev.others,
				[name]: value
			}
		}));
	};

	const handleUpdateWorkExpField = (index: number, name: string, value: unknown) => {
		const newWorkExp = [...(formData.workexperience || [])];
		newWorkExp[index] = { ...newWorkExp[index], [name]: value };
		handleChange('workexperience', newWorkExp);
	};

	const handleAddWorkExp = () => {
		const newWorkExp = [
			...(formData.workexperience || []),
			{ job_title: '', company: '', years_of_experience: '', currently_working: false }
		];
		handleChange('workexperience', newWorkExp);
	};

	const handleRemoveWorkExp = (index: number) => {
		const newWorkExp = [...(formData.workexperience || [])];
		newWorkExp.splice(index, 1);
		handleChange('workexperience', newWorkExp);
	};

	const handleAddSkill = () => {
		const newSkills = [...(formData.skills || []), { name: '', level: 'Beginner' as const }];
		handleChange('skills', newSkills);
	};

	const handleRemoveSkill = (index: number) => {
		const newSkills = [...(formData.skills || [])];
		newSkills.splice(index, 1);
		handleChange('skills', newSkills);
	};

	const handleSkillChange = (index: number, field: string, value: unknown) => {
		const newSkills = [...(formData.skills || [])];
		newSkills[index] = { ...newSkills[index], [field]: value } as { name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' };
		handleChange('skills', newSkills);
	};

	const handleQuestionChange = (index: number, field: string, value: string) => {
		const newQuestions = [...(formData.questions || [])];
		newQuestions[index] = { ...newQuestions[index], [field]: value } as { question: string; answer: string };
		handleChange('questions', newQuestions);
	};

	const handleAddQuestion = () => {
		const newQuestions = [...(formData.questions || []), { question: '', answer: '' }];
		handleChange('questions', newQuestions);
	};

	const handleRemoveQuestion = (index: number) => {
		const newQuestions = [...(formData.questions || [])];
		newQuestions.splice(index, 1);
		handleChange('questions', newQuestions);
	};

	const handleSubmit = () => {
		const userRole = user?.role || '';
		const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager' || userRole === 'sourcing';
		
		// Validation for Assignment/Remarks (Manager/Admin Only)
		if (isManagerOrAdmin && (!formData.assigned_to || formData.assigned_to.length === 0) && !formData.remarks) {
			setShowErrors(true);
			return;
		}

		const cleanedData = { ...formData };
		if (cleanedData.counseling_date && !cleanedData.counseling_date.includes('T')) {
			cleanedData.counseling_date = `${cleanedData.counseling_date}T00:00:00`;
		}
		onSubmit(cleanedData);
		onClose();
	};

	const steps: FormStep[] = useMemo(() => [
		{
			label: 'Skill Assessment',
			content: (
				<SkillAssessmentTab
					formData={formData}
					onAddSkill={handleAddSkill}
					onRemoveSkill={handleRemoveSkill}
					onSkillChange={handleSkillChange}
				/>
			)
		},
		{
			label: 'Work Experience',
			content: (
				<WorkExperienceTab
					formData={formData}
					onAddWorkExp={handleAddWorkExp}
					onRemoveWorkExp={handleRemoveWorkExp}
					onWorkExpChange={handleUpdateWorkExpField}
					candidateWorkExperience={candidateWorkExperience}
				/>
			)
		},
		{
			label: 'Interview & Feedback',
			content: (
				<InterviewFeedbackTab
					formData={formData}
					onAddQuestion={handleAddQuestion}
					onRemoveQuestion={handleRemoveQuestion}
					onQuestionChange={handleQuestionChange}
					onFeedbackChange={(val) => handleChange('feedback', val)}
					onJobRolesChange={(roles) => handleChange('suitable_job_roles', roles)}
				/>
			)
		},
		{
			label: 'Counseling Info',
			content: (
				<CounselingInfoTab
					formData={formData}
					onFieldChange={handleChange}
					onUpdateOtherField={handleUpdateOtherField}
					showErrors={showErrors}
				/>
			)
		}
	], [formData, user, showErrors]);

	const counselorName = initialData?.counselor_name || user?.full_name || user?.username || '—';
	const dateString = formatDate(formData.counseling_date || new Date());

	const subtitle = `${candidateName || 'New Candidate'} • Counselor: ${counselorName} • Date: ${dateString}`;

	return (
		<Dialog
			open={open}
			onClose={(_event, reason) => {
				if (reason === 'backdropClick') return;
				onClose();
			}}
			disableEscapeKeyDown
			maxWidth="lg"
			fullWidth
			PaperProps={{ sx: { borderRadius: '4px', bgcolor: 'transparent', boxShadow: 'none' } }}
		>
			{loadingFields ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 8, bgcolor: 'white', borderRadius: '4px' }}>
					<CircularProgress />
				</Box>
			) : (
				<EnterpriseForm
					title="Candidate Counseling"
					subtitle={subtitle}
					mode={initialData ? 'edit' : 'create'}
					steps={steps}
					onSave={handleSubmit}
					onCancel={onClose}
					saveButtonText={initialData ? 'Update Counseling' : 'Save Counseling'}
				/>
			)}
		</Dialog>
	);
};

export default CounselingFormDialog;
