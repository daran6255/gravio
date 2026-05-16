import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
	Dialog,
	Box,
	Typography,
	alpha,
	useTheme,
	IconButton,
	Tooltip,
	Button,
} from '@mui/material';
import {
	PlayArrow as StartIcon,
	Pause as PauseIcon,
	Article as ResumeIcon,
	AssignmentInd as TrainerResumeIcon
} from '@mui/icons-material';
import SessionMonitoring from '../../../common/monitoring/SessionMonitoring';
import { documentService } from '../../../../services/candidateService';
import { type AppDispatch, type RootState } from '../../../../store/store';
import { useMockInterviewForm } from '../hooks/useMockInterviewForm';
import { fetchAggregatedSkills } from '../../../../store/slices/skillSlice';
import BasicDetailsTab from './tabs/BasicDetailsTab';
import TechnicalEvaluationTab from './tabs/TechnicalEvaluationTab';
import CompetencyMatrixTab from './tabs/CompetencyMatrixTab';
import FinalRemarksTab from './tabs/FinalRemarksTab';
import EnterpriseForm, { type FormStep } from '../../../common/form/EnterpriseForm';

interface MockInterviewFormProps {
	open: boolean;
	onClose: () => void;
	batchId: number;
	viewMode?: boolean;
}

const MockInterviewForm: React.FC<MockInterviewFormProps> = ({ open, onClose, batchId, viewMode = false }) => {
	const theme = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const { currentMockInterview } = useSelector((state: RootState) => state.mockInterviews);
	const { allocations } = useSelector((state: RootState) => state.training);
	const { aggregatedSkills: masterSkills } = useSelector((state: RootState) => state.skills);

	useEffect(() => {
		dispatch(fetchAggregatedSkills());
	}, [dispatch]);

	// Filter allocations to only show "In Training" or "Moved to Placement"
	const filteredAllocations = useMemo(() => {
		return allocations.filter(a => 
			a.status === 'in_training' || a.status === 'moved_to_placement'
		);
	}, [allocations]);

	const {
		formData,
		questions,
		skills,
		errors,
		saveLoading,
		elapsedSeconds,
		isPaused,
		showStartReminder,
		showInactivityAlert,
		showTimeRunningAlert,
		setShowInactivityAlert,
		toggleTimer,
		handleChange,
		handleQuestionChange,
		addQuestion,
		removeQuestion,
		handleSkillChange,
		addSkill,
		removeSkill,
		handleSubmit,
		handleGenerateLink,
		refreshQuestions,
		updateInteraction
	} = useMockInterviewForm(batchId, onClose, viewMode);

	const selectedAllocation = useMemo(() => {
		if (!formData.candidate_id || !allocations) return null;
		const targetId = Number(formData.candidate_id);
		return allocations.find(a => Number(a.candidate_id) === targetId);
	}, [allocations, formData.candidate_id]);

	const resumes = useMemo(() => {
		// Combine documents from both sources and deduplicate by ID
		const currentDocs = currentMockInterview?.candidate?.documents || [];
		const allocDocs = selectedAllocation?.candidate?.documents || [];
		
		const docsMap = new Map();
		// Order matters: later items overwrite earlier ones. 
		// We prioritize currentDocs as they are likely more specific to the session.
		[...allocDocs, ...currentDocs].forEach(d => {
			if (d && d.id) docsMap.set(d.id, d);
		});
		const allDocs = Array.from(docsMap.values());
		
		return {
			candidate: allDocs.find(d => {
				const type = (d.document_type || '').toLowerCase();
				const source = (d.document_source || '').toLowerCase();
				return d.is_active && 
					(type === 'resume') && 
					(source === 'candidate' || source === '');
			}),
			trainer: allDocs.find(d => {
				const type = (d.document_type || '').toLowerCase();
				const source = (d.document_source || '').toLowerCase();
				return d.is_active && 
					(type === 'trainer_resume' || (type === 'resume' && source === 'trainer'));
			})
		};
	}, [currentMockInterview, selectedAllocation]);

	const handleViewDocument = async (docId: number) => {
		try {
			const blob = await documentService.download(docId);
			const url = window.URL.createObjectURL(blob);
			window.open(url, '_blank');
			setTimeout(() => window.URL.revokeObjectURL(url), 1000);
		} catch (error) {
			console.error('Failed to view document:', error);
		}
	};

	const steps: FormStep[] = useMemo(() => [
		{
			label: 'Basic Details',
			description: 'Metadata & context',
			content: (
				<BasicDetailsTab
					formData={formData}
					errors={errors}
					viewMode={viewMode}
					isEdit={!!currentMockInterview}
					allocations={filteredAllocations}
					onChange={handleChange}
				/>
			)
		},
		{
			label: 'Technical Evaluation',
			description: 'Q&A discussion',
			content: (
				<TechnicalEvaluationTab
					questions={questions}
					viewMode={viewMode}
					candidateToken={formData.candidate_token}
					onQuestionChange={handleQuestionChange}
					onAddQuestion={addQuestion}
					onRemoveQuestion={removeQuestion}
					onGenerateLink={handleGenerateLink}
					onRefresh={refreshQuestions}
					isSaving={saveLoading}
					candidateSubmittedAt={formData.candidate_submitted_at}
					status={formData.status}
				/>
			)
		},
		{
			label: 'Competency Matrix',
			description: 'Skill proficiency',
			content: (
				<CompetencyMatrixTab
					skills={skills}
					masterSkills={masterSkills}
					viewMode={viewMode}
					onSkillChange={handleSkillChange}
					onAddSkill={addSkill}
					onRemoveSkill={removeSkill}
				/>
			)
		},
		{
			label: 'Final Remarks',
			description: 'Summative feedback',
			content: (
				<FinalRemarksTab
					formData={formData}
					viewMode={viewMode}
					onChange={handleChange}
				/>
			)
		}
	], [formData, questions, skills, errors, viewMode, currentMockInterview, filteredAllocations, handleChange, handleQuestionChange, addQuestion, removeQuestion, handleSkillChange, addSkill, removeSkill]);

	const formatElapsed = (seconds: number) => {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	};

	return (
		<>
			<Dialog
				open={open}
				onClose={(_, reason) => {
					if (reason === 'backdropClick') return;
					onClose();
				}}
				maxWidth="lg"
				fullWidth
				disableEscapeKeyDown
				PaperProps={{
					sx: {
						borderRadius: 0,
						boxShadow: 'none',
						bgcolor: 'transparent'
					}
				}}
			>
				<EnterpriseForm
					title={`${viewMode ? 'Review' : currentMockInterview ? 'Edit' : 'Record'} Mock Interview`}
					subtitle="Enterprise-grade technical proficiency assessment console"
					mode={viewMode ? 'view' : currentMockInterview ? 'edit' : 'create'}
					steps={steps}
					onSave={handleSubmit}
					onCancel={onClose}
					isSubmitting={saveLoading}
					saveButtonText={viewMode ? 'Close' : currentMockInterview ? 'Update Session' : 'Finalize Session'}
					headerActions={
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
							{/* Resume Actions */}
							{resumes.candidate && (
								<Button 
									size="small" 
									variant="outlined"
									startIcon={<ResumeIcon fontSize="small" />}
									onClick={() => handleViewDocument(resumes.candidate!.id)}
									sx={{ 
										borderRadius: 1.5,
										textTransform: 'none',
										fontWeight: 600,
										px: 1.5,
										color: 'primary.main',
										borderColor: alpha(theme.palette.primary.main, 0.3),
										bgcolor: alpha(theme.palette.primary.main, 0.04),
										'&:hover': { 
											bgcolor: alpha(theme.palette.primary.main, 0.08),
											borderColor: theme.palette.primary.main
										}
									}}
								>
									Candidate Resume
								</Button>
							)}
							{resumes.trainer && (
								<Button 
									size="small" 
									variant="outlined"
									startIcon={<TrainerResumeIcon fontSize="small" />}
									onClick={() => handleViewDocument(resumes.trainer!.id)}
									sx={{ 
										borderRadius: 1.5,
										textTransform: 'none',
										fontWeight: 600,
										px: 1.5,
										color: '#ec7211',
										borderColor: alpha('#ec7211', 0.3),
										bgcolor: alpha('#ec7211', 0.04),
										'&:hover': { 
											bgcolor: alpha('#ec7211', 0.08),
											borderColor: '#ec7211'
										}
									}}
								>
									Trainer Prepared Resume
								</Button>
							)}

							{/* Timer Actions */}
							{!viewMode && !currentMockInterview && (
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 1,
										px: 1.5,
										py: 0.5,
										borderRadius: 2,
										bgcolor: alpha(isPaused ? theme.palette.warning.main : theme.palette.error.main, 0.08),
										border: '1px solid',
										borderColor: alpha(isPaused ? theme.palette.warning.main : theme.palette.error.main, 0.2),
									}}
								>
								<Box
									sx={{
										width: 8,
										height: 8,
										borderRadius: '50%',
										bgcolor: isPaused ? 'warning.main' : 'error.main',
										animation: isPaused ? 'none' : 'pulse 2s infinite'
									}}
								/>
								<Typography
									variant="subtitle2"
									sx={{
										fontWeight: 800,
										fontFamily: 'monospace',
										color: isPaused ? 'warning.main' : 'error.main',
										fontSize: '0.9rem',
										minWidth: '65px',
										textAlign: 'center'
									}}
								>
									{formatElapsed(elapsedSeconds)}
								</Typography>
								<Tooltip title={elapsedSeconds === 0 && isPaused ? "Start Interview" : isPaused ? "Resume Interview" : "Pause Interview"}>
									<IconButton
										size="small"
										onClick={toggleTimer}
										sx={{
											color: isPaused ? 'warning.main' : 'error.main',
											p: 0.5,
											'&:hover': {
												bgcolor: alpha(isPaused ? theme.palette.warning.main : theme.palette.error.main, 0.1)
											}
										}}
									>
										{isPaused ? <StartIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
									</IconButton>
								</Tooltip>
								<style>
									{`
									@keyframes pulse {
										0% { opacity: 1; transform: scale(1); }
										50% { opacity: 0.5; transform: scale(1.2); }
										100% { opacity: 1; transform: scale(1); }
									}
								`}
								</style>
							</Box>
						)}
						</Box>
					}
				/>

				{/* Session Monitoring Prompts - Integrated inside Dialog for visibility */}
				<SessionMonitoring
					showStartReminder={showStartReminder}
					showInactivityAlert={showInactivityAlert}
					showTimeRunningAlert={showTimeRunningAlert}
					onStart={toggleTimer}
					onResume={() => { updateInteraction(); toggleTimer(); }}
					onCloseInactivity={() => setShowInactivityAlert(false)}
				/>
			</Dialog>
		</>
	);
};

export default MockInterviewForm;
