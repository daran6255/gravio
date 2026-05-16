import React, { useEffect, useMemo } from 'react';
import {
	Typography,
	Stack,
	Grid,
	FormControl,
	Select,
	MenuItem,
	Paper,
	Box,
	Divider,
	TextField,
	Chip,
	useTheme,
	alpha,
	Checkbox
} from '@mui/material';
import {
	AssignmentIndOutlined as StatusIcon,
	LabelOutlined as TagIcon,
	CommentOutlined as RemarkIcon,
	HubOutlined as ConnectionIcon,
	AccountTreeOutlined as WorkflowIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchSystemSettings, fetchFields } from '../../../../store/slices/settingsSlice';
import DynamicFieldRenderer from '../../../common/DynamicFieldRenderer';
import type { CandidateCounselingCreate } from '../../../../models/candidate';

interface CounselingInfoTabProps {
	formData: CandidateCounselingCreate;
	onFieldChange: (field: string, value: unknown) => void;
	onUpdateOtherField: (name: string, value: unknown) => void;
	showErrors?: boolean;
}

const CounselingInfoTab: React.FC<CounselingInfoTabProps> = ({
	formData,
	onFieldChange,
	onUpdateOtherField,
	showErrors = false
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	
	// Store-based data fetching
	const user = useAppSelector((state) => state.auth.user);
	const systemSettings = useAppSelector((state) => state.settings.systemSettings);
	const dynamicFields = useAppSelector((state) => state.settings.fields.counseling || []);
	
	const userRole = user?.role;
	const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager' || userRole === 'sourcing';

	useEffect(() => {
		if (systemSettings.length === 0) {
			dispatch(fetchSystemSettings());
		}
		if (dynamicFields.length === 0) {
			dispatch(fetchFields('counseling'));
		}
	}, [dispatch, systemSettings.length, dynamicFields.length]);

	const batchTags = useMemo(() => {
		const tagSetting = systemSettings.find(s => s.key === 'TRAINING_BATCH_TAGS');
		if (tagSetting) {
			return tagSetting.value.split(',').map(tag => tag.trim()).filter(Boolean);
		}
		return [];
	}, [systemSettings]);

	const inputSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: 0.5,
			bgcolor: 'background.paper',
			'& fieldset': { borderColor: 'divider' },
			'&:hover fieldset': { borderColor: 'text.secondary' },
			'&.Mui-focused fieldset': { borderColor: 'primary.main' }
		}
	};

	return (
		<Stack spacing={4}>
			{/* Core Workflow Section */}
			<Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 0.5 }}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: 0.5, display: 'flex' }}>
						<WorkflowIcon sx={{ color: 'common.white', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Enterprise Counseling Workflow</Typography>
				</Stack>

				<Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04), p: 2, borderRadius: 0.5, mb: 3 }}>
					<Stack direction="row" spacing={2} alignItems="center">
						<StatusIcon sx={{ color: 'primary.main' }} />
						<Box>
							<Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>Execution Status</Typography>
							<Typography variant="caption" color="text.secondary">
								Set the current lifecycle state for this candidate assessment.
							</Typography>
						</Box>
					</Stack>
				</Box>

				<Divider sx={{ mb: 4 }} />

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="awsFieldLabel">Counseling Outcome Status</Typography>
							<FormControl fullWidth size="small">
								<Select
									value={formData.status || 'pending'}
									onChange={(e) => onFieldChange('status', e.target.value)}
									sx={{
										borderRadius: 0.5,
										bgcolor: 'background.paper',
										'& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
										'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
										'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
									}}
									renderValue={(selected) => (
										<Chip 
											label={selected === 'pending' ? 'In Progress' : selected.toUpperCase()} 
											size="small" 
											color={selected === 'selected' ? 'success' : selected === 'rejected' ? 'error' : 'primary'}
											sx={{ borderRadius: 0.5, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
										/>
									)}
								>
									<MenuItem value="pending">
										<Typography variant="body2" sx={{ fontWeight: 600 }}>In Progress</Typography>
									</MenuItem>
									<MenuItem value="selected">
										<Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>Selected</Typography>
									</MenuItem>
									<MenuItem value="rejected">
										<Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>Rejected</Typography>
									</MenuItem>
								</Select>
							</FormControl>
						</Box>
					</Grid>
				</Grid>
			</Paper>

			{/* Administrative Governance Section */}
			{isManagerOrAdmin && (
				<Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 0.5 }}>
					<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
						<Box sx={{ bgcolor: 'secondary.main', p: 0.5, borderRadius: 0.5, display: 'flex' }}>
							<ConnectionIcon sx={{ color: 'common.white', fontSize: 20 }} />
						</Box>
						<Typography variant="awsSectionTitle">Administrative Governance</Typography>
					</Stack>

					<Divider sx={{ mb: 4 }} />

					<Grid container spacing={4}>
						<Grid size={{ xs: 12, md: 6 }}>
							<Box>
								<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
									<TagIcon sx={{ fontSize: 16, color: 'primary.main' }} />
									<Typography variant="awsFieldLabel" sx={{ mb: 0 }}>Strategic Assignment (Batch Tags)</Typography>
								</Stack>
								<FormControl fullWidth size="small">
									<Select
										multiple
										value={formData.assigned_to || []}
										onChange={(e) => onFieldChange('assigned_to', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
										displayEmpty
										renderValue={(selected) => {
											if (!selected || (selected as string[]).length === 0) {
												return <Typography variant="body2" sx={{ color: 'text.secondary' }}>Unassigned</Typography>;
											}
											return (
												<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
													{(selected as string[]).map((value) => (
														<Chip 
															key={value} 
															label={value} 
															size="small" 
															sx={{ 
																bgcolor: 'secondary.main', 
																color: 'common.white',
																height: 20,
																fontSize: '0.65rem',
																fontWeight: 700,
																borderRadius: 0.5
															}} 
														/>
													))}
												</Box>
											);
										}}
										sx={{
											borderRadius: 0.5,
											bgcolor: 'background.paper',
											'& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
											'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
											'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
										}}
									>
										{batchTags.map(tag => (
											<MenuItem key={tag} value={tag}>
												<Checkbox size="small" checked={(formData.assigned_to || []).includes(tag)} />
												<Typography variant="body2">{tag}</Typography>
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Box>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<Box>
								<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
									<RemarkIcon sx={{ fontSize: 16, color: 'primary.main' }} />
									<Typography variant="awsFieldLabel" sx={{ mb: 0 }}>Executive Remarks / Instructions</Typography>
								</Stack>
								<TextField
									fullWidth
									size="small"
									multiline
									rows={3}
									value={formData.remarks || ''}
									onChange={(e) => onFieldChange('remarks', e.target.value)}
									placeholder="Document specific instructions or conditions for this assignment..."
									error={showErrors && (!formData.assigned_to || formData.assigned_to.length === 0) && !formData.remarks}
									helperText={(showErrors && (!formData.assigned_to || formData.assigned_to.length === 0) && !formData.remarks) ? "Administrative remarks are required for unassigned records." : ""}
									sx={inputSx}
								/>
							</Box>
						</Grid>
					</Grid>
				</Paper>
			)}

			{/* Custom Particulars Section */}
			<Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 0.5 }}>
				<DynamicFieldRenderer
					fields={dynamicFields}
					formData={formData.others}
					onUpdateField={onUpdateOtherField}
					sectionTitle="Clinical Assessment Particulars"
				/>
			</Paper>
		</Stack>
	);
};

export default CounselingInfoTab;
