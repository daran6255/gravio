import React from 'react';
import { 
	Grid, 
	Typography, 
	Chip, 
	Box, 
	Stack, 
	Divider, 
	useTheme, 
	alpha, 
	Avatar,
	Button
} from '@mui/material';
import {
	Psychology as PsychologyIcon,
	Feedback as FeedbackIcon,
	HistoryEdu as SkillsIcon,
	Event as EventIcon,
	RecordVoiceOver as CounselorIcon,
	AssignmentTurnedIn as StatusIcon,
	QuestionAnswer as QuestionIcon,
	Work as WorkIcon,
	TrendingUp as LevelIcon,
	FormatQuote as QuoteIcon,
	CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDateTime } from '../../../../hooks/useDateTime';
import { InfoRow, SectionHeader, SectionCard } from '../DetailedViewCommon';
import type { Candidate } from '../../../../models/candidate';

interface CounselingTabProps {
	candidate: Candidate;
}

const CounselingTab: React.FC<CounselingTabProps> = ({ candidate }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { formatDate } = useDateTime();
	const { counseling } = candidate;

	if (!counseling) {
		return (
			<SectionCard sx={{ textAlign: 'center', py: 10, bgcolor: alpha(theme.palette.background.default, 0.4), borderRadius: 4 }}>
				<Box sx={{ maxWidth: 450, mx: 'auto' }}>
					<Avatar sx={{ 
						width: 100, 
						height: 100, 
						bgcolor: alpha(theme.palette.primary.main, 0.05), 
						color: 'primary.main',
						mx: 'auto',
						mb: 3
					}}>
						<PsychologyIcon sx={{ fontSize: 50 }} />
					</Avatar>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>Counseling Pending</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
						The career counseling session has not been documented for this candidate yet.
						Complete the counseling to provide professional career guidance.
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
						onClick={() => navigate('/candidates/counseling')}
					>
						Begin Counseling
					</Button>
				</Box>
			</SectionCard>
		);
	}

	const getStatusColor = (status: string) => {
		const s = status?.toLowerCase();
		if (s === 'selected' || s === 'shortlisted') return 'success';
		if (s === 'rejected' || s === 'not suitable') return 'error';
		return 'warning';
	};

	return (
		<Grid container spacing={4}>
			{/* Main Content Area */}
			<Grid size={{ xs: 12, md: 8 }}>
				<Stack spacing={4}>
					{/* Feedback Section */}
					<Box sx={{ 
						p: 4, 
						borderRadius: 4, 
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
						position: 'relative',
						overflow: 'hidden'
					}}>
						<QuoteIcon sx={{ 
							position: 'absolute', 
							top: 20, 
							right: 20, 
							fontSize: 80, 
							color: alpha(theme.palette.primary.main, 0.05) 
						}} />
						<SectionHeader title="Counselor Insights" icon={<FeedbackIcon />} />
						<Typography 
							variant="body1" 
							sx={{ 
								lineHeight: 1.8, 
								color: 'text.primary', 
								fontWeight: 500,
								fontStyle: counseling.feedback ? 'normal' : 'italic',
								position: 'relative',
								zIndex: 1,
								pl: 2,
								borderLeft: '4px solid',
								borderColor: 'primary.main'
							}}
						>
							{counseling.feedback || "No detailed feedback has been documented for this session."}
						</Typography>
					</Box>

					{/* Skills & Competencies */}
					<Box sx={{ 
						p: 3, 
						borderRadius: 3, 
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
					}}>
						<SectionHeader title="Identified Competencies" icon={<LevelIcon />} />
						<Grid container spacing={2}>
							{counseling.skills && counseling.skills.length > 0 ? (
								counseling.skills.map((skill, idx) => (
									<Grid size={{ xs: 12, sm: 6 }} key={idx}>
										<Box sx={{ 
											p: 2, 
											borderRadius: 2, 
											bgcolor: alpha(theme.palette.secondary.main, 0.02),
											border: '1px solid',
											borderColor: 'divider',
											display: 'flex',
											alignItems: 'center',
											gap: 2
										}}>
											<Avatar sx={{ bgcolor: 'secondary.main', color: 'white', width: 32, height: 32 }}>
												<SkillsIcon sx={{ fontSize: 18 }} />
											</Avatar>
											<Box sx={{ flex: 1 }}>
												<Typography variant="body2" sx={{ fontWeight: 700 }}>{skill.name}</Typography>
												<Chip 
													label={skill.level} 
													size="small" 
													sx={{ 
														height: 20, 
														fontSize: '0.65rem', 
														fontWeight: 800,
														mt: 0.5,
														bgcolor: alpha(theme.palette.secondary.main, 0.1),
														color: 'secondary.dark'
													}} 
												/>
											</Box>
										</Box>
									</Grid>
								))
							) : (
								<Grid size={{ xs: 12 }}>
									<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
										No specific skills identified during counseling.
									</Typography>
								</Grid>
							)}
						</Grid>
					</Box>

					{/* Assessment Q&A */}
					<Box sx={{ 
						p: 3, 
						borderRadius: 3, 
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
					}}>
						<SectionHeader title="Assessment Q&A" icon={<QuestionIcon />} />
						<Stack spacing={3}>
							{counseling.questions && counseling.questions.length > 0 ? (
								counseling.questions.map((q, idx) => (
									<Box key={idx}>
										<Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
											<Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800 }}>Q{idx + 1}.</Typography>
											<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
												{q.question}
											</Typography>
										</Box>
										<Box sx={{ ml: 4, p: 2, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>{q.answer || "-"}</Typography>
										</Box>
									</Box>
								))
							) : (
								<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
									No assessment questions recorded.
								</Typography>
							)}
						</Stack>
					</Box>
				</Stack>
			</Grid>

			{/* Sidebar Content */}
			<Grid size={{ xs: 12, md: 4 }}>
				<Stack spacing={4}>
					{/* Session Status Card */}
					<Box sx={{ 
						p: 3, 
						borderRadius: 3, 
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
					}}>
						<SectionHeader title="Session Result" icon={<StatusIcon />} />
						<Box sx={{ 
							p: 2.5, 
							borderRadius: 2, 
							bgcolor: alpha(theme.palette[getStatusColor(counseling.status)].main, 0.05),
							border: '1px solid',
							borderColor: alpha(theme.palette[getStatusColor(counseling.status)].main, 0.1),
							textAlign: 'center'
						}}>
							<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>
								FINAL RECOMMENDATION
							</Typography>
							<Chip 
								label={counseling.status.toUpperCase()} 
								color={getStatusColor(counseling.status)}
								sx={{ fontWeight: 900, px: 2, py: 2, height: 32, borderRadius: 1.5 }}
							/>
						</Box>
						<Stack spacing={2.5} sx={{ mt: 3 }}>
							<InfoRow 
								label="Counselor" 
								value={counseling.counselor_name} 
								icon={<CounselorIcon sx={{ fontSize: 18 }} />} 
							/>
							<InfoRow 
								label="Date" 
								value={counseling.counseling_date ? formatDate(counseling.counseling_date) : '-'} 
								icon={<EventIcon sx={{ fontSize: 18 }} />} 
							/>
						</Stack>
					</Box>

					{/* Experience Overview Sidebar */}
					{counseling.workexperience && counseling.workexperience.length > 0 && (
						<Box sx={{ 
							p: 3, 
							borderRadius: 3, 
							bgcolor: alpha(theme.palette.primary.main, 0.02),
							border: '1px solid',
							borderColor: alpha(theme.palette.primary.main, 0.1),
							boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
						}}>
							<SectionHeader title="Career Experience" icon={<WorkIcon />} />
							<Stack spacing={2}>
								{counseling.workexperience.map((exp, idx) => (
									<Box 
										key={idx} 
										sx={{ 
											p: 2, 
											borderRadius: 2, 
											bgcolor: 'background.paper', 
											border: '1px solid', 
											borderColor: 'divider',
											'&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
										}}
									>
										<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
											{exp.job_title}
										</Typography>
										<Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
											{exp.company}
										</Typography>
										<Divider sx={{ my: 1, borderStyle: 'dashed' }} />
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="caption" color="text.secondary">Tenure: <b>{exp.years_of_experience}</b></Typography>
											<Chip 
												label={exp.currently_working ? "Active" : "Past"} 
												size="small" 
												variant="outlined"
												color={exp.currently_working ? "success" : "default"}
												sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} 
											/>
										</Stack>
									</Box>
								))}
							</Stack>
						</Box>
					)}
				</Stack>
			</Grid>
		</Grid>
	);
};

export default CounselingTab;
