import React from 'react';
import { Grid, Paper, Box, Stack, Typography, Link, Divider, Avatar, Chip, useTheme, alpha } from '@mui/material';
import {
	Description as DescriptionIcon,
	Assignment as RequirementsIcon,
	Info as OverviewIcon,
	Person as PersonIcon,
	Business as BusinessIcon,
	EmailOutlined as EmailOutlinedIcon,
	PhoneOutlined as PhoneOutlinedIcon,
	LocationOn as LocationIcon,
	BadgeOutlined as BadgeIcon,
	Schedule as ScheduleIcon,
	PaymentsOutlined as SalaryIcon
} from '@mui/icons-material';
import { InfoRow, SectionHeader } from './DetailedViewCommon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { JobRole } from '../../../../models/jobRole';

interface JobRoleDetailsTabProps {
	jobRole: JobRole;
}

const JobRoleDetailsTab: React.FC<JobRoleDetailsTabProps> = ({ jobRole }) => {
	const theme = useTheme();
	const formatSalary = () => {
		if (!jobRole.salary_range) return 'N/A';
		const { min, max, currency } = jobRole.salary_range;
		const currencyStr = currency || 'INR';
		if (min && max) return `${currencyStr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
		if (min) return `${currencyStr} ${min.toLocaleString()}+`;
		if (max) return `Up to ${currencyStr} ${max.toLocaleString()}`;
		return 'N/A';
	};

	const formatExperience = () => {
		if (!jobRole.experience) return 'N/A';
		const { min, max } = jobRole.experience;
		if (min !== undefined && max !== undefined) {
			if (min === max) return `${min} Year${min !== 1 ? 's' : ''}`;
			return `${min} - ${max} Years`;
		}
		if (min !== undefined) return `${min}+ Year${min !== 1 ? 's' : ''}`;
		if (max !== undefined) return `Up to ${max} Year${max !== 1 ? 's' : ''}`;
		return 'N/A';
	};

	return (
		<Grid container spacing={3} sx={{ py: 3 }}>
			{/* Left Column: Core Job Details */}
			<Grid size={{ xs: 12, md: 8 }}>
				<Stack spacing={3}>
					{/* Description Section */}
					<Paper variant="outlined" sx={{ p: 3, borderRadius: 1, bgcolor: 'background.paper', boxShadow: (theme) => `0 1px 1px 0 ${theme.palette.divider}` }}>
						<SectionHeader title="Description" icon={<DescriptionIcon />} />
						<Box
							sx={{
								color: 'text.primary',
								lineHeight: 1.7,
								'& p': { mb: 2 },
								'& ul, & ol': { mb: 2, pl: 3 },
								'& li': { mb: 1 },
								'& strong, & b': { color: 'secondary.main', fontWeight: 700 },
								'& h1, & h2, & h3': { color: 'secondary.main', mt: 3, mb: 1, fontWeight: 700 }
							}}
						>
							<ReactMarkdown remarkPlugins={[remarkGfm]}>
								{jobRole.description || 'No description provided.'}
							</ReactMarkdown>
						</Box>
					</Paper>

					{/* Status Remarks Section (if applicable) */}
					{(jobRole.status === 'closed' && jobRole.status_reason) && (
						<Paper variant="outlined" sx={{ p: 3, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.04), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
							<SectionHeader title="Closure Remarks" icon={<OverviewIcon sx={{ color: 'warning.main' }} />} />
							<Typography variant="body2" sx={{ color: 'text.primary', fontStyle: 'italic', pl: 4.5 }}>
								"{jobRole.status_reason}"
							</Typography>
						</Paper>
					)}

					{/* Requirements Section */}
					<Paper variant="outlined" sx={{ p: 4, borderRadius: 1.5, bgcolor: 'background.paper', boxShadow: (theme) => `0 2px 4px 0 ${theme.palette.divider}` }}>
						<SectionHeader title="Requirements" icon={<RequirementsIcon />} />
						
						<Box sx={{ mb: 5 }}>
							<Typography variant="awsFieldLabel" sx={{ mb: 2 }}>Key Skills</Typography>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
								{jobRole.requirements?.skills?.map((skill, index) => (
									<Chip 
										key={index}
										label={skill}
										sx={{ 
											borderRadius: '6px', 
											fontWeight: 600,
											bgcolor: 'rgba(0, 77, 230, 0.04)',
											color: 'primary.main',
											border: '1px solid',
											borderColor: 'rgba(0, 77, 230, 0.15)',
											px: 0.5,
											'&:hover': {
												bgcolor: 'rgba(0, 77, 230, 0.08)',
											}
										}}
									/>
								)) || <Typography variant="body2" color="text.secondary">No specific skills listed</Typography>}
							</Box>
						</Box>

						<Divider sx={{ mb: 4, borderStyle: 'dashed', opacity: 0.6 }} />

						<Grid container spacing={4}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<InfoRow 
									label="Academic Qualifications" 
									icon={<BadgeIcon />}
									value={jobRole.requirements?.qualifications?.join(', ') || 'Any Graduate'} 
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<InfoRow 
									label="Preferred Disability Types" 
									icon={<PersonIcon />}
									value={jobRole.requirements?.disability_preferred?.join(', ') || 'Any Disability'} 
								/>
							</Grid>
						</Grid>
					</Paper>
				</Stack>
			</Grid>

			{/* Right Column: Integrated Role Summary Sidebar */}
			<Grid size={{ xs: 12, md: 4 }}>
				<Stack spacing={3}>
					{/* Sidebar Card 1: Job Overview */}
					<Paper variant="outlined" sx={{ borderRadius: 1, bgcolor: 'background.paper', overflow: 'hidden', boxShadow: (theme) => `0 1px 1px 0 ${theme.palette.divider}` }}>
						<Box sx={{ p: 3 }}>
							<Typography variant="awsSectionTitle" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
								<OverviewIcon sx={{ color: 'accent.main', fontSize: 20 }} />
								JOB OVERVIEW
							</Typography>
							
							<Stack spacing={2.5}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Stack direction="row" spacing={1.5} alignItems="center">
										<BadgeIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
										<Typography variant="body2" color="text.secondary">Vacancies</Typography>
									</Stack>
									<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{jobRole.no_of_vacancies || '-'}</Typography>
								</Box>

								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Stack direction="row" spacing={1.5} alignItems="center">
										<ScheduleIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
										<Typography variant="body2" color="text.secondary">Experience</Typography>
									</Stack>
									<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{formatExperience()}</Typography>
								</Box>

								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Stack direction="row" spacing={1.5} alignItems="center">
										<SalaryIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
										<Typography variant="body2" color="text.secondary">Salary</Typography>
									</Stack>
									<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{formatSalary()}</Typography>
								</Box>

								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Stack direction="row" spacing={1.5} alignItems="center">
										<LocationIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
										<Typography variant="body2" color="text.secondary">Workplace</Typography>
									</Stack>
									<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{jobRole.job_details?.workplace_type || '-'}</Typography>
								</Box>
								
								<Divider sx={{ my: 1 }} />

								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Typography variant="awsFieldLabel" sx={{ mb: 0 }}>CLOSING DATE</Typography>
									<Typography variant="caption" sx={{ fontWeight: 700, px: 1, py: 0.25, bgcolor: 'warning.light', color: 'warning.dark', borderRadius: 1 }}>
										{jobRole.close_date ? new Date(jobRole.close_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Open'}
									</Typography>
								</Box>
							</Stack>
						</Box>
					</Paper>

					{/* Sidebar Card 2: Point of Contact */}
					<Paper variant="outlined" sx={{ borderRadius: 1, bgcolor: 'background.paper', overflow: 'hidden', boxShadow: (theme) => `0 1px 1px 0 ${theme.palette.divider}` }}>
						<Box sx={{ p: 3 }}>
							<Typography variant="awsSectionTitle" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
								<PersonIcon sx={{ color: 'accent.main', fontSize: 20 }} />
								POINT OF CONTACT
							</Typography>

							{jobRole.contact ? (
								<Box>
									{/* Header with Avatar */}
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
										<Avatar sx={{ bgcolor: 'accent.main', width: 44, height: 44, fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
											{jobRole.contact.first_name[0]}{jobRole.contact.last_name[0]}
										</Avatar>
										<Box>
											<Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
												{jobRole.contact.first_name} {jobRole.contact.last_name}
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
												{jobRole.contact.designation || 'Hiring Manager'}
											</Typography>
										</Box>
									</Stack>

									{/* Contact Details List */}
									<Stack spacing={2}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
											<Stack direction="row" spacing={1.5} alignItems="center">
												<EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
												<Typography variant="body2" color="text.secondary">Email</Typography>
											</Stack>
											<Link
												href={`mailto:${jobRole.contact.email}`}
												sx={{
													color: 'primary.main',
													textDecoration: 'none',
													fontSize: '0.875rem',
													fontWeight: 700,
													textAlign: 'right',
													wordBreak: 'break-all',
													ml: 2,
													'&:hover': { textDecoration: 'underline' }
												}}
											>
												{jobRole.contact.email || 'N/A'}
											</Link>
										</Box>

										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<Stack direction="row" spacing={1.5} alignItems="center">
												<PhoneOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
												<Typography variant="body2" color="text.secondary">Phone</Typography>
											</Stack>
											<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
												{jobRole.contact.phone || jobRole.contact.mobile || '-'}
											</Typography>
										</Box>

										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<Stack direction="row" spacing={1.5} alignItems="center">
												<BusinessIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
												<Typography variant="body2" color="text.secondary">Company</Typography>
											</Stack>
											<Typography variant="body2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
												{jobRole.company?.name || '-'}
											</Typography>
										</Box>
									</Stack>
								</Box>
							) : (
								<Box sx={{ py: 2, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
									<Typography variant="caption" color="text.secondary">
										No contact person assigned
									</Typography>
								</Box>
							)}
						</Box>
					</Paper>
				</Stack>
			</Grid>
		</Grid>
	);
};

export default JobRoleDetailsTab;
