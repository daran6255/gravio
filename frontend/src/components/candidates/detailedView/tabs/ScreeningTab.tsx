import React from 'react';
import { 
	Grid, 
	Typography, 
	Chip, 
	Box, 
	Button, 
	Stack, 
	Divider, 
	useTheme, 
	alpha, 
	Avatar,
	Paper
} from '@mui/material';
import {
	CheckCircle as CheckCircleIcon,
	AssignmentInd as AssignmentIndIcon,
	HistoryEdu as TrainingIcon,
	VerifiedUser as VerifiedIcon,
	Event as EventIcon,
	Person as PersonIcon,
	FamilyRestroom as FamilyIcon,
	Paid as PaidIcon,
	LocationOn as LocationIcon,
	Comment as CommentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDateTime } from '../../../../hooks/useDateTime';
import { SectionHeader, SectionCard } from '../DetailedViewCommon';
import type { Candidate } from '../../../../models/candidate';

interface ScreeningTabProps {
	candidate: Candidate;
}

const BooleanStatus: React.FC<{ label: string; value: boolean | string | undefined }> = ({ label, value }) => {
	const theme = useTheme();
	const isTrue = value === true || value === 'true';
	
	return (
		<Box sx={{ 
			p: 1.5, 
			borderRadius: 2, 
			bgcolor: isTrue ? alpha(theme.palette.success.main, 0.04) : alpha(theme.palette.error.main, 0.04),
			border: '1px solid',
			borderColor: isTrue ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			mb: 1.5
		}}>
			<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
				{label}
			</Typography>
			<Chip 
				label={isTrue ? 'YES' : 'NO'} 
				size="small" 
				color={isTrue ? 'success' : 'error'} 
				sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} 
			/>
		</Box>
	);
};

