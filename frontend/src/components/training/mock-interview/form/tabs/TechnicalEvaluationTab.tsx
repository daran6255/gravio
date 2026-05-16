import React, { memo, useEffect } from 'react';
import {
	Box,
	Stack,
	Paper,
	Typography,
	Button,
	IconButton,
	TextField,
	useTheme,
	alpha,
	CircularProgress
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	QuestionAnswer as QIcon,
	Share as ShareIcon,
	ContentCopy as CopyIcon,
	Sync as SyncIcon
} from '@mui/icons-material';
import { type Question } from '../../../../../models/MockInterview';
import useToast from '../../../../../hooks/useToast';

interface TechnicalEvaluationTabProps {
	questions: Question[];
	viewMode: boolean;
	candidateToken?: string;
	onQuestionChange: (index: number, field: keyof Question, value: string) => void;
	onAddQuestion: () => void;
	onRemoveQuestion: (index: number) => void;
	onGenerateLink: () => void;
	onRefresh: (showToast?: boolean) => void;
	isSaving?: boolean;
	candidateSubmittedAt?: string | null;
	status?: string;
}

const TechnicalEvaluationTab: React.FC<TechnicalEvaluationTabProps> = memo(({
	questions,
	viewMode,
	candidateToken,
	onQuestionChange,
	onAddQuestion,
	onRemoveQuestion,
	onGenerateLink,
	onRefresh,
	isSaving,
	candidateSubmittedAt,
	status
}) => {
	const theme = useTheme();
	const toast = useToast();
	const isFinalized = status && !['inprogress', 'pending'].includes(status);

	// Auto-scroll to bottom when questions are added
	useEffect(() => {
		if (!viewMode) {
			const anchor = document.getElementById('bottom-scroll-anchor');
			if (anchor) {
				anchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
			}
		}
	}, [questions.length, viewMode]);

	const handleCopyLink = () => {
		const url = `${window.location.origin}/candidate/interview/${candidateToken}`;
		navigator.clipboard.writeText(url);
		toast.success('Interview link copied to clipboard');
	};

	return (
		<Box sx={{ 
			maxWidth: 1000, 
			mx: 'auto',
			'@keyframes pulse': {
				'0%': { opacity: 1, transform: 'scale(1)' },
				'50%': { opacity: 0.4, transform: 'scale(0.8)' },
				'100%': { opacity: 1, transform: 'scale(1)' },
			}
		}}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Stack direction="row" alignItems="center" spacing={2}>
					<Box
						sx={{
							p: 1.25,
							bgcolor: alpha(theme.palette.primary.main, 0.08),
							borderRadius: 2,
							display: 'flex',
							color: 'primary.main'
						}}
					>
						<QIcon />
					</Box>
					<Box>
						<Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
							Technical Discussion Points
						</Typography>
						{candidateToken && (
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
								{isFinalized ? (
									<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', display: 'flex', alignItems: 'center', gap: 0.5 }}>
										<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled' }} />
										Assessment finalized - Link deactivated
									</Typography>
								) : candidateSubmittedAt ? (
									<Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
										<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
										Candidate submitted evaluation
									</Typography>
								) : (
									<Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
										<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 2s infinite' }} />
										Shareable link active
									</Typography>
								)}
								{!isFinalized && (
									<Button
										size="small"
										variant="text"
										startIcon={<CopyIcon sx={{ fontSize: '14px !important' }} />}
										onClick={handleCopyLink}
										sx={{ py: 0, height: 20, fontSize: '0.7rem', fontWeight: 700 }}
									>
										Copy Link
									</Button>
								)}
							</Stack>
						)}
					</Box>
				</Stack>
				<Stack direction="row" spacing={1.5} alignItems="center">
					{isSaving && (
						<Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
							<CircularProgress size={12} color="inherit" /> Saving...
						</Typography>
					)}
					{candidateToken && (
						<Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
							{onRefresh && (
								<Button
									variant="outlined"
									color="primary"
									startIcon={<SyncIcon />}
									onClick={() => onRefresh(true)}
									sx={{
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: 1.5,
										px: 2
									}}
								>
									Sync Answers
								</Button>
							)}
						</Box>
					)}
					{!viewMode && !candidateToken && (
						<Button
							variant="outlined"
							color="success"
							startIcon={<ShareIcon />}
							onClick={onGenerateLink}
							sx={{
								textTransform: 'none',
								fontWeight: 700,
								borderRadius: 1.5,
								px: 2
							}}
						>
							Share with Candidate
						</Button>
					)}
					{!viewMode && (
						<Button
							variant="outlined"
							startIcon={<AddIcon />}
							onClick={onAddQuestion}
							sx={{
								textTransform: 'none',
								fontWeight: 700,
								borderRadius: 1.5,
								px: 2
							}}
						>
							Add Question
						</Button>
					)}
				</Stack>
			</Box>
			<Stack spacing={3}>
				{questions.map((q, idx) => (
					<Paper
						key={idx}
						elevation={0}
						sx={{
							p: 3,
							borderRadius: 2,
							position: 'relative',
							bgcolor: 'background.paper',
							border: '1px solid',
							borderColor: 'divider',
							transition: 'all 0.2s ease-in-out',
							'&:hover': {
								borderColor: alpha(theme.palette.primary.main, 0.2),
								boxShadow: theme.shadows[2]
							}
						}}
					>
						{!viewMode && (
							<IconButton
								size="small"
								onClick={() => onRemoveQuestion(idx)}
								sx={{
									position: 'absolute',
									right: 12,
									top: 12,
									opacity: 0.4,
									'&:hover': { opacity: 1, color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }
								}}
							>
								<DeleteIcon fontSize="small" />
							</IconButton>
						)}
						<TextField
							label={`Discussion Topic / Question ${idx + 1}`}
							value={q.question}
							onChange={(e) => onQuestionChange(idx, 'question', e.target.value)}
							fullWidth
							size="small"
							sx={{
								mb: 2.5,
								mt: 1,
								'& .MuiOutlinedInput-root': { borderRadius: 1.5 }
							}}
							disabled={viewMode}
							InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
						/>
						<TextField
							label="Observations & Evaluation"
							value={q.answer}
							onChange={(e) => onQuestionChange(idx, 'answer', e.target.value)}
							fullWidth
							multiline
							rows={3}
							size="small"
							disabled={viewMode}
							InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
						/>
					</Paper>
				))}
				{questions.length === 0 && (
					<Box
						sx={{
							py: 6,
							textAlign: 'center',
							borderRadius: 2,
							border: '2px dashed',
							borderColor: 'divider',
							bgcolor: alpha(theme.palette.action.disabledBackground, 0.02)
						}}
					>
						<Typography variant="body2" color="text.disabled" sx={{ fontWeight: 600 }}>
							No technical discussion points have been recorded for this session.
						</Typography>
					</Box>
				)}

				{!viewMode && (
					<Button
						fullWidth
						variant="outlined"
						startIcon={<AddIcon />}
						onClick={onAddQuestion}
						sx={{
							py: 2,
							borderStyle: 'dashed',
							borderWidth: 2,
							borderRadius: 3,
							textTransform: 'none',
							fontWeight: 800,
							fontSize: '0.95rem',
							color: 'text.secondary',
							borderColor: 'divider',
							'&:hover': {
								borderColor: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, 0.04),
								borderStyle: 'dashed',
							}
						}}
					>
						Add Question / Discussion Topic
					</Button>
				)}
			</Stack>
			<div id="bottom-scroll-anchor" />
		</Box>
	);
});

TechnicalEvaluationTab.displayName = 'TechnicalEvaluationTab';

export default TechnicalEvaluationTab;
