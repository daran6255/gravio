import React, { useEffect } from 'react';
import {
	Typography,
	Stack,
	Grid,
	TextField,
	FormControlLabel,
	Checkbox,
	Paper,
	Box,
	Button,
	IconButton,
	Divider,
	useTheme,
	alpha,
	Autocomplete,
	Tooltip,
	Avatar,
	Chip
} from '@mui/material';
import {
	Work as WorkIcon,
	InfoOutlined as InfoIcon,
	Add as AddIcon,
	DeleteOutline as DeleteIcon,
	Timeline as TimelineIcon,
	VerifiedOutlined as VerifiedIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchCompanies } from '../../../../store/slices/companySlice';
import { fetchJobRoles } from '../../../../store/slices/jobRoleSlice';
import type { CandidateCounselingCreate, WorkExperience } from '../../../../models/candidate';

interface WorkExperienceTabProps {
	formData: CandidateCounselingCreate;
	onAddWorkExp: () => void;
	onRemoveWorkExp: (index: number) => void;
	onWorkExpChange: (index: number, field: string, value: unknown) => void;
	candidateWorkExperience?: WorkExperience;
}

const WorkExperienceTab: React.FC<WorkExperienceTabProps> = ({
	formData,
	onAddWorkExp,
	onRemoveWorkExp,
	onWorkExpChange,
	candidateWorkExperience
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	
	const { list: companyList } = useAppSelector((state) => state.companies);
	const { list: jobRoleList } = useAppSelector((state) => state.jobRoles);

	useEffect(() => {
		if (companyList.length === 0) {
			dispatch(fetchCompanies({ limit: 100 }));
		}
		if (jobRoleList.length === 0) {
			dispatch(fetchJobRoles({ limit: 100 }));
		}
	}, [dispatch, companyList.length, jobRoleList.length]);

	const companyOptions = Array.from(new Set(companyList.map(c => c.name)));
	const jobTitleOptions = Array.from(new Set(jobRoleList.map(j => j.title)));

	const inputSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: 0.5,
			bgcolor: 'background.paper',
			'& fieldset': { borderColor: 'divider' },
			'&:hover fieldset': { borderColor: 'text.secondary' },
			'&.Mui-focused fieldset': { borderColor: 'primary.main' }
		}
	};

	const workexperienceList = formData.workexperience || [];

	return (
		<Stack spacing={4}>
			{/* Professional Status Header */}
			<Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 0.5 }}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: 0.5, display: 'flex' }}>
						<InfoIcon sx={{ color: 'common.white', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Career Profile Snapshot</Typography>
				</Stack>

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 4 }}>
						<Box sx={{ 
							p: 2, 
							borderRadius: 0.5, 
							bgcolor: alpha(theme.palette.primary.main, 0.04),
							border: '1px solid',
							borderColor: alpha(theme.palette.primary.main, 0.1)
						}}>
							<Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
								Experienced Profile
							</Typography>
							<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 800 }}>
								{candidateWorkExperience?.is_experienced ? 'Yes' : 'No'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<Box sx={{ 
							p: 2, 
							borderRadius: 0.5, 
							bgcolor: alpha(theme.palette.success.main, 0.04),
							border: '1px solid',
							borderColor: alpha(theme.palette.success.main, 0.1)
						}}>
							<Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
								Current Employment
							</Typography>
							<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 800 }}>
								{candidateWorkExperience?.currently_employed ? 'Employed' : 'Unemployed'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<Box sx={{ 
							p: 2, 
							borderRadius: 0.5, 
							bgcolor: alpha(theme.palette.info.main, 0.04),
							border: '1px solid',
							borderColor: alpha(theme.palette.info.main, 0.1)
						}}>
							<Typography variant="caption" sx={{ color: 'info.main', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
								Experience Tenure
							</Typography>
							<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 800 }}>
								{candidateWorkExperience?.year_of_experience || 'Fresher'}
							</Typography>
						</Box>
					</Grid>
				</Grid>
			</Paper>

			{/* Career History Timeline */}
			<Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 0.5 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: 0.5, display: 'flex' }}>
							<WorkIcon sx={{ color: 'common.white', fontSize: 20 }} />
						</Box>
						<Typography variant="awsSectionTitle">Employment History & Outcomes</Typography>
					</Stack>
					<Button
						variant="contained"
						size="small"
						startIcon={<AddIcon />}
						onClick={onAddWorkExp}
						sx={{
							borderRadius: 0.5,
							textTransform: 'none',
							boxShadow: 'none',
							'&:hover': { boxShadow: 'none', bgcolor: 'primary.dark' }
						}}
					>
						Add Career Milestone
					</Button>
				</Box>

				<Divider sx={{ mb: 4 }} />

				{workexperienceList.length === 0 ? (
					<Box sx={{ 
						textAlign: 'center', 
						py: 10, 
						border: '1px dashed', 
						borderColor: 'divider', 
						borderRadius: 0.5, 
						bgcolor: 'background.default' 
					}}>
						<TimelineIcon sx={{ fontSize: 48, color: 'divider', mb: 2 }} />
						<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
							No career milestones documented yet.
						</Typography>
						<Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
							Record previous employment details to complete the candidate's professional mapping.
						</Typography>
					</Box>
				) : (
					<Stack spacing={4} sx={{ position: 'relative' }}>
						{workexperienceList.map((exp, index) => (
							<Box key={index} sx={{ position: 'relative' }}>
								{/* Card Content */}
								<Paper
									elevation={0}
									variant="outlined"
									sx={{
										borderRadius: 0.5,
										bgcolor: 'background.paper',
										overflow: 'hidden',
										'&:hover': { borderColor: 'primary.main' }
									}}
								>
									<Box sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										px: 3,
										py: 1.5,
										bgcolor: 'action.hover',
										borderBottom: '1px solid',
										borderColor: 'divider'
									}}>
										<Stack direction="row" spacing={1} alignItems="center">
											<Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem', fontWeight: 800 }}>
												{index + 1}
											</Avatar>
											<Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
												Career Milestone #{index + 1}
											</Typography>
											{exp.currently_working && (
												<Chip 
													icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: 'inherit !important' }} />}
													label="Current Role" 
													size="small" 
													color="success"
													variant="outlined"
													sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, borderRadius: 0.5, bgcolor: alpha(theme.palette.success.main, 0.05) }}
												/>
											)}
										</Stack>
										<Tooltip title="Remove Milestone">
											<IconButton
												size="small"
												onClick={() => onRemoveWorkExp(index)}
												sx={{ 
													color: 'error.main',
													'&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
												}}
											>
												<DeleteIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									</Box>
	
									<Box sx={{ p: 3 }}>
										<Grid container spacing={4}>
											<Grid size={{ xs: 12, md: 6 }}>
												<Box>
													<Typography variant="awsFieldLabel">Job Title / Designation</Typography>
													<Autocomplete
														freeSolo
														options={jobTitleOptions}
														value={exp.job_title || ''}
														onChange={(_e, val) => onWorkExpChange(index, 'job_title', val)}
														onInputChange={(_e, val) => onWorkExpChange(index, 'job_title', val)}
														renderInput={(params) => (
															<TextField
																{...params}
																fullWidth
																size="small"
																placeholder="e.g. Senior Software Engineer"
																sx={inputSx}
															/>
														)}
													/>
												</Box>
											</Grid>
											<Grid size={{ xs: 12, md: 6 }}>
												<Box>
													<Typography variant="awsFieldLabel">Company / Organization</Typography>
													<Autocomplete
														freeSolo
														options={companyOptions}
														value={exp.company || ''}
														onChange={(_e, val) => onWorkExpChange(index, 'company', val)}
														onInputChange={(_e, val) => onWorkExpChange(index, 'company', val)}
														renderInput={(params) => (
															<TextField
																{...params}
																fullWidth
																size="small"
																placeholder="e.g. WinVinaya Foundation"
																sx={inputSx}
															/>
														)}
													/>
												</Box>
											</Grid>
											<Grid size={{ xs: 12, md: 6 }}>
												<Box>
													<Typography variant="awsFieldLabel">Tenure / Duration</Typography>
													<TextField
														fullWidth
														size="small"
														value={exp.years_of_experience || ''}
														onChange={(e) => onWorkExpChange(index, 'years_of_experience', e.target.value)}
														placeholder="e.g. 2 Years 4 Months"
														sx={inputSx}
													/>
												</Box>
											</Grid>
											<Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
												<FormControlLabel
													control={
														<Checkbox
															size="small"
															checked={exp.currently_working || false}
															onChange={(e) => onWorkExpChange(index, 'currently_working', e.target.checked)}
															sx={{ 
																color: 'divider', 
																'&.Mui-checked': { color: 'primary.main' } 
															}}
														/>
													}
													label={<Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>Active Role (Currently Working Here)</Typography>}
													sx={{ ml: 0 }}
												/>
											</Grid>
										</Grid>
									</Box>
								</Paper>
							</Box>
						))}
					</Stack>
				)}
			</Paper>
		</Stack>
	);
};

export default WorkExperienceTab;
