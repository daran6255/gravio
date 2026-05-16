import React from 'react';
import {
	Box,
	Typography,
	Stack,
	FormControl,
	RadioGroup,
	FormControlLabel,
	Radio,
	TextField,
	Checkbox,
	Grid,
	Autocomplete,
	Paper,
	useTheme
} from '@mui/material';
import { School as SchoolIcon, Explore as ExploreIcon, Info as InfoIcon } from '@mui/icons-material';
import { awsStyles } from '../../../../theme/theme';

interface BackgroundTrainingTabProps {
	formData: any;
	onUpdateField: (section: string, field: string, value: any) => void;
}

const BackgroundTrainingTab: React.FC<BackgroundTrainingTabProps> = ({
	formData,
	onUpdateField
}) => {
	const theme = useTheme();
	const { awsPanel, helperBox } = awsStyles;

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
			{/* Training History Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<SchoolIcon sx={{ color: 'common.white', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Training History</Typography>
				</Stack>

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<FormControl component="fieldset" fullWidth>
							<Typography variant="awsFieldLabel">
								Have you attended any training previously?
							</Typography>
							<RadioGroup
								row
								value={formData.previous_training?.attended_any_training ? 'yes' : 'no'}
								onChange={(e) => onUpdateField('previous_training', 'attended_any_training', e.target.value === 'yes')}
								sx={{ gap: 2 }}
							>
								<Paper elevation={0} sx={{
									px: 2, border: '1px solid', borderColor: 'divider', borderRadius: '2px',
									bgcolor: formData.previous_training?.attended_any_training === true ? 'rgba(0, 77, 230, 0.04)' : 'transparent'
								}}>
									<FormControlLabel value="yes" control={<Radio size="small" color="primary" />} label={<Typography variant="body2">Yes</Typography>} />
								</Paper>
								<Paper elevation={0} sx={{
									px: 2, border: '1px solid', borderColor: 'divider', borderRadius: '2px',
									bgcolor: formData.previous_training?.attended_any_training === false ? 'rgba(0, 77, 230, 0.04)' : 'transparent'
								}}>
									<FormControlLabel value="no" control={<Radio size="small" color="primary" />} label={<Typography variant="body2">No</Typography>} />
								</Paper>
							</RadioGroup>
						</FormControl>
					</Grid>

					<Grid size={{ xs: 12, md: 6 }}>
						<Box sx={{
							p: 1.5,
							border: '1px solid',
							borderColor: formData.previous_training?.is_winvinaya_student ? 'success.main' : 'divider',
							borderRadius: '2px',
							bgcolor: formData.previous_training?.is_winvinaya_student ? 'rgba(16, 185, 129, 0.04)' : 'background.default'
						}}>
							<FormControlLabel
								control={
									<Checkbox
										size="small"
										color="primary"
										checked={formData.previous_training?.is_winvinaya_student}
										onChange={(e) => onUpdateField('previous_training', 'is_winvinaya_student', e.target.checked)}
									/>
								}
								label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Are you a WinVinaya Student?</Typography>}
								sx={{ m: 0 }}
							/>
						</Box>
					</Grid>

					{/* Conditional Fields for WinVinaya Students */}
					{formData.previous_training?.is_winvinaya_student && (
						<>
							<Grid size={{ xs: 12, sm: 6 }}>
								<Typography variant="awsFieldLabel">Year of Joining / Completion</Typography>
								<TextField
									fullWidth
									size="small"
									placeholder="e.g. 2023"
									value={formData.previous_training?.winvinaya_year || ''}
									onChange={(e) => onUpdateField('previous_training', 'winvinaya_year', e.target.value)}
									sx={textFieldSx}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<Typography variant="awsFieldLabel">Batch Name / Details</Typography>
								<TextField
									fullWidth
									size="small"
									placeholder="e.g. Batch 12 - Data Entry"
									value={formData.previous_training?.winvinaya_batch || ''}
									onChange={(e) => onUpdateField('previous_training', 'winvinaya_batch', e.target.value)}
									sx={textFieldSx}
								/>
							</Grid>
						</>
					)}

					{formData.previous_training?.attended_any_training && (
						<Grid size={{ xs: 12 }}>
							<Typography variant="awsFieldLabel">Previous Training Details</Typography>
							<TextField
								placeholder="Mention course name, institute, and duration..."
								fullWidth
								multiline
								rows={2}
								size="small"
								value={formData.previous_training?.training_details}
								onChange={(e) => onUpdateField('previous_training', 'training_details', e.target.value)}
								sx={textFieldSx}
							/>
						</Grid>
					)}
				</Grid>
			</Paper>

			{/* Logistics & Readiness Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<ExploreIcon sx={{ color: 'common.white', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Logistics & Readiness</Typography>
				</Stack>

				<Grid container spacing={4}>
					<Grid size={{ xs: 12, md: 6 }}>
						<FormControl component="fieldset" fullWidth>
							<Typography variant="awsFieldLabel">Willing for Training?</Typography>
							<RadioGroup
								row
								value={formData.others?.willing_for_training ? 'yes' : 'no'}
								onChange={(e) => onUpdateField('others', 'willing_for_training', e.target.value === 'yes')}
								sx={{ gap: 2 }}
							>
								<Paper elevation={0} sx={{
									px: 2, border: '1px solid', borderColor: 'divider', borderRadius: '2px',
									bgcolor: formData.others?.willing_for_training === true ? 'rgba(0, 77, 230, 0.04)' : 'transparent'
								}}>
									<FormControlLabel value="yes" control={<Radio size="small" color="primary" />} label={<Typography variant="body2">Yes</Typography>} />
								</Paper>
								<Paper elevation={0} sx={{
									px: 2, border: '1px solid', borderColor: 'divider', borderRadius: '2px',
									bgcolor: formData.others?.willing_for_training === false ? 'rgba(0, 77, 230, 0.04)' : 'transparent'
								}}>
									<FormControlLabel value="no" control={<Radio size="small" color="primary" />} label={<Typography variant="body2">No</Typography>} />
								</Paper>
							</RadioGroup>
						</FormControl>
					</Grid>

					<Grid size={{ xs: 12, md: 6 }}>
						<FormControl component="fieldset" fullWidth>
							<Typography variant="awsFieldLabel">Ready to Relocate?</Typography>
							<RadioGroup
								row
								value={formData.others?.ready_to_relocate ? 'yes' : 'no'}
								onChange={(e) => onUpdateField('others', 'ready_to_relocate', e.target.value === 'yes')}
								sx={{ gap: 2 }}
							>
								<Paper elevation={0} sx={{
									px: 2, border: '1px solid', borderColor: 'divider', borderRadius: '2px',
									bgcolor: formData.others?.ready_to_relocate === true ? 'rgba(0, 77, 230, 0.04)' : 'transparent'
								}}>
									<FormControlLabel value="yes" control={<Radio size="small" color="primary" />} label={<Typography variant="body2">Yes</Typography>} />
								</Paper>
								<Paper elevation={0} sx={{
									px: 2, border: '1px solid', borderColor: 'divider', borderRadius: '2px',
									bgcolor: formData.others?.ready_to_relocate === false ? 'rgba(0, 77, 230, 0.04)' : 'transparent'
								}}>
									<FormControlLabel value="no" control={<Radio size="small" color="primary" />} label={<Typography variant="body2">No</Typography>} />
								</Paper>
							</RadioGroup>
						</FormControl>
					</Grid>
				</Grid>
			</Paper>

			{/* Referral & Discovery Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<InfoIcon sx={{ color: 'common.white', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Discovery & Referral</Typography>
				</Stack>

				<Box>
					<Typography variant="awsFieldLabel">How did you know about us?</Typography>
					<Autocomplete
						freeSolo
						options={['Google Search', 'LinkedIn', 'V-Shesh', 'NGO Partner', 'Facebook / Instagram', 'WhatsApp Groups', 'Friends / Family Referral']}
						value={formData.others?.source_of_info || ''}
						onInputChange={(_event, newValue) => onUpdateField('others', 'source_of_info', newValue)}
						onChange={(_event, newValue) => onUpdateField('others', 'source_of_info', newValue)}
						renderInput={(params) => (
							<TextField
								{...params}
								size="small"
								placeholder="Select or type your source..."
								sx={textFieldSx}
							/>
						)}
					/>
				</Box>

				<Box sx={{ ...helperBox, mt: 3, mb: 0 }}>
					<InfoIcon sx={{ color: 'info.main', mt: 0.25, fontSize: 18 }} />
					<Typography variant="caption" sx={{ color: 'info.main', fontWeight: 600, lineHeight: 1.5 }}>
						This information helps WinVinaya Foundation understand candidate outreach and optimize our training programs.
					</Typography>
				</Box>
			</Paper>
		</Stack>
	);
};

export default BackgroundTrainingTab;
