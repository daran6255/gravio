import React, { useState, useEffect, useMemo } from 'react';
import {
	Dialog,
	Box,
	CircularProgress
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import useToast from '../../../hooks/useToast';
import { uploadDocument, downloadDocument, sendConsentEmail } from '../../../store/slices/candidateSlice';
import { fetchFields } from '../../../store/slices/settingsSlice';
import { extractCandidateData } from '../../../store/slices/aiSlice';
import EnterpriseForm, { type FormStep } from '../../common/form/EnterpriseForm';
import type { CandidateScreeningCreate } from '../../../models/candidate';
import { useDateTime } from '../../../hooks/useDateTime';
import { Button, Tooltip, alpha, useTheme } from '@mui/material';
import { AutoAwesome as MagicIcon } from '@mui/icons-material';

// Tabs
import BackgroundTrainingTab from './tabs/BackgroundTrainingTab';
import SkillsTab from './tabs/SkillsTab';
import FamilyDetailsTab from './tabs/FamilyDetailsTab';
import DocumentsRemarksTab from './tabs/DocumentsRemarksTab';

interface ScreeningFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (screening: CandidateScreeningCreate) => void;
	initialData?: any;
	candidateName?: string;
	candidatePublicId?: string;
	candidateGuardianDetails?: any;
	existingDocuments?: any[];
	onRefresh?: () => void;
}

