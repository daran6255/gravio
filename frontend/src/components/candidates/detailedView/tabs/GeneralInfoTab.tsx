import React from 'react';
import {
	Grid,
	Box,
	Typography,
	useTheme,
	alpha,
	Chip,
	Stack,
	Avatar,
	Divider
} from '@mui/material';
import {
	Person as PersonIcon,
	AccessibilityNew as AccessibilityIcon,
	FamilyRestroom as FamilyIcon,
	School as SchoolIcon,
	Email as EmailIcon,
	Phone as PhoneIcon,
	WhatsApp as WhatsAppIcon,
	Male as MaleIcon,
	Female as FemaleIcon,
	Transgender as TransgenderIcon,
	Cake as CakeIcon,
	LocationOn as LocationIcon,
	Work as WorkIcon,
	Verified as VerifiedIcon
} from '@mui/icons-material';
import { useDateTime } from '../../../../hooks/useDateTime';
import { InfoRow, SectionHeader, SectionCard } from '../DetailedViewCommon';
import type { Candidate } from '../../../../models/candidate';

interface GeneralInfoTabProps {
	candidate: Candidate;
}

const GeneralInfoTab: React.FC<GeneralInfoTabProps> = ({ candidate }) => {
	const theme = useTheme();
	const { formatDate } = useDateTime();

	const getGenderChip = (gender: string) => {
		const g = gender?.toLowerCase();
		let icon = <TransgenderIcon />;
		let color: "primary" | "secondary" | "info" = "info";

		if (g === 'male') {
			icon = <MaleIcon />;
			color = "primary";
		} else if (g === 'female') {
			icon = <FemaleIcon />;
			color = "secondary";
		}

		return (
			<Chip
				icon={icon}
				label={gender || 'Not specified'}
				size="small"
				variant="outlined"
				color={color}
				sx={{ fontWeight: 600, borderRadius: 1.5 }}
			/>
		);
	};

	return (
		<Grid container spacing={4}>
			{/* Main Content Area */}
			<Grid size={{ xs: 12, md: 8 }}>
				<SectionCard sx={{ border: 'none', boxShadow: 'none', bgcolor: 'transparent', p: 0 }}>
					{/* Basic Information Section */}
					<Box sx={{
						mb: 4,
						p: 3,
						borderRadius: 3,
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
					}}>
						<SectionHeader title="Basic Information" icon={<PersonIcon />} />
						<Grid container spacing={4}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<InfoRow
									label="Full Name"
									value={
										<Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
											{candidate.name}
										</Typography>
									}
								/>
								<Stack spacing={2} sx={{ mt: 1 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 32, height: 32 }}>
											<EmailIcon sx={{ fontSize: 18 }} />
										</Avatar>
										<Box>
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Email</Typography>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>{candidate.email}</Typography>
										</Box>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 32, height: 32 }}>
											<PhoneIcon sx={{ fontSize: 18 }} />
										</Avatar>
										<Box>
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Phone</Typography>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>{candidate.phone}</Typography>
										</Box>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<Avatar sx={{ bgcolor: alpha(theme.palette.success.light, 0.1), color: 'success.dark', width: 32, height: 32 }}>
											<WhatsAppIcon sx={{ fontSize: 18 }} />
										</Avatar>
										<Box>
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>WhatsApp</Typography>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>{candidate.whatsapp_number || 'Not provided'}</Typography>
										</Box>
									</Box>
								</Stack>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<Stack spacing={2.5}>
									<Box>
										<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Gender</Typography>
										{getGenderChip(candidate.gender)}
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 32, height: 32 }}>
											<CakeIcon sx={{ fontSize: 18 }} />
										</Avatar>
										<Box>
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Date of Birth</Typography>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(candidate.dob)}</Typography>
										</Box>
									</Box>
									<Box sx={{
										p: 2,
										borderRadius: 2,
										bgcolor: alpha(theme.palette.primary.main, 0.03),
										border: '1px dashed',
										borderColor: alpha(theme.palette.primary.main, 0.2),
										display: 'flex',
										alignItems: 'flex-start',
										gap: 2
									}}>
										<LocationIcon color="primary" />
										<Box>
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Current Location</Typography>
											<Typography variant="body2" sx={{ fontWeight: 600 }}>{candidate.city}, {candidate.state}</Typography>
											<Typography variant="caption" color="text.secondary">Pincode: {candidate.pincode}</Typography>
										</Box>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', width: 32, height: 32 }}>
											<VerifiedIcon sx={{ fontSize: 18 }} />
										</Avatar>
										<Box>
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Registration Source</Typography>
											<Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
												{candidate.other?.registration_type || 'Self Registered'}
											</Typography>
										</Box>
									</Box>
								</Stack>
							</Grid>
						</Grid>
					</Box>

					{/* Disability Information Section */}
					<Box sx={{
						mb: 4,
						p: 3,
						borderRadius: 3,
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
					}}>
						<SectionHeader title="Disability Profile" icon={<AccessibilityIcon />} />
						<Stack direction="row" spacing={3} alignItems="center">
							<Box sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								p: 2,
								minWidth: 100,
								borderRadius: 2,
								bgcolor: candidate.disability_details?.is_disabled ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.success.main, 0.05),
								border: '1px solid',
								borderColor: candidate.disability_details?.is_disabled ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.success.main, 0.1),
							}}>
								<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>STATUS</Typography>
								<Chip
									label={candidate.disability_details?.is_disabled ? 'Disabled' : 'No Disability'}
									color={candidate.disability_details?.is_disabled ? 'error' : 'success'}
									size="small"
									sx={{ fontWeight: 700 }}
								/>
							</Box>

							{candidate.disability_details?.is_disabled && (
								<>
									<Box sx={{ flex: 1 }}>
										<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Type of Disability</Typography>
										<Typography variant="body1" sx={{ fontWeight: 600 }}>{candidate.disability_details?.disability_type}</Typography>
										{candidate.other?.disability_sub_category && (
											<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
												Sub-category: <strong>{candidate.other.disability_sub_category}</strong>
											</Typography>
										)}
									</Box>
									<Box sx={{ textAlign: 'right' }}>
										<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Severity</Typography>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main' }}>
												{candidate.disability_details?.disability_percentage}%
											</Typography>
											<VerifiedIcon sx={{ color: 'error.main', fontSize: 18 }} />
										</Box>
									</Box>
								</>
							)}
						</Stack>
					</Box>

					{/* Academic History Section */}
					<Box sx={{
						p: 3,
						borderRadius: 3,
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
					}}>
						<SectionHeader title="Academic History" icon={<SchoolIcon />} />
						{candidate.education_details?.degrees && candidate.education_details.degrees.length > 0 ? (
							<Stack spacing={2}>
								{candidate.education_details.degrees.map((edu, index) => (
									<Box
										key={index}
										sx={{
											p: 2.5,
											borderRadius: 2,
											border: '1px solid',
											borderColor: 'divider',
											transition: 'all 0.2s ease',
											'&:hover': {
												borderColor: 'primary.main',
												bgcolor: alpha(theme.palette.primary.main, 0.02),
												transform: 'translateY(-2px)',
												boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
											}
										}}
									>
										<Grid container spacing={2} alignItems="center">
											<Grid size={{ xs: 12, sm: 8 }}>
												<Box sx={{ display: 'flex', gap: 2 }}>
													<Avatar sx={{ bgcolor: 'secondary.main', color: 'white', width: 40, height: 40 }}>
														<SchoolIcon />
													</Avatar>
													<Box>
														<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
															{edu.degree_name} {edu.specialization && `• ${edu.specialization}`}
														</Typography>
														<Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															<VerifiedIcon sx={{ fontSize: 14 }} color="success" /> {edu.college_name}
														</Typography>
													</Box>
												</Box>
											</Grid>
											<Grid size={{ xs: 12, sm: 4 }}>
												<Stack direction="row" spacing={3} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
													<Box sx={{ textAlign: 'right' }}>
														<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>CLASS OF</Typography>
														<Typography variant="body2" sx={{ fontWeight: 700 }}>{edu.year_of_passing}</Typography>
													</Box>
													<Box sx={{ textAlign: 'right' }}>
														<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>SCORE</Typography>
														<Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
															{edu.percentage ? `${edu.percentage}%` : '-'}
														</Typography>
													</Box>
												</Stack>
											</Grid>
										</Grid>
									</Box>
								))}
							</Stack>
						) : (
							<Box sx={{ textAlign: 'center', py: 4, bgcolor: 'action.hover', borderRadius: 2 }}>
								<Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
									Academic history not documented
								</Typography>
							</Box>
						)}
					</Box>
				</SectionCard>
			</Grid>

			{/* Sidebar Content */}
			<Grid size={{ xs: 12, md: 4 }}>
				<Stack spacing={4}>
					{/* Guardian Card */}
					<Box sx={{
						p: 3,
						borderRadius: 3,
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
						position: 'relative',
						overflow: 'hidden'
					}}>
						<Box sx={{ position: 'relative', zIndex: 1 }}>
							<SectionHeader title="Guardian Details" icon={<FamilyIcon />} />
							<Stack spacing={2.5}>
								<InfoRow label="Guardian Name" value={candidate.guardian_details?.parent_name} />
								<Box>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Relationship</Typography>
									<Chip
										label={candidate.guardian_details?.relationship || 'Not specified'}
										size="small"
										color="secondary"
										variant="outlined"
										sx={{ borderRadius: 1.5, fontWeight: 600 }}
									/>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
									<Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', width: 32, height: 32 }}>
										<PhoneIcon sx={{ fontSize: 18 }} />
									</Avatar>
									<Box>
										<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>GUARDIAN CONTACT</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600 }}>{candidate.guardian_details?.parent_phone || '-'}</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</Box>

					{/* Placement & Batch Information (Imported Data) */}
					{candidate.other && (
						<Box sx={{
							p: 3,
							borderRadius: 3,
							bgcolor: 'background.paper',
							border: '1px solid',
							borderColor: 'divider',
							boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
						}}>
							<SectionHeader title="Historical & Batch Info" icon={<VerifiedIcon />} />
							<Stack spacing={2}>
								{candidate.other.batch_year && <InfoRow label="Batch Year" value={candidate.other.batch_year} />}
								{candidate.other.donor && <InfoRow label="Donor" value={candidate.other.donor} />}
								{candidate.other.status_of_beneficiary && <InfoRow label="Beneficiary Status" value={candidate.other.status_of_beneficiary} />}

								<Divider sx={{ my: 1 }} />

								{candidate.other.company_placed && <InfoRow label="Placed At" value={candidate.other.company_placed} />}
								{candidate.other.designation && <InfoRow label="Designation" value={candidate.other.designation} />}
								{candidate.other.ctc && <InfoRow label="CTC/Salary" value={candidate.other.ctc} />}
								{candidate.other.date_of_joining && <InfoRow label="Joining Date" value={candidate.other.date_of_joining} />}
							</Stack>
						</Box>
					)}

					{/* Experience Card */}
					<Box sx={{
						p: 3,
						borderRadius: 3,
						bgcolor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
					}}>
						<SectionHeader title="Professional Profile" icon={<WorkIcon />} />
						<Stack spacing={3}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>Status</Typography>
								<Chip
									label={candidate.work_experience?.is_experienced ? 'EXPERIENCED' : 'FRESHER'}
									color={candidate.work_experience?.is_experienced ? 'primary' : 'default'}
									variant={candidate.work_experience?.is_experienced ? 'filled' : 'outlined'}
									size="small"
									sx={{ fontWeight: 800, borderRadius: 1 }}
								/>
							</Box>

							{candidate.work_experience?.is_experienced && (
								<>
									<Divider />
									<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
										<Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
											<Typography variant="h6" sx={{ fontWeight: 800 }}>
												{candidate.work_experience?.year_of_experience}
											</Typography>
										</Avatar>
										<Box>
											<Typography variant="body2" sx={{ fontWeight: 700 }}>Years of Experience</Typography>
											<Typography variant="caption" color="text.secondary">Total professional tenure</Typography>
										</Box>
									</Box>
									<Box sx={{
										p: 1.5,
										borderRadius: 2,
										bgcolor: candidate.work_experience?.currently_employed ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.info.main, 0.05),
										border: '1px solid',
										borderColor: candidate.work_experience?.currently_employed ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.info.main, 0.1),
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between'
									}}>
										<Typography variant="caption" sx={{ fontWeight: 700 }}>CURRENTLY EMPLOYED</Typography>
										<Typography variant="caption" sx={{ fontWeight: 800, color: candidate.work_experience?.currently_employed ? 'success.main' : 'info.main' }}>
											{candidate.work_experience?.currently_employed ? 'YES' : 'NO'}
										</Typography>
									</Box>
								</>
							)}
						</Stack>
					</Box>
				</Stack>
			</Grid>
		</Grid>
	);
};

export default GeneralInfoTab;
