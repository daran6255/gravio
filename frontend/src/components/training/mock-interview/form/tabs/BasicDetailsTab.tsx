import React, { memo } from 'react';
import {
	Stack,
	Box,
	Typography,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormHelperText,
	TextField,
	Grid,
	useTheme,
	alpha
} from '@mui/material';
import useDateTime from '../../../../../hooks/useDateTime';
import { type MockInterviewCreate } from '../../../../../models/MockInterview';

interface BasicDetailsTabProps {
	formData: Partial<MockInterviewCreate>;
	errors: Record<string, string>;
	viewMode: boolean;
	isEdit: boolean;
	allocations: any[];
	onChange: (field: keyof MockInterviewCreate, value: any) => void;
}

const BasicDetailsTab: React.FC<BasicDetailsTabProps> = memo(({
	formData,
	errors,
	viewMode,
	isEdit,
	allocations,
	onChange
}) => {
	const theme = useTheme();
	const { formatTime } = useDateTime();

	return (
		<Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto' }}>
			<Box>
				<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 3 }}>
					Evaluation Metadata
				</Typography>
				<Stack spacing={2.5}>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 6 }}>
							<FormControl fullWidth error={!!errors.candidate_id} size="small">
								<InputLabel shrink sx={{ fontWeight: 600 }}>Target Candidate</InputLabel>
								<Select
									value={formData.candidate_id || ''}
									onChange={(e) => onChange('candidate_id', e.target.value)}
									label="Target Candidate"
									disabled={viewMode || isEdit}
									displayEmpty
									sx={{
										bgcolor: 'background.paper',
										borderRadius: 2
									}}
								>
									<MenuItem value="" disabled>Select candidate...</MenuItem>
									{allocations.map((a) => (
										<MenuItem key={a.candidate_id} value={a.candidate_id}>
											{a.candidate?.name}
										</MenuItem>
									))}
								</Select>
								{errors.candidate_id && <FormHelperText>{errors.candidate_id}</FormHelperText>}
							</FormControl>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								label="Evaluated By"
								value={formData.interviewer_name || ''}
								onChange={(e) => onChange('interviewer_name', e.target.value)}
								fullWidth
								size="small"
								disabled={true}
								error={!!errors.interviewer_name}
								helperText={errors.interviewer_name}
								InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
								sx={{
									bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
									'& .MuiOutlinedInput-root': { borderRadius: 2 }
								}}
							/>
						</Grid>
					</Grid>

					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								select
								label="Interview Type"
								value={formData.interview_type || 'internal'}
								onChange={(e) => onChange('interview_type', e.target.value)}
								fullWidth
								size="small"
								disabled={viewMode}
								InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
								sx={{ 
									bgcolor: 'background.paper',
									'& .MuiOutlinedInput-root': { borderRadius: 2 }
								}}
							>
								<MenuItem value="internal">Internal Mock Interview</MenuItem>
								<MenuItem value="external">External Mock Interview</MenuItem>
							</TextField>
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								select
								label="Interview Category"
								value={formData.interview_category || 'domain'}
								onChange={(e) => onChange('interview_category', e.target.value)}
								fullWidth
								size="small"
								disabled={viewMode}
								InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
								sx={{ 
									bgcolor: 'background.paper',
									'& .MuiOutlinedInput-root': { borderRadius: 2 }
								}}
							>
								<MenuItem value="hr">HR Mock</MenuItem>
								<MenuItem value="domain">Domain Mock</MenuItem>
							</TextField>
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								label="Interview Date"
								type="date"
								value={formData.interview_date ? formData.interview_date.split('T')[0] : ''}
								onChange={(e) => onChange('interview_date', e.target.value)}
								fullWidth
								size="small"
								disabled={true}
								error={!!errors.interview_date}
								helperText={errors.interview_date}
								InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
								sx={{
									bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
									'& .MuiOutlinedInput-root': { borderRadius: 2 }
								}}
							/>
						</Grid>
					</Grid>

					{/* Automated Time Tracking */}
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								label="Start Time"
								value={formData.start_time ? formatTime(formData.start_time) : '--:--'}
								fullWidth
								size="small"
								disabled
								InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
								sx={{
									bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
									'& .MuiOutlinedInput-root': { borderRadius: 2 }
								}}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								label="End Time"
								value={formData.end_time ? formatTime(formData.end_time) : '--:--'}
								fullWidth
								size="small"
								disabled
								InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
								sx={{
									bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
									'& .MuiOutlinedInput-root': { borderRadius: 2 }
								}}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								label="Duration (Mins)"
								value={formData.duration_minutes || 0}
								fullWidth
								size="small"
								disabled
								InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
								sx={{
									bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
									'& .MuiOutlinedInput-root': { borderRadius: 2 }
								}}
							/>
						</Grid>
					</Grid>
				</Stack>
			</Box>
		</Stack>
	);
});

BasicDetailsTab.displayName = 'BasicDetailsTab';

export default BasicDetailsTab;