const ScreeningFormDialog: React.FC<ScreeningFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	initialData,
	candidateName,
	candidatePublicId,
	candidateGuardianDetails,
	existingDocuments,
	onRefresh
}) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const toast = useToast();
	const { formatDate } = useDateTime();
	const dynamicFields = useAppSelector(state => state.settings.fields.screening) || [];
	const loadingFields = useAppSelector(state => state.settings.loading);

	const currentUser = useAppSelector(state => state.auth.user);
	const selectedCandidate = useAppSelector(state => state.candidates.selectedCandidate);

	const [uploading, setUploading] = useState<Record<string, boolean>>({});
	const [viewing, setViewing] = useState<Record<string, boolean>>({});
	const [sendingConsent, setSendingConsent] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [extracting, setExtracting] = useState(false);

	const [formData, setFormData] = useState<CandidateScreeningCreate>({
		status: 'In Progress',
		previous_training: {
			attended_any_training: false,
			training_details: '',
			is_winvinaya_student: false
		},
		skills: {
			technical_skills: [],
			soft_skills: []
		},
		family_details: [],
		documents_upload: {
			resume: false,
			disability_certificate: false,
			degree_qualification: false,
			resume_filename: '',
			disability_certificate_filename: '',
			degree_qualification_filename: '',
			resume_id: null,
			disability_certificate_id: null,
			degree_qualification_id: null
		},
		others: {
			willing_for_training: true,
			ready_to_relocate: false,
			source_of_info: '',
			family_annual_income: '',
			comments: ''
		}
	});

	// Initial setup when dialog opens
	useEffect(() => {
		if (open) {
			// Only fetch if not already loaded to avoid layout shifts/tab resets
			if (dynamicFields.length === 0) {
				dispatch(fetchFields('screening'));
			}
		}
	}, [open, dispatch, dynamicFields.length]);

	// Data initialization and updates (Refresh)
	useEffect(() => {
		if (!open) return;

		const docMap: Record<string, any> = {};
		if (existingDocuments) {
			existingDocuments.forEach(doc => {
				const typeKey = doc.document_type === 'degree_certificate' ? 'degree_qualification' : doc.document_type;
				docMap[typeKey] = {
					id: doc.id,
					name: doc.document_name
				};
			});
		}

		if (initialData) {
			setFormData({
				status: initialData.status || 'In Progress',
				consent_status: initialData.consent_status,
				previous_training: {
					attended_any_training: initialData.previous_training?.attended_any_training ?? false,
					training_details: initialData.previous_training?.training_details ?? '',
					is_winvinaya_student: initialData.previous_training?.is_winvinaya_student ?? false
				},
				skills: {
					technical_skills: initialData.skills?.technical_skills ?? [],
					soft_skills: initialData.skills?.soft_skills ?? []
				},
				family_details: initialData.family_details ?? [],
				documents_upload: {
					resume: initialData.documents_upload?.resume || !!docMap.resume,
					disability_certificate: initialData.documents_upload?.disability_certificate || !!docMap.disability_certificate,
					degree_qualification: initialData.documents_upload?.degree_qualification || !!docMap.degree_qualification,
					resume_filename: initialData.documents_upload?.resume_filename || docMap.resume?.name || '',
					disability_certificate_filename: initialData.documents_upload?.disability_certificate_filename || docMap.disability_certificate?.name || '',
					degree_qualification_filename: initialData.documents_upload?.degree_qualification_filename || docMap.degree_qualification?.name || '',
					resume_id: initialData.documents_upload?.resume_id || docMap.resume?.id || null,
					disability_certificate_id: initialData.documents_upload?.disability_certificate_id || docMap.disability_certificate?.id || null,
					degree_qualification_id: initialData.documents_upload?.degree_qualification_id || docMap.degree_qualification?.id || null
				},
				others: {
					willing_for_training: true,
					ready_to_relocate: false,
					source_of_info: '',
					family_annual_income: '',
					comments: '',
					...(initialData.others || {})
				}
			});
		} else {
			setFormData({
				status: 'In Progress',
				previous_training: {
					attended_any_training: false,
					training_details: '',
					is_winvinaya_student: false
				},
				skills: {
					technical_skills: [],
					soft_skills: []
				},
				family_details: candidateGuardianDetails ? [{
					name: candidateGuardianDetails.parent_name || '',
					phone: candidateGuardianDetails.parent_phone || '',
					relation: candidateGuardianDetails.relationship || '',
					occupation: '',
					company_name: '',
					position: ''
				}] : [],
				documents_upload: {
					resume: !!docMap.resume,
					disability_certificate: !!docMap.disability_certificate,
					degree_qualification: !!docMap.degree_qualification,
					resume_filename: docMap.resume?.name || '',
					disability_certificate_filename: docMap.disability_certificate?.name || '',
					degree_qualification_filename: docMap.degree_qualification?.name || '',
					resume_id: docMap.resume?.id || null,
					disability_certificate_id: docMap.disability_certificate?.id || null,
					degree_qualification_id: docMap.degree_qualification?.id || null
				},
				others: {
					willing_for_training: true,
					ready_to_relocate: false,
					source_of_info: '',
					family_annual_income: '',
					comments: ''
				}
			});
		}
	}, [initialData, open, existingDocuments, candidateGuardianDetails]);

	const handleUpdateField = (section: string, field: string, value: any) => {
		if (section === 'root') {
			setFormData((prev: any) => ({
				...prev,
				[field]: value
			}));
			return;
		}
		setFormData((prev: any) => ({
			...prev,
			[section]: {
				...prev[section],
				[field]: value
			}
		}));
	};

	const handleUpdateOtherField = (name: string, value: any) => {
		setFormData((prev: any) => ({
			...prev,
			others: {
				...prev.others,
				[name]: value
			}
		}));
	};

	const handleFileUpload = async (type: string, file: File) => {
		if (!candidatePublicId) return;

		// Validation: Format (PDF only)
		if (file.type !== 'application/pdf') {
			toast.error('Invalid file format. Please upload a PDF document.');
			return;
		}

		// Validation: Size (Max 10MB)
		const MAX_SIZE = 10 * 1024 * 1024; // 10MB
		if (file.size > MAX_SIZE) {
			toast.error('File size exceeds the 10MB limit.');
			return;
		}

		setUploading(prev => ({ ...prev, [type]: true }));
		try {
			const backendType = type === 'degree_qualification' ? 'degree_certificate' : type;
			const result: any = await dispatch(uploadDocument({
				publicId: candidatePublicId,
				documentType: backendType as any,
				file: file
			})).unwrap();

			setFormData((prev: any) => ({
				...prev,
				documents_upload: {
					...prev.documents_upload,
					[type]: true,
					[`${type}_filename`]: file.name,
					[`${type}_id`]: result.document.id
				}
			}));

			toast.success('Document uploaded successfully');
		} catch (error: any) {
			console.error('Upload failed:', error);
			toast.error(error || 'Failed to upload document. Please try again.');
		} finally {
			setUploading(prev => ({ ...prev, [type]: false }));
		}
	};

	const handleViewFile = async (type: string) => {
		const docId = (formData.documents_upload as any)?.[`${type}_id`];
		if (!docId) return;

		setViewing(prev => ({ ...prev, [type]: true }));
		try {
			const blob = await dispatch(downloadDocument({ documentId: docId })).unwrap();
			const url = URL.createObjectURL(blob as any);
			window.open(url, '_blank');
		} catch (error: any) {
			toast.error(error || 'Failed to download file for preview');
		} finally {
			setViewing(prev => ({ ...prev, [type]: false }));
		}
	};

	const handleRemoveFile = (type: string) => {
		setFormData((prev: any) => ({
			...prev,
			documents_upload: {
				...prev.documents_upload,
				[type]: false,
				[`${type}_filename`]: '',
				[`${type}_id`]: null
			}
		}));
	};

	const handleSendConsent = async () => {
		if (!candidatePublicId) return;

		setSendingConsent(true);
		try {
			await dispatch(sendConsentEmail({ publicId: candidatePublicId })).unwrap();
			toast.success('Consent form email sent to candidate');
			// Update local state to reflect Pending status
			setFormData(prev => ({
				...prev,
				consent_status: 'Pending'
			}));
		} catch (error: any) {
			toast.error(error || 'Failed to send consent email');
		} finally {
			setSendingConsent(false);
		}
	};

	const handleRefresh = async () => {
		if (!onRefresh) return;
		setRefreshing(true);
		try {
			await onRefresh();
		} finally {
			setRefreshing(false);
		}
	};

	const handleMagicFill = async () => {
		const resumeId = formData.documents_upload?.resume_id;
		if (!resumeId) {
			toast.info('Please upload a resume first to use Magic Fill.');
			return;
		}

		setExtracting(true);
		try {
			const result = await dispatch(extractCandidateData({ documentId: resumeId })).unwrap();
			const aiData = result.data;

			setFormData(prev => ({
				...prev,
				skills: {
					technical_skills: Array.from(new Set([...(prev.skills?.technical_skills || []), ...(aiData.skills?.technical_skills || [])])),
					soft_skills: Array.from(new Set([...(prev.skills?.soft_skills || []), ...(aiData.skills?.soft_skills || [])])),
				},
				previous_training: {
					attended_any_training: aiData.training_history?.attended_any_training || prev.previous_training?.attended_any_training || false,
					training_details: aiData.training_history?.details || prev.previous_training?.training_details || '',
					is_winvinaya_student: prev.previous_training?.is_winvinaya_student || false
				}
			}));

			toast.success('Magic Fill completed! AI extracted skills and training history.');
		} catch (error: any) {
			toast.error(error || 'AI Extraction failed. Please try again or fill manually.');
		} finally {
			setExtracting(false);
		}
	};

	const handleSubmit = () => {
		onSubmit(formData);
		onClose();
	};

	const steps: FormStep[] = useMemo(() => [
		{
			label: 'Background & Training',
			content: (
				<BackgroundTrainingTab
					formData={formData}
					onUpdateField={handleUpdateField}
				/>
			)
		},
		{
			label: 'Family Details',
			content: (
				<FamilyDetailsTab
					formData={formData}
					onUpdateField={handleUpdateField}
				/>
			)
		},
		{
			label: 'Skills',
			content: (
				<SkillsTab
					formData={formData}
					onUpdateField={handleUpdateField}
				/>
			)
		},
		{
			label: 'Documents & Remarks',
			content: (
				<DocumentsRemarksTab
					formData={formData}
					onUpdateOtherField={handleUpdateOtherField}
					onUpdateStatus={(value) => setFormData(prev => ({ ...prev, status: value }))}
					onFileUpload={handleFileUpload}
					onViewFile={handleViewFile}
					onRemoveFile={handleRemoveFile}
					onSendConsent={handleSendConsent}
					uploading={uploading}
					viewing={viewing}
					sendingConsent={sendingConsent}
					onRefresh={handleRefresh}
					refreshing={refreshing}
					dynamicFields={dynamicFields}
					candidateIsDisabled={!!selectedCandidate?.disability_details?.is_disabled}
				/>
			)
		}
	], [formData, uploading, viewing, sendingConsent, refreshing, onRefresh, dynamicFields, selectedCandidate]);

	const screenerName = initialData?.screened_by?.full_name || currentUser?.full_name || currentUser?.username || '—';
	const screeningDate = formatDate(initialData?.updated_at || new Date());

	const subtitle = `${candidateName || 'New Candidate'} • Screener: ${screenerName} • Date: ${screeningDate}`;

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
					title="Candidate Screening"
					subtitle={subtitle}
					mode={initialData ? 'edit' : 'create'}
					steps={steps}
					onSave={handleSubmit}
					onCancel={onClose}
					saveButtonText={initialData ? 'Update Screening' : 'Save Screening'}
					headerActions={
						<Tooltip title="AI Magic Fill: Populate form from Resume" arrow>
							<span>
								<Button
									variant="text"
									size="small"
									startIcon={<MagicIcon sx={{ fontSize: '1rem !important' }} />}
									onClick={handleMagicFill}
									disabled={extracting || !formData.documents_upload?.resume_id}
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 800,
										fontSize: '0.65rem',
										py: 0,
										minHeight: 24,
										borderRadius: '4px',
										textTransform: 'uppercase',
										letterSpacing: '0.05em',
										bgcolor: alpha(theme.palette.primary.main, 0.05),
										'&:hover': {
											bgcolor: alpha(theme.palette.primary.main, 0.1),
										},
										'&.Mui-disabled': {
											color: alpha(theme.palette.text.disabled, 0.4),
											bgcolor: alpha(theme.palette.text.disabled, 0.05),
										}
									}}
								>
									{extracting ? 'Extracting...' : 'Magic Fill'}
								</Button>
							</span>
						</Tooltip>
					}
				/>
			)}
		</Dialog>
	);
};

export default ScreeningFormDialog;
