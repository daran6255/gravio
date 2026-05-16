import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Stack,
	CircularProgress,
	TextField,
	Button,
	Paper,
	useTheme,
	Divider
} from '@mui/material';
import {
	SaveOutlined as SaveIcon,
	LabelOutlined as TagIcon
} from '@mui/icons-material';
import { settingsService, type SystemSetting } from '../../../services/settingsService';
import { useSnackbar } from 'notistack';

const TrainingConfigurationSection: React.FC = () => {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = async () => {
		setLoading(true);
		try {
			const data = await settingsService.getSystemSettings();
			setSystemSettings(data);
		} catch (error) {
			enqueueSnackbar('Failed to load settings', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const batchTagsSetting = systemSettings.find(s => s.key === 'TRAINING_BATCH_TAGS');

	const handleSaveTags = async () => {
		if (!batchTagsSetting) {
			enqueueSnackbar('Setting TRAINING_BATCH_TAGS not found. Please add it manually in the database first.', { variant: 'warning' });
			return;
		}

		setSaving(true);
		try {
			await settingsService.updateSystemSetting(batchTagsSetting.id, { value: batchTagsSetting.value.trim() });
			enqueueSnackbar('Training tags updated successfully', { variant: 'success' });
			loadSettings();
		} catch (error) {
			enqueueSnackbar('Failed to update tags', { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleTagChange = (newValue: string) => {
		setSystemSettings(prev => prev.map(s =>
			s.key === 'TRAINING_BATCH_TAGS' ? { ...s, value: newValue } : s
		));
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
				<CircularProgress size={36} thickness={4} />
				<Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
					Loading configuration...
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'flex-start',
				mb: 4,
				pb: 3,
				borderBottom: '1px solid #f2f3f3'
			}}>
				<Box>
					<Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1c21', mb: 0.5 }}>
						Training Configuration
					</Typography>
					<Typography variant="body2" sx={{ color: '#64748b' }}>
						Manage dropdown values and tags for training modules.
					</Typography>
				</Box>
				<Button
					variant="contained"
					disableElevation
					startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
					onClick={handleSaveTags}
					disabled={saving || !batchTagsSetting}
					sx={{
						bgcolor: theme.palette.primary.main,
						borderRadius: '6px',
						textTransform: 'none',
						fontWeight: 600,
						px: 3
					}}
				>
					Save Changes
				</Button>
			</Box>

			<Stack spacing={4}>
				<Paper
					elevation={0}
					sx={{
						p: 3,
						borderRadius: '8px',
						border: '1px solid #e2e8f0',
						bgcolor: '#ffffff',
						'&:hover': { borderColor: '#cbd5e1' }
					}}
				>
					<Stack spacing={2}>
						<Stack direction="row" spacing={1} alignItems="center">
							<TagIcon sx={{ color: '#ec7211' }} />
							<Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
								Batch Tags
							</Typography>
						</Stack>

						<Typography variant="body2" sx={{ color: '#64748b' }}>
							Define tags that can be assigned to training batches. Enter values separated by commas.
						</Typography>

						<Divider sx={{ my: 1 }} />

						{!batchTagsSetting ? (
							<Box sx={{ p: 3, bgcolor: '#f1faff', borderRadius: '8px', border: '1px solid #007eb9', textAlign: 'center' }}>
								<Typography variant="body2" sx={{ color: '#007eb9', fontWeight: 600, mb: 2 }}>
									Training tags are not yet initialized for this environment.
								</Typography>
								<Button
									variant="contained"
									startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <TagIcon />}
									onClick={async () => {
										setSaving(true);
										try {
											await settingsService.createSystemSetting({
												key: 'TRAINING_BATCH_TAGS',
												value: 'CSR, Internal, Govt, Special',
												description: 'Comma-separated list of tags for training batches',
												is_secret: false
											});
											enqueueSnackbar('Training tags initialized successfully', { variant: 'success' });
											loadSettings();
										} catch (error) {
											enqueueSnackbar('Failed to initialize training tags', { variant: 'error' });
										} finally {
											setSaving(false);
										}
									}}
									disabled={saving}
									sx={{
										bgcolor: '#007eb9',
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: '4px',
										'&:hover': { bgcolor: '#005f8d' }
									}}
								>
									Initialize Batch Tags
								</Button>
								<Typography variant="caption" display="block" sx={{ mt: 1, color: '#64748b' }}>
									This will create a default setting record in the database.
								</Typography>
							</Box>
						) : (
							<Box>
								<TextField
									fullWidth
									multiline
									rows={3}
									placeholder="e.g. CSR, Internal, Govt, Special"
									value={batchTagsSetting.value}
									onChange={(e) => handleTagChange(e.target.value)}
									sx={{ '& .MuiInputBase-root': { borderRadius: '6px' } }}
									helperText="Example: CSR, Govt, Corporate, Trial"
								/>
								<Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
									{batchTagsSetting.value.split(',').map((tag, idx) => {
										const trimmed = tag.trim();
										if (!trimmed) return null;
										return (
											<Box
												key={idx}
												sx={{
													px: 1,
													py: 0.5,
													bgcolor: '#f1faff',
													border: '1px solid #007eb9',
													borderRadius: '4px',
													color: '#007eb9',
													fontSize: '0.75rem',
													fontWeight: 600
												}}
											>
												{trimmed}
											</Box>
										);
									})}
								</Box>
							</Box>
						)}
					</Stack>
				</Paper>

				<Box sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
						Configuration Tip
					</Typography>
					<Typography variant="body2" sx={{ color: '#64748b' }}>
						Changes to these tags will reflect immediately in the Training Batch creation/edit form. Tags already assigned to existing batches will remain but may no longer appear in the dropdown if removed here.
					</Typography>
				</Box>
			</Stack>
		</Box>
	);
};

export default TrainingConfigurationSection;