const ScreeningTab: React.FC<ScreeningTabProps> = ({ candidate }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { formatDate } = useDateTime();
	const { screening } = candidate;

	if (!screening) {
		return (
			<SectionCard sx={{ textAlign: 'center', py: 8, bgcolor: alpha(theme.palette.background.default, 0.3) }}>
				<Box sx={{ maxWidth: 450, mx: 'auto' }}>
					<Avatar sx={{ 
						width: 100, 
						height: 100, 
						bgcolor: alpha(theme.palette.primary.main, 0.05), 
						color: 'primary.main',
						mx: 'auto',
						mb: 3
					}}>
						<AssignmentIndIcon sx={{ fontSize: 50 }} />
					</Avatar>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>Assessment Required</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
						This candidate has not undergone the initial screening process yet. 
						Complete the assessment to unlock further recruitment stages.
					</Typography>
					<Button
						variant="contained"
						size="large"
						startIcon={<CheckCircleIcon />}
						sx={{ 
							borderRadius: 2, 
							px: 4, 
							py: 1.5,
							fontWeight: 700,
							boxShadow: theme.shadows[4]
						}}
						onClick={() => navigate('/candidates/screening')}
					>
						Begin Screening
					</Button>
				</Box>
			</SectionCard>
		);
	}


	return (
		<Grid container spacing={4}>
			{/* Left Column: Assessment Metadata & Skills */}
			<Grid size={{ xs: 12, md: 7 }}>
				<SectionCard sx={{ mb: 4 }}>
					<SectionHeader title="Assessment Summary" icon={<AssignmentIndIcon />}>
						<Chip
							label={screening.status?.toUpperCase()}
							size="small"
							variant="filled"
							sx={{
								fontWeight: 800,
								borderRadius: 1.5,
								bgcolor:
									screening.status === 'Completed' ? 'success.main' :
									screening.status === 'Not Connected' || screening.status === 'Not Answered' ? 'error.main' :
									screening.status === 'In Progress' ? 'primary.main' :
									screening.status === 'Follow-up Required' ? 'warning.main' :
									'grey.500',
								color: 'white'
							}}
						/>
					</SectionHeader>

					<Grid container spacing={3} sx={{ mb: 4 }}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
								<Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
									<PersonIcon />
								</Avatar>
								<Box>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>SCREENED BY</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										{screening.screened_by?.full_name || screening.screened_by?.username || 'System Admin'}
									</Typography>
								</Box>
							</Box>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.03) }}>
								<Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
									<EventIcon />
								</Avatar>
								<Box>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>SCREENING DATE</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>{formatDate(screening.created_at)}</Typography>
								</Box>
							</Box>
						</Grid>
					</Grid>

					<Divider sx={{ mb: 4 }} />

					<Box sx={{ mb: 4 }}>
						<SectionHeader title="Competency Profile" icon={<TrainingIcon />} />
						<Grid container spacing={3}>
							<Grid size={{ xs: 12 }}>
								<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
									Technical Skills
								</Typography>
								<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
									{(screening.skills?.technical_skills?.length ?? 0) > 0 ? (
										screening.skills?.technical_skills?.map((skill: string, idx: number) => (
											<Chip 
												key={idx} 
												label={skill} 
												size="small" 
												variant="outlined" 
												color="primary"
												sx={{ borderRadius: 1.5, fontWeight: 600, borderStyle: 'dashed' }} 
											/>
										))
									) : (
										<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>No technical skills recorded</Typography>
									)}
								</Stack>

								<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
									Soft Skills
								</Typography>
								<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
									{(screening.skills?.soft_skills?.length ?? 0) > 0 ? (
										screening.skills?.soft_skills?.map((skill: string, idx: number) => (
											<Chip 
												key={idx} 
												label={skill} 
												size="small" 
												variant="outlined" 
												color="secondary"
												sx={{ borderRadius: 1.5, fontWeight: 600, borderStyle: 'dashed' }} 
											/>
										))
									) : (
										<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>No soft skills recorded</Typography>
									)}
								</Stack>
							</Grid>
						</Grid>
					</Box>

					<Box>
						<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 2, display: 'block' }}>
							Training Background
						</Typography>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<BooleanStatus label="WinVinaya Student" value={screening.previous_training?.is_winvinaya_student} />
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<BooleanStatus label="External Training" value={screening.previous_training?.attended_any_training} />
							</Grid>
							{screening.previous_training?.training_details && (
								<Grid size={{ xs: 12 }}>
									<Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
										<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TRAINING DETAILS</Typography>
										<Typography variant="body2">{screening.previous_training.training_details}</Typography>
									</Box>
								</Grid>
							)}
						</Grid>
					</Box>
				</SectionCard>

				{/* Internal Comments / Notes */}
				<SectionCard>
					<SectionHeader title="Internal Feedback" icon={<CommentIcon />} />
					<Paper 
						elevation={0} 
						sx={{ 
							p: 3, 
							bgcolor: alpha(theme.palette.warning.main, 0.04), 
							border: '1px solid', 
							borderColor: alpha(theme.palette.warning.main, 0.1),
							borderRadius: 3,
							position: 'relative'
						}}
					>
						<Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.primary', fontStyle: screening.others?.comments ? 'normal' : 'italic' }}>
							{screening.others?.comments || 'No internal comments provided for this candidate.'}
						</Typography>
					</Paper>
				</SectionCard>
			</Grid>

			{/* Right Column: Status & Family */}
			<Grid size={{ xs: 12, md: 5 }}>
				<Stack spacing={4}>
					{/* Documentation Readiness */}
					<SectionCard>
						<SectionHeader title="Documentation Status" icon={<VerifiedIcon />} />
						<Stack spacing={1}>
							<BooleanStatus label="Resume / CV" value={screening.documents_upload?.resume} />
							<BooleanStatus label="Disability Certificate" value={screening.documents_upload?.disability_certificate} />
							<BooleanStatus label="Academic Qualification" value={screening.documents_upload?.degree_qualification} />
						</Stack>
					</SectionCard>

					{/* Logistics & Financials */}
					<SectionCard sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
						<SectionHeader title="Logistics & Profile" icon={<PaidIcon />} />
						<Stack spacing={2.5}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>ANNUAL INCOME</Typography>
								<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
									{screening.others?.family_annual_income || 'Not Disclosed'}
								</Typography>
							</Box>
							<Divider />
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 32, height: 32 }}>
									<LocationIcon sx={{ fontSize: 18 }} />
								</Avatar>
								<Box sx={{ flex: 1 }}>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>READY TO RELOCATE</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>{screening.others?.ready_to_relocate ? 'Yes, flexible' : 'No, prefers local'}</Typography>
								</Box>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', width: 32, height: 32 }}>
									<TrainingIcon sx={{ fontSize: 18 }} />
								</Avatar>
								<Box sx={{ flex: 1 }}>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>WILLING FOR TRAINING</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>{screening.others?.willing_for_training ? 'Highly motivated' : 'Not interested'}</Typography>
								</Box>
							</Box>
							<Box sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>ACQUISITION SOURCE</Typography>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>{screening.others?.source_of_info || 'Unknown'}</Typography>
							</Box>
						</Stack>
					</SectionCard>

					{/* Family Details */}
					<SectionCard>
						<SectionHeader title="Family Background" icon={<FamilyIcon />} />
						<Stack spacing={2}>
							{(screening.family_details?.length ?? 0) > 0 ? (
								screening.family_details?.map((family: any, idx: number) => (
									<Box 
										key={idx} 
										sx={{ 
											p: 2, 
											borderRadius: 2, 
											border: '1px solid', 
											borderColor: 'divider',
											bgcolor: alpha(theme.palette.background.default, 0.4),
											transition: 'all 0.2s',
											'&:hover': {
												borderColor: 'secondary.main',
												transform: 'translateX(4px)'
											}
										}}
									>
										<Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
											<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
												{family.name}
											</Typography>
											<Chip 
												label={family.relation} 
												size="small" 
												color="secondary" 
												variant="outlined" 
												sx={{ fontWeight: 700, borderRadius: 1, height: 20, fontSize: '0.65rem' }} 
											/>
										</Stack>
										<Grid container spacing={2}>
											<Grid size={{ xs: 6 }}>
												<Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
													OCCUPATION
												</Typography>
												<Typography variant="body2" sx={{ fontWeight: 600 }}>{family.occupation || '-'}</Typography>
											</Grid>
											<Grid size={{ xs: 6 }}>
												<Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
													CONTACT
												</Typography>
												<Typography variant="body2" sx={{ fontWeight: 600 }}>{family.phone || '-'}</Typography>
											</Grid>
										</Grid>
									</Box>
								))
							) : (
								<Box sx={{ textAlign: 'center', py: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
									<Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
										Family records not available
									</Typography>
								</Box>
							)}
						</Stack>
					</SectionCard>
				</Stack>
			</Grid>
		</Grid>
	);
};

export default ScreeningTab;
