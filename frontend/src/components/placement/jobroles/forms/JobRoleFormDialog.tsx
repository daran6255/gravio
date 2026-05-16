import React, { useState, useEffect, useMemo } from 'react';
import {
	Dialog,
	Box,
	useMediaQuery,
	useTheme,
	Paper,
	alpha,
	Collapse,
	Alert
} from '@mui/material';
import { aiService } from '../../../../services/aiService';
import useToast from '../../../../hooks/useToast';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import type { RootState } from '../../../../store/store';
import type { JobRole, JobRoleCreate, JobRoleUpdate } from '../../../../models/jobRole';
import { JOB_ROLE_STATUS } from '../../../../models/jobRole';
import { fetchCompanies } from '../../../../store/slices/companySlice';
import { fetchContacts } from '../../../../store/slices/contactSlice';
import companyService from '../../../../services/companyService';
import contactService from '../../../../services/contactService';

// Standardized Components
import EnterpriseFormHeader, { type FormStep } from '../../../common/form/EnterpriseFormHeader';
import EnterpriseFormFooter from '../../../common/form/EnterpriseFormFooter';

// Step Components
import SelectionModeStep from './steps/SelectionModeStep';
import AIInputStep from './steps/AIInputStep';
import ReviewPublishStep from './steps/ReviewPublishStep';

interface JobRoleFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: JobRoleCreate | JobRoleUpdate) => void;
	jobRole?: JobRole | null;
	loading?: boolean;
}

