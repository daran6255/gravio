import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
	Container,
	Paper,
	Typography,
	Box,
	TextField,
	Button,
	Stack,
	CircularProgress,
	alpha,
	useTheme,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
} from '@mui/material';
import {
	QuestionAnswer as QIcon,
	Send as SendIcon,
	CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../../store/store';
import { 
	fetchPublicInterview, 
	submitPublicAnswers, 
	resetPublicState 
} from '../../store/slices/publicInterviewSlice';

const CandidateTechnicalEvaluation: React.FC = () => {
	const { token } = useParams<{ token: string }>();
	const theme = useTheme();
	const dispatch = useDispatch<AppDispatch>();

	const { 
		currentInterview: interview, 
		loading, 
		submitting, 
		error: reduxError
	} = useSelector((state: RootState) => state.publicInterview);

	const [answers, setAnswers] = useState<Array<{ question: string; answer: string }>>([]);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	// Fetch interview on mount
	useEffect(() => {
		if (token) {
			dispatch(fetchPublicInterview(token));
		}
		return () => {
			dispatch(resetPublicState());
		};
	}, [token, dispatch]);

	// Initialize answers when interview is fetched
	useEffect(() => {
		const fetchedQuestions = interview?.questions;
		if (fetchedQuestions && Array.isArray(fetchedQuestions)) {
			setAnswers(prev => {
				// If we already have answers, merge them
				if (prev.length > 0) {
					const next = [...fetchedQuestions];
					prev.forEach((oldQ) => {
						const matchingIdx = next.findIndex(n => n.question === oldQ.question);
						if (matchingIdx !== -1) {
							next[matchingIdx].answer = oldQ.answer;
						}
					});
					return next;
				}
				return fetchedQuestions;
			});
		}
	}, [interview?.questions]);

	// Sync local errors with redux errors
	useEffect(() => {
		if (reduxError) {
			setError(reduxError);
		}
	}, [reduxError]);

	// Poll for updates (questions from trainer) - More frequent (3s)
	useEffect(() => {
		if (!token || submitted || loading) return;

		const interval = setInterval(() => {
			dispatch(fetchPublicInterview(token));
		}, 3000); 

		return () => clearInterval(interval);
	}, [token, submitted, loading, dispatch]);

	// Auto-save logic
	useEffect(() => {
		if (!token || submitted || loading || answers.length === 0) return;

		const timer = setTimeout(async () => {
			try {
				await dispatch(submitPublicAnswers({ token, answers })).unwrap();
				setLastSaved(new Date());
			} catch (err) {
				console.error('Auto-save failed', err);
			}
		}, 1500); // 1.5 second debounce

		return () => clearTimeout(timer);
	}, [answers, token, submitted, loading, dispatch]);

	const handleAnswerChange = (index: number, value: string) => {
		setAnswers(prev => {
			const next = [...prev];
			next[index] = { ...next[index], answer: value };
			return next;
		});
	};

	const handleSubmit = () => {
		setConfirmOpen(true);
	};

	const confirmSubmit = async () => {
		if (!token) return;
		setConfirmOpen(false);
		try {
			await dispatch(submitPublicAnswers({ token, answers })).unwrap();
			setSubmitted(true);
		} catch (err: any) {
			setError(err || 'Failed to submit answers.');
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Container maxWidth="sm" sx={{ mt: 10 }}>
				<Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
					{error}
				</Alert>
			</Container>
		);
	}

	if (submitted) {
		return (
			<Container maxWidth="sm" sx={{ mt: 10 }}>
				<Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.02), border: '1px solid', borderColor: 'success.light' }}>
					<SuccessIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
					<Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>Submission Successful!</Typography>
					<Typography variant="body1" color="text.secondary">
						Your technical evaluation answers have been successfully submitted to your trainer. 
						This link is now closed.
					</Typography>
				</Paper>
			</Container>
		);
	}

	return (
		<Container maxWidth="md" sx={{ py: 6 }}>
			<Box sx={{ mb: 6, textAlign: 'center' }}>
				<Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.02em', mb: 1 }}>
					Technical Evaluation
				</Typography>
				<Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
					Assessment for {interview?.candidate?.name}
				</Typography>
				<Box sx={{ height: 24 }}>
					{submitting ? (
						<Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontWeight: 700 }}>
							<CircularProgress size={12} color="inherit" /> Saving draft...
						</Typography>
					) : lastSaved ? (
						<Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
							Draft saved at {lastSaved.toLocaleTimeString()}
						</Typography>
					) : null}
				</Box>
			</Box>

			<Stack spacing={4}>
				{answers.map((q, idx) => (
					<Paper 
						key={idx} 
						elevation={0}
						sx={{ 
							p: 4, 
							borderRadius: 3, 
							border: '1px solid', 
							borderColor: 'divider',
							bgcolor: 'background.paper'
						}}
					>
						<Stack direction="row" spacing={2} sx={{ mb: 3 }}>
							<Box sx={{ p: 1, bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: 1.5, color: 'primary.main', height: 'fit-content' }}>
								<QIcon />
							</Box>
							<Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
								{q.question}
							</Typography>
						</Stack>
						<TextField
							fullWidth
							multiline
							rows={6}
							placeholder="Type your answer here..."
							value={q.answer}
							onChange={(e) => handleAnswerChange(idx, e.target.value)}
							variant="outlined"
							sx={{ 
								'& .MuiOutlinedInput-root': { 
									borderRadius: 2,
									bgcolor: alpha(theme.palette.action.hover, 0.02)
								} 
							}}
						/>
					</Paper>
				))}

				{answers.length === 0 && (
					<Alert severity="info">No questions have been assigned for this evaluation yet.</Alert>
				)}

				<Box sx={{ pt: 2, display: 'flex', justifyContent: 'center' }}>
					<Button
						variant="contained"
						size="large"
						startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
						onClick={handleSubmit}
						disabled={submitting || answers.length === 0}
						sx={{ 
							px: 6, 
							py: 1.5, 
							borderRadius: 3, 
							fontWeight: 800, 
							textTransform: 'none',
							fontSize: '1.1rem',
							boxShadow: theme.shadows[4]
						}}
					>
						{submitting ? 'Submitting...' : 'Submit Evaluation'}
					</Button>
				</Box>
			</Stack>

			<Dialog
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
			>
				<DialogTitle sx={{ fontWeight: 800 }}>Final Submission</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to submit your evaluation? You will not be able to change your answers after this.
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ p: 2, gap: 1 }}>
					<Button 
						onClick={() => setConfirmOpen(false)} 
						sx={{ fontWeight: 700, textTransform: 'none' }}
					>
						Keep Editing
					</Button>
					<Button 
						onClick={confirmSubmit} 
						variant="contained" 
						color="primary"
						sx={{ fontWeight: 800, textTransform: 'none', px: 3, borderRadius: 2 }}
					>
						Submit Now
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
};

export default CandidateTechnicalEvaluation;
