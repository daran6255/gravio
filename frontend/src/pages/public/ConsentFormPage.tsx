import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
	Box,
	Container,
	Paper,
	Typography,
	Button,
	Checkbox,
	FormControlLabel,
	TextField,
	Divider,
	Stack,
	CircularProgress,
	Fade
} from '@mui/material';
import {
	CheckCircle as CheckCircleIcon,
	Description as DescriptionIcon
} from '@mui/icons-material';
import { screeningService } from '../../services/candidateService';
import useToast from '../../hooks/useToast';
import { awsStyles } from '../../theme/theme';

const CONSENT_FORM_TEXT = `
Permission to Use Photograph, Videos, Case stories and Offer Letter

I hereby grant to WinVinaya Foundation, its representatives and employees the right to take photographs, Case stories and Videos of me and my property. I authorize WinVinaya Foundation, its assigns and transferees to copyright, use and publish the same in print and/or electronically.

I agree that WinVinaya Foundation may use such photographs, case stories and videos of me with or without my name and for any lawful purpose, including for example such purposes as publicity, illustration, advertising, and Web content.

I agree that I will share my offer letter with WinVinaya Foundation once I get placed in any organization through WinVinaya / through others / through myself for the record purpose and/or for post placement support provided by WinVinaya Foundation.

I have read, understand and provide my consent for the above.
`;

const ConsentFormPage: React.FC = () => {
	const { publicId } = useParams<{ publicId: string }>();
	const toast = useToast();
	const { awsPanel } = awsStyles;

	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [formData, setFormData] = useState<{ candidate_name: string } | null>(null);
	const [agreed, setAgreed] = useState(false);
	const [printedName, setPrintedName] = useState('');

	useEffect(() => {
		const fetchData = async () => {
			if (!publicId) return;
			try {
				const data = await screeningService.getConsentData(publicId);
				setFormData(data);
			} catch (error) {
				toast.error('Invalid or expired consent link');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [publicId, toast]);

	const handleSubmit = async () => {
		if (!publicId || !agreed || !printedName.trim()) return;

		setSubmitting(true);
		try {
			await screeningService.submitConsent(publicId);
			setSubmitted(true);
			toast.success('Consent submitted successfully');
		} catch (error) {
			toast.error('Failed to submit consent. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f4f7f9' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!formData && !loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f4f7f9' }}>
				<Typography variant="h6" color="text.secondary">Invalid Consent Link</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: '#f4f7f9', py: 6, px: 2 }}>
			<Container maxWidth="md">
				{/* Header */}
				<Box sx={{ mb: 4, textAlign: 'center' }}>
					<Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
						WinVinaya Foundation
					</Typography>
					<Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
						Candidate Consent Portal
					</Typography>
				</Box>

				<Fade in={true} timeout={800}>
					<Paper
						elevation={0}
						sx={{
							...awsPanel,
							p: { xs: 3, md: 6 },
							borderRadius: '8px',
							border: '1px solid',
							borderColor: 'divider',
							boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
						}}
					>
						{!submitted ? (
							<>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
									<Box sx={{ bgcolor: 'primary.main', p: 1.5, borderRadius: '8px', display: 'flex', color: 'white' }}>
										<DescriptionIcon />
									</Box>
									<Box>
										<Typography variant="h5" sx={{ fontWeight: 700 }}>
											Consent Form
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.secondary' }}>
											Please review the terms below and provide your digital signature.
										</Typography>
									</Box>
								</Stack>

								<Box
									sx={{
										bgcolor: 'rgba(0,0,0,0.02)',
										p: 4,
										borderRadius: '4px',
										border: '1px solid',
										borderColor: 'divider',
										mb: 4,
										maxHeight: '400px',
										overflowY: 'auto',
										whiteSpace: 'pre-wrap',
										lineHeight: 1.7,
										color: 'text.primary',
										fontSize: '1rem'
									}}
								>
									{CONSENT_FORM_TEXT}
								</Box>

								<Divider sx={{ mb: 4 }} />

								<Box sx={{ mb: 4 }}>
									<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
										Digital Signature
									</Typography>
									<Stack spacing={3}>
										<FormControlLabel
											control={
												<Checkbox
													checked={agreed}
													onChange={(e) => setAgreed(e.target.checked)}
													color="primary"
												/>
											}
											label={
												<Typography variant="body2" sx={{ fontWeight: 500 }}>
													I have read, understood and provide my consent for the above.
												</Typography>
											}
										/>
										<TextField
											fullWidth
											label="Full Name (Digital Signature)"
											placeholder="Type your full name as it appears on your ID"
											variant="outlined"
											value={printedName}
											onChange={(e) => setPrintedName(e.target.value)}
											disabled={!agreed}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '4px',
													bgcolor: agreed ? 'background.paper' : 'rgba(0,0,0,0.02)'
												}
											}}
										/>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
											By typing your name above and clicking submit, you are providing a legally binding digital signature.
										</Typography>
									</Stack>
								</Box>

								<Button
									fullWidth
									variant="contained"
									size="large"
									disabled={!agreed || !printedName.trim() || submitting}
									onClick={handleSubmit}
									sx={{
										py: 2,
										fontSize: '1.1rem',
										fontWeight: 800,
										textTransform: 'none',
										borderRadius: '4px',
										boxShadow: 'none',
										'&:hover': { boxShadow: 'none' }
									}}
								>
									{submitting ? <CircularProgress size={24} color="inherit" /> : 'Accept & Submit Consent'}
								</Button>
							</>
						) : (
							<Box sx={{ textAlign: 'center', py: 4 }}>
								<CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
								<Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
									Consent Received
								</Typography>
								<Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: '500px', mx: 'auto' }}>
									Thank you, <strong>{formData?.candidate_name}</strong>. Your consent has been securely recorded in our system. You may now close this window.
								</Typography>
								<Button
									variant="outlined"
									onClick={() => window.close()}
									sx={{ textTransform: 'none', fontWeight: 700 }}
								>
									Close Window
								</Button>
							</Box>
						)}
					</Paper>
				</Fade>

				{/* Footer */}
				<Box sx={{ mt: 4, textAlign: 'center' }}>
					<Typography variant="caption" sx={{ color: 'text.secondary' }}>
						&copy; {new Date().getFullYear()} WinVinaya Foundation. All rights reserved.
					</Typography>
				</Box>
			</Container>
		</Box>
	);
};

export default ConsentFormPage;