const JobRoleFormDialog: React.FC<JobRoleFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	jobRole,
	loading = false
}) => {
	const dispatch = useAppDispatch();
	const { list: companies } = useAppSelector((state: RootState) => state.companies);
	const { list: contacts } = useAppSelector((state: RootState) => state.contacts);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const toast = useToast();

	const getDefaultCloseDate = () => {
		const date = new Date();
		date.setDate(date.getDate() + 20);
		return date.toISOString().split('T')[0];
	};

	// Navigation & Mode States
	const [activeStep, setActiveStep] = useState(0);
	const [reviewTabValue, setReviewTabValue] = useState(0);
	const [showSource, setShowSource] = useState(false);
	const [formMode, setFormMode] = useState<'select' | 'ai' | 'manual' | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	// AI Extraction States
	const [jdText, setJdText] = useState('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isExtracting, setIsExtracting] = useState(false);
	const [suggestions, setSuggestions] = useState<any>(null);
	const [dragActive, setDragActive] = useState(false);
	const [pendingEntities, setPendingEntities] = useState<{
		company_name: string | null;
		contact_name: string | null;
		contact_email: string | null;
		contact_phone: string | null;
	}>({ company_name: null, contact_name: null, contact_email: null, contact_phone: null });

	const [formData, setFormData] = useState<Partial<JobRole>>({
		title: '',
		description: '',
		status: JOB_ROLE_STATUS.ACTIVE,
		is_visible: true,
		location: { cities: [], states: [], country: 'India' },
		salary_range: { min: undefined, max: undefined, currency: 'INR' },
		experience: { min: undefined, max: undefined },
		requirements: { skills: [], qualifications: [], disability_preferred: [] },
		job_details: { designation: '', workplace_type: '', job_type: '' },
	});

	useEffect(() => {
		if (open) {
			dispatch(fetchCompanies({ limit: 1000 }));
			setActiveStep(0);
			setFormMode(jobRole ? 'manual' : null);
			setSuggestions(null);
			setSubmitError(null);
			setPendingEntities({ 
				company_name: null, 
				contact_name: null,
				contact_email: null,
				contact_phone: null
			});
			setJdText('');
			setSelectedFile(null);
			if (jobRole) {
				const legacyState = (jobRole.location as any)?.state as string | undefined;
				setFormData({
					...jobRole,
					close_date: jobRole.close_date?.split('T')[0],
					location: {
						...jobRole.location,
						states: jobRole.location?.states || (legacyState ? [legacyState] : []),
						cities: jobRole.location?.cities || []
					},
					requirements: {
						...jobRole.requirements,
						disability_preferred: jobRole.requirements?.disability_preferred || []
					}
				});
				setActiveStep(0); // For edit, it's just 'Review & Publish' essentially, but we use EnterpriseForm steps logic
			} else {
				setFormData({
					title: '',
					status: JOB_ROLE_STATUS.ACTIVE,
					is_visible: true,
					no_of_vacancies: 1,
					close_date: getDefaultCloseDate(),
					location: { cities: [], states: [], country: 'India' },
					requirements: {
						skills: [],
						qualifications: ['Any Graduation'],
						disability_preferred: []
					},
					job_details: { designation: '', workplace_type: 'Onsite', job_type: 'Full Time' }
				});
			}
		}
	}, [open, jobRole, dispatch]);

	useEffect(() => {
		if (formData.company_id) {
			dispatch(fetchContacts({ companyId: formData.company_id, limit: 1000 }));
		}
	}, [dispatch, formData.company_id]);

	const handleChange = (field: string, value: unknown) => setFormData(prev => ({ ...prev, [field]: value }));
	const handleNestedChange = (parent: string, field: string, value: unknown) =>
		setFormData(prev => ({ ...prev, [parent]: { ...((prev as any)[parent] || {}), [field]: value } }));

	const handleExtractFromSource = async () => {
		if (!jdText.trim() && !selectedFile) {
			toast.warning('Please paste a job description or upload a PDF file.');
			return;
		}

		setIsExtracting(true);
		try {
			const result = await aiService.extractJobRole(jdText || undefined, selectedFile || undefined);
			const extracted = result.data;

			setFormData(prev => ({
				...prev,
				...extracted,
				company_id: result.suggestions?.company_id || prev.company_id,
				contact_id: result.suggestions?.contact_id || prev.contact_id,
				no_of_vacancies: extracted.no_of_vacancies || prev.no_of_vacancies || 1,
				close_date: extracted.close_date || prev.close_date || getDefaultCloseDate(),
				location: {
					...prev.location,
					...extracted.location,
					cities: extracted.location?.cities || prev.location?.cities || []
				},
				requirements: {
					...prev.requirements,
					...extracted.requirements,
					qualifications: extracted.requirements?.qualifications?.length
						? extracted.requirements.qualifications
						: (prev.requirements?.qualifications?.length ? prev.requirements.qualifications : ['Any degree'])
				},
				job_details: {
					...prev.job_details,
					...extracted.job_details
				}
			}));

			setSuggestions(result.suggestions);

			if (!result.suggestions.company_id && result.suggestions.company_name) {
				setPendingEntities(prev => ({ ...prev, company_name: result.suggestions.company_name }));
			}
			if (!result.suggestions.contact_id && result.suggestions.contact_name) {
				setPendingEntities(prev => ({ 
					...prev, 
					contact_name: result.suggestions.contact_name,
					contact_email: result.suggestions.contact_email,
					contact_phone: result.suggestions.contact_phone
				}));
			}

			setActiveStep(2);
			toast.success('AI Analysis complete. Please verify the results and publish.');
		} catch (error: any) {
			console.error('Extraction error:', error);
			toast.error(error.message || 'Failed to analyze JD. Please check your AI settings.');
		} finally {
			setIsExtracting(false);
		}
	};

	const validateData = (data: Partial<JobRole>, pending: any) => {
		const basicInfoValid = !!(
			data.title &&
			data.job_details?.designation &&
			(data.company_id || pending.company_name) &&
			(data.contact_id || pending.contact_name)
		);
		const descriptionValid = (data.description || '').trim().length >= 10;
		const locationValid = !!(data.location?.states?.length && data.location?.country);
		const requirementsValid = !!(data.requirements?.qualifications?.length);

		return {
			basicInfo: basicInfoValid,
			description: descriptionValid,
			location: locationValid,
			requirements: requirementsValid,
			isValid: basicInfoValid && descriptionValid && locationValid && requirementsValid
		};
	};

	const validation = useMemo(() => validateData(formData, pendingEntities), [formData, pendingEntities]);

	const handleSubmit = async () => {
		if (!validation.isValid) return;
		setSubmitError(null);

		let finalFormData = { ...formData };

		try {
			if (!finalFormData.company_id && pendingEntities.company_name) {
				const newCompany = await companyService.create({
					name: pendingEntities.company_name,
					status: 'active'
				});
				finalFormData.company_id = newCompany.id;
				dispatch(fetchCompanies({ limit: 1000 }));
			}

			if (!finalFormData.contact_id && pendingEntities.contact_name && finalFormData.company_id) {
				const names = pendingEntities.contact_name.split(' ');
				const firstName = names[0];
				const lastName = names.slice(1).join(' ') || '.';

				const newContact = await contactService.create({
					company_id: finalFormData.company_id,
					first_name: firstName,
					last_name: lastName,
					email: pendingEntities.contact_email || undefined,
					phone: pendingEntities.contact_phone || undefined,
					is_primary: true,
					is_decision_maker: false
				});
				finalFormData.contact_id = newContact.id;
				dispatch(fetchContacts({ companyId: finalFormData.company_id, limit: 1000 }));
			}

			const submitData = { ...finalFormData };
			const fieldsToExclude = ['id', 'public_id', 'created_at', 'updated_at', 'company', 'contact', 'creator'] as const;

			fieldsToExclude.forEach(field => {
				delete (submitData as any)[field];
			});

			onSubmit(submitData as JobRoleCreate);
		} catch (error: any) {
			console.error('Final submission error:', error);
			setSubmitError(error.response?.data?.detail || 'Failed to create linked entities. Please check the form.');
			toast.error('Submission failed');
		}
	};

	const steps: FormStep[] = jobRole 
		? [{ label: 'Edit Requisition', content: null }]
		: [
			{ label: 'Selection Mode', content: null },
			{ label: 'Input Source', content: null },
			{ label: 'Review & Publish', content: null }
		];

	const handleBack = () => {
		if (activeStep > 0) {
			if (activeStep === 2 && formMode === 'manual') {
				setActiveStep(0);
			} else {
				setActiveStep(prev => prev - 1);
			}
		}
	};

	const handleNext = () => {
		if (activeStep === 1) {
			handleExtractFromSource();
		} else {
			setActiveStep(prev => prev + 1);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			fullScreen={isMobile}
			PaperProps={{
				sx: {
					borderRadius: isMobile ? 0 : '8px',
					overflow: 'hidden',
					bgcolor: 'background.default'
				}
			}}
		>
			<Paper elevation={0} sx={{ 
				display: 'flex', 
				flexDirection: 'column', 
				minHeight: { xs: 'calc(100vh - 40px)', md: '620px' },
				maxHeight: 'calc(100vh - 40px)',
				overflow: 'hidden'
			}}>
				<EnterpriseFormHeader 
					title={jobRole ? 'Modify Talent Requisition' : 'New Talent Pipeline'}
					subtitle={jobRole ? `Precision adjusting record ${jobRole.public_id}` : 'Enterprise Job Architect - AI Assisted Pipeline'}
					mode={jobRole ? 'edit' : 'create'}
					activeStep={activeStep}
					steps={steps}
					onClose={onClose}
				/>

				<Box sx={{ 
					flex: 1, 
					p: { xs: 2, md: 4 }, 
					overflowY: 'auto', 
					bgcolor: alpha(theme.palette.background.default, 0.4) 
				}}>
					<Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
						<Collapse in={!!submitError}>
							{submitError && (
								<Alert severity="error" sx={{ mb: 3, borderRadius: '4px' }}>
									{submitError}
								</Alert>
							)}
						</Collapse>

						{activeStep === 0 && !jobRole && (
							<SelectionModeStep onSelect={(mode) => {
								setFormMode(mode);
								setActiveStep(mode === 'ai' ? 1 : 2);
							}} />
						)}

						{activeStep === 1 && (
							<AIInputStep 
								jdText={jdText}
								setJdText={setJdText}
								selectedFile={selectedFile}
								setSelectedFile={setSelectedFile}
								dragActive={dragActive}
								handleDrag={(e) => { e.preventDefault(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); }}
								handleDrop={(e) => {
									e.preventDefault();
									setDragActive(false);
									if (e.dataTransfer.files?.[0]) {
										const file = e.dataTransfer.files[0];
										if (file.type === 'application/pdf') {
											setSelectedFile(file);
											setJdText('');
										} else {
											toast.error('Only PDF supported');
										}
									}
								}}
								handleFileChange={(e) => {
									if (e.target.files?.[0]) {
										setSelectedFile(e.target.files[0]);
										setJdText('');
									}
								}}
								isExtracting={isExtracting}
							/>
						)}

						{(activeStep === 2 || (activeStep === 0 && jobRole)) && (
							<ReviewPublishStep 
								formData={formData}
								handleChange={handleChange}
								handleNestedChange={handleNestedChange}
								companies={companies}
								contacts={contacts}
								suggestions={suggestions}
								pendingEntities={pendingEntities}
								setPendingEntities={setPendingEntities}
								validation={validation}
								reviewTabValue={reviewTabValue}
								setReviewTabValue={setReviewTabValue}
								showSource={showSource}
								setShowSource={setShowSource}
							/>
						)}
					</Box>
				</Box>

				<EnterpriseFormFooter 
					activeStep={activeStep}
					totalSteps={steps.length}
					onBack={handleBack}
					onNext={handleNext}
					onSave={handleSubmit}
					onCancel={onClose}
					isSubmitting={loading || isExtracting}
					saveDisabled={activeStep === 1 ? (!jdText.trim() && !selectedFile) : !validation.isValid}
					useAccent={false}
					saveButtonText={activeStep === 1 ? 'Run AI Analysis' : (jobRole ? 'Update Requisition' : 'Publish Requisition')}
					mode={jobRole ? 'edit' : 'create'}
				/>
			</Paper>
		</Dialog>
	);
};

export default JobRoleFormDialog;
