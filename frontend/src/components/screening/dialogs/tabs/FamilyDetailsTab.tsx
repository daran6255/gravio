import React from 'react';
import {
	Box,
	Typography,
	TextField,
	IconButton,
	Button,
	Paper,
	Stack,
	MenuItem,
	Select,
	Grid,
	FormControl,
	useTheme
} from '@mui/material';
import {
	DeleteOutline as DeleteIcon,
	Add as AddIcon,
	AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import { awsStyles } from '../../../../theme/theme';

interface FamilyMember {
	name: string;
	phone: string;
	relation: string;
	occupation: string;
	company_name: string;
	position: string;
}

const RELATION_OPTIONS = [
	'Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Guardian', 'Son', 'Daughter', 'Other'
];

interface FamilyDetailsTabProps {
	formData: any;
	onUpdateField: (section: string, field: string, value: any) => void;
}

const FamilyDetailsTab: React.FC<FamilyDetailsTabProps> = ({ formData, onUpdateField }) => {
	const theme = useTheme();
	const { awsPanel } = awsStyles;
	const familyDetails: FamilyMember[] = formData.family_details || [];

	const handleAddRow = () => {
		const newRow: FamilyMember = {
			name: '',
			phone: '',
			relation: '',
			occupation: '',
			company_name: '',
			position: ''
		};
		onUpdateField('root', 'family_details', [...familyDetails, newRow]);
	};

	const handleRemoveRow = (index: number) => {
		const updatedDetails = familyDetails.filter((_, i) => i !== index);
		onUpdateField('root', 'family_details', updatedDetails);
	};

	const handleChange = (index: number, field: keyof FamilyMember, value: string) => {
		if (field === 'phone') {
			const sanitized = value.replace(/\D/g, '').slice(0, 10);
			value = sanitized;
		}

		const updatedDetails = familyDetails.map((member, i) =>
			i === index ? { ...member, [field]: value } : member
		);
		onUpdateField('root', 'family_details', updatedDetails);
	};

	const textFieldSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: '2px',
			bgcolor: 'background.paper',
			'& fieldset': { borderColor: 'divider' },
			'&:hover fieldset': { borderColor: theme.palette.text.secondary },
			'&.Mui-focused fieldset': { borderColor: 'primary.main' }
		}
	};

	return (
		<Stack spacing={4}>
			{/* Economic Background Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<WalletIcon sx={{ color: 'common.white', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Economic Background</Typography>
				</Stack>

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="awsFieldLabel">Family Annual Income (in INR)</Typography>
						<TextField
							fullWidth
							size="small"
							type="number"
							placeholder="Enter total annual income"
							value={formData.others?.family_annual_income || ''}
							onChange={(e) => onUpdateField('others', 'family_annual_income', e.target.value)}
							sx={textFieldSx}
						/>
					</Grid>
				</Grid>
			</Paper>

			{/* Family Members Section */}
			<Box>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
					<Typography variant="awsSectionTitle">Family & Dependent Details</Typography>
					<Button
						variant="contained"
						size="small"
						startIcon={<AddIcon />}
						onClick={handleAddRow}
						sx={{
							borderRadius: '2px',
							textTransform: 'none',
							fontWeight: 700,
							px: 2.5,
							boxShadow: 'none',
							'&:hover': { boxShadow: 'none', bgcolor: 'primary.dark' }
						}}
					>
						Add Family Member
					</Button>
				</Stack>

				<Stack spacing={3}>
					{familyDetails.length === 0 ? (
						<Paper
							elevation={0}
							sx={{
								p: 6,
								textAlign: 'center',
								border: '1px dashed',
								borderColor: 'divider',
								bgcolor: 'background.default',
								borderRadius: '4px'
							}}
						>
							<Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
								No family members have been added yet.
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.disabled' }}>
								Standard enterprise practice requires documenting core dependents for placement eligibility.
							</Typography>
						</Paper>
					) : (
						familyDetails.map((member, index) => (
							<Paper key={index} elevation={0} sx={{ ...awsPanel, p: 0, overflow: 'hidden' }}>
								{/* Card Header */}
								<Box sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									px: 3,
									py: 1.5,
									bgcolor: 'rgba(0, 0, 0, 0.02)',
									borderBottom: '1px solid',
									borderColor: 'divider'
								}}>
									<Stack direction="row" spacing={1.5} alignItems="center">
										<Box sx={{
											width: 28,
											height: 28,
											borderRadius: '4px',
											bgcolor: 'secondary.main',
											color: 'white',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '0.85rem',
											fontWeight: 700
										}}>
											{index + 1}
										</Box>
										<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
											{member.relation || 'Member'} Details
										</Typography>
									</Stack>
									<IconButton
										size="small"
										onClick={() => handleRemoveRow(index)}
										sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light', opacity: 0.1 } }}
									>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</Box>

								{/* Card Content */}
								<Box sx={{ p: 3 }}>
									<Grid container spacing={4}>
										{/* Personal Column */}
										<Grid size={{ xs: 12, md: 6 }}>
											<Stack spacing={2.5}>
												<Box>
													<Typography variant="awsFieldLabel">Full Name</Typography>
													<TextField
														fullWidth
														size="small"
														placeholder="Enter member's name"
														value={member.name}
														onChange={(e) => handleChange(index, 'name', e.target.value)}
														sx={textFieldSx}
													/>
												</Box>

												<Grid container spacing={2}>
													<Grid size={{ xs: 12, sm: 6 }}>
														<Typography variant="awsFieldLabel">Relationship</Typography>
														<FormControl fullWidth size="small">
															<Select
																value={member.relation}
																onChange={(e) => handleChange(index, 'relation', e.target.value)}
																displayEmpty
																sx={{
																	borderRadius: '2px',
																	bgcolor: 'background.paper',
																	'& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
																	'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
																	'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
																}}
															>
																<MenuItem value="" disabled><em>Select</em></MenuItem>
																{RELATION_OPTIONS.map(opt => (
																	<MenuItem key={opt} value={opt}>{opt}</MenuItem>
																))}
															</Select>
														</FormControl>
													</Grid>
													<Grid size={{ xs: 12, sm: 6 }}>
														<Typography variant="awsFieldLabel">Contact Number</Typography>
														<TextField
															fullWidth
															placeholder="10-digit mobile"
															size="small"
															value={member.phone}
															onChange={(e) => handleChange(index, 'phone', e.target.value)}
															error={member.phone !== '' && member.phone.length !== 10}
															sx={textFieldSx}
														/>
													</Grid>
												</Grid>
											</Stack>
										</Grid>

										{/* Professional Column */}
										<Grid size={{ xs: 12, md: 6 }}>
											<Stack spacing={2.5}>
												<Box>
													<Typography variant="awsFieldLabel">Occupation</Typography>
													<TextField
														fullWidth
														size="small"
														placeholder="e.g. Salaried, Self-employed"
														value={member.occupation}
														onChange={(e) => handleChange(index, 'occupation', e.target.value)}
														sx={textFieldSx}
													/>
												</Box>
												<Box>
													<Typography variant="awsFieldLabel">Organization & Position</Typography>
													<Grid container spacing={2}>
														<Grid size={{ xs: 12, sm: 6 }}>
															<TextField
																fullWidth
																placeholder="Company name"
																size="small"
																value={member.company_name}
																onChange={(e) => handleChange(index, 'company_name', e.target.value)}
																sx={textFieldSx}
															/>
														</Grid>
														<Grid size={{ xs: 12, sm: 6 }}>
															<TextField
																fullWidth
																placeholder="Job title"
																size="small"
																value={member.position}
																onChange={(e) => handleChange(index, 'position', e.target.value)}
																sx={textFieldSx}
															/>
														</Grid>
													</Grid>
												</Box>
											</Stack>
										</Grid>
									</Grid>
								</Box>
							</Paper>
						))
					)}
				</Stack>
			</Box>
		</Stack>
	);
};

export default FamilyDetailsTab;
