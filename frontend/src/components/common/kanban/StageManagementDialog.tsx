import React, { useEffect, useState } from 'react';
import {
	Box,
	TextField,
	Button,
	IconButton,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	Tooltip,
	Chip,
	MenuItem,
	useTheme,
	alpha,
} from '@mui/material';
import { Add, DeleteOutline, ArrowUpward, ArrowDownward, AutoAwesomeOutlined, WorkspacesOutlined } from '@mui/icons-material';
import BaseDialog from '../dialogbox/BaseDialog';

export interface StageItem {
	id?: number | string;
	public_id?: string;
	name: string;
	color: string;
	order: number;
	// Deals properties
	probability?: number;
	is_won_stage?: boolean;
	is_lost_stage?: boolean;
	// Projects properties
	is_initial_status?: boolean;
	is_done_status?: boolean;
}

export interface StagePreset {
	key: string;
	label: string;
	stages: StageItem[];
}

interface StageManagementDialogProps {
	open: boolean;
	onClose: () => void;
	title: string;
	subtitle?: string;
	loading: boolean;
	initialItems: StageItem[];
	type: 'deals' | 'projects';
	onSave: (items: StageItem[]) => Promise<void>;
	/** Optional "load preset" options shown above the editable list — picking one replaces
	 *  the in-progress edit (not yet saved) with that preset's stages as a starting point. */
	presets?: StagePreset[];
	/** Key (into `presets`) of the preset linked to the current context — e.g. the template
	 *  the current project was created from. Surfaced as a callout above the generic picker. */
	recommendedPresetKey?: string;
	isReadOnlyStageName?: (item: StageItem) => boolean;
	isDeletableStage?: (item: StageItem) => boolean;
}

export const StageManagementDialog: React.FC<StageManagementDialogProps> = ({
	open,
	onClose,
	title,
	subtitle,
	loading,
	initialItems,
	type,
	onSave,
	presets,
	recommendedPresetKey,
	isReadOnlyStageName,
	isDeletableStage,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [items, setItems] = useState<StageItem[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [presetKey, setPresetKey] = useState('');

	useEffect(() => {
		if (open) {
			setItems(initialItems.map((item) => ({ ...item })));
			setError(null);
			setPresetKey('');
		}
	}, [open, initialItems]);

	const handleLoadPreset = (key: string) => {
		setPresetKey(key);
		const preset = presets?.find((p) => p.key === key);
		if (preset) {
			setItems(preset.stages.map((s, i) => ({ ...s, order: i })));
		}
	};

	const recommendedPreset = presets?.find((p) => p.key === recommendedPresetKey);

	const updateItem = (index: number, patch: Partial<StageItem>) => {
		setItems((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
	};

	const removeItem = (index: number) => {
		setItems((prev) => prev.filter((_, i) => i !== index));
	};

	const addItem = () => {
		const newOrder = items.length;
		const newItem: StageItem = {
			name: '',
			order: newOrder,
			color: '#808080',
			...(type === 'deals'
				? { probability: 10, is_won_stage: false, is_lost_stage: false }
				: { is_initial_status: false, is_done_status: false }),
		};
		setItems((prev) => [...prev, newItem]);
	};

	const moveItem = (index: number, direction: -1 | 1) => {
		setItems((prev) => {
			const next = [...prev];
			const target = index + direction;
			if (target < 0 || target >= next.length) return prev;
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});
	};

	const handleSaveClick = async () => {
		if (items.some((s) => !s.name.trim())) {
			setError('Every row needs a name');
			return;
		}
		setError(null);
		try {
			await onSave(items.map((s, i) => ({ ...s, order: i })));
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to save stages');
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={title}
			subtitle={subtitle}
			maxWidth="md"
			loading={loading}
			actions={
				<>
					<Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSaveClick}
						disabled={loading}
						sx={{
							textTransform: 'none',
							fontWeight: 700,
							borderRadius: '10px',
							px: 3,
							background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
							color: 'white',
							boxShadow: 'none',
							'&:hover': { boxShadow: '0 4px 12px rgba(139,124,246,0.3)' }
						}}
					>
						{loading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
					</Button>
				</>
			}
		>
			<Stack spacing={2}>
				{error && (
					<Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>
				)}

				{recommendedPreset && type !== 'projects' && (
					<Box
						sx={{
							p: 1.75,
							borderRadius: '12px',
							border: '1px solid',
							borderColor: isDark ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.success.main, 0.25),
							bgcolor: isDark ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.success.main, 0.05),
						}}
					>
						<Stack direction="row" spacing={1.25} alignItems="center">
							<Box
								sx={{
									width: 32,
									height: 32,
									borderRadius: '9px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
									bgcolor: alpha(theme.palette.success.main, 0.15),
									color: 'success.main',
								}}
							>
								<WorkspacesOutlined sx={{ fontSize: 18 }} />
							</Box>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
									Linked to this project's template
								</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
									This project was created from the <strong>{recommendedPreset.label}</strong> template. Apply its matching stage preset below.
								</Typography>
							</Box>
							<Button
								variant="contained"
								size="small"
								onClick={() => handleLoadPreset(recommendedPreset.key)}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '9px',
									flexShrink: 0,
									bgcolor: 'success.main',
									boxShadow: 'none',
									'&:hover': { bgcolor: 'success.dark', boxShadow: 'none' },
								}}
							>
								Apply {recommendedPreset.label}
							</Button>
						</Stack>
					</Box>
				)}

				{presets && presets.length > 0 && type !== 'projects' && (
					<Box
						sx={{
							p: 1.75,
							borderRadius: '12px',
							border: '1px solid',
							borderColor: isDark ? alpha(theme.palette.primary.main, 0.25) : alpha(theme.palette.primary.main, 0.18),
							bgcolor: isDark ? alpha(theme.palette.primary.main, 0.06) : alpha(theme.palette.primary.main, 0.04),
						}}
					>
						<Stack direction="row" spacing={1.25} alignItems="flex-start">
							<Box
								sx={{
									width: 32,
									height: 32,
									borderRadius: '9px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
									bgcolor: alpha(theme.palette.primary.main, 0.12),
									color: 'primary.main',
								}}
							>
								<AutoAwesomeOutlined sx={{ fontSize: 18 }} />
							</Box>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
									Start from a category preset
								</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
									Loads a suggested default list below — review, tweak, then Save to apply.
								</Typography>
								<TextField
									select
									value={presetKey}
									onChange={(e) => handleLoadPreset(e.target.value)}
									size="small"
									fullWidth
									SelectProps={{
										displayEmpty: true,
										renderValue: (v) => {
											const label = presets.find((p) => p.key === v)?.label;
											return <span>{label || 'Choose a category…'}</span>;
										},
									}}
									sx={{
										maxWidth: 280,
										'& .MuiOutlinedInput-root': {
											borderRadius: '9px',
											bgcolor: theme.palette.background.paper,
										}
									}}
								>
									{presets.map((p) => (
										<MenuItem key={p.key} value={p.key}>{p.label}</MenuItem>
									))}
								</TextField>
							</Box>
						</Stack>
					</Box>
				)}

				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
						{type === 'deals' ? 'Pipeline Stages' : 'Workflow Statuses'}
					</Typography>
					{items.length > 0 && (
						<Chip
							label={`${items.length} ${items.length === 1 ? 'stage' : 'stages'}`}
							size="small"
							sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: 'action.hover', color: 'text.secondary' }}
						/>
					)}
				</Stack>

				<Stack spacing={1}>
					{items.map((item, index) => (
						<Stack
							key={index}
							direction="row"
							spacing={1.75}
							alignItems="center"
							sx={{
								p: 1.5,
								borderRadius: '14px',
								bgcolor: theme.palette.background.paper,
								border: '1px solid',
								borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
								boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.18)' : '0 2px 10px rgba(15,23,42,0.03)',
								transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
								'&:hover': {
									borderColor: alpha(theme.palette.primary.main, 0.3),
									boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(15,23,42,0.06)',
								}
							}}
						>
							{/* Order + color — a numbered swatch doubling as the reorder anchor */}
							<Box sx={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
								<Box
									component="label"
									htmlFor={`stage-color-input-${index}`}
									sx={{
										width: '100%',
										height: '100%',
										borderRadius: '10px',
										bgcolor: item.color,
										color: '#ffffff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontWeight: 800,
										fontSize: '0.8rem',
										cursor: (isReadOnlyStageName && isReadOnlyStageName(item)) ? 'default' : 'pointer',
										boxShadow: `0 0 0 1px ${alpha('#000', 0.08)}, 0 2px 6px ${alpha(item.color, 0.35)}`,
									}}
								>
									{index + 1}
								</Box>
								<input
									id={`stage-color-input-${index}`}
									type="color"
									value={item.color}
									disabled={isReadOnlyStageName ? isReadOnlyStageName(item) : false}
									onChange={(e) => updateItem(index, { color: e.target.value })}
									style={{ display: 'none' }}
								/>
							</Box>

							{/* Stage Name */}
							<TextField
								value={item.name}
								onChange={(e) => updateItem(index, { name: e.target.value })}
								placeholder={type === 'deals' ? 'Stage name' : 'Status name'}
								size="small"
								disabled={isReadOnlyStageName ? isReadOnlyStageName(item) : false}
								sx={{
									flex: 1,
									minWidth: 120,
									'& .MuiOutlinedInput-root': {
										borderRadius: '10px',
										bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)',
										'& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
									}
								}}
							/>

							{/* Win Percentage (Deals only) */}
							{type === 'deals' && (
								<TextField
									value={item.probability ?? 0}
									onChange={(e) => updateItem(index, { probability: Number(e.target.value) })}
									type="number"
									label="Win %"
									size="small"
									sx={{
										width: 84,
										flexShrink: 0,
										'& .MuiOutlinedInput-root': {
											borderRadius: '10px',
											bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)',
										}
									}}
									inputProps={{ min: 0, max: 100 }}
								/>
							)}

							{/* Toggle Chips */}
							<Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
								{type === 'deals' ? (
									<>
										<Tooltip title="Deals reaching this stage count as Won" arrow>
											<Chip
												label="Won"
												size="small"
												onClick={() => updateItem(index, { is_won_stage: !item.is_won_stage, is_lost_stage: false })}
												variant={item.is_won_stage ? 'filled' : 'outlined'}
												sx={{
													fontWeight: 700,
													borderRadius: '8px',
													minWidth: 54,
													...(item.is_won_stage ? {
														bgcolor: isDark ? 'rgba(46, 125, 50, 0.22)' : 'success.main',
														color: isDark ? '#a5d6a7' : '#ffffff',
														borderColor: 'transparent',
													} : { color: 'text.secondary', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' })
												}}
											/>
										</Tooltip>

										<Tooltip title="Deals reaching this stage count as Lost" arrow>
											<Chip
												label="Lost"
												size="small"
												onClick={() => updateItem(index, { is_lost_stage: !item.is_lost_stage, is_won_stage: false })}
												variant={item.is_lost_stage ? 'filled' : 'outlined'}
												sx={{
													fontWeight: 700,
													borderRadius: '8px',
													minWidth: 54,
													...(item.is_lost_stage ? {
														bgcolor: isDark ? 'rgba(211, 47, 47, 0.22)' : 'error.main',
														color: isDark ? '#ff9e80' : '#ffffff',
														borderColor: 'transparent',
													} : { color: 'text.secondary', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' })
												}}
											/>
										</Tooltip>
									</>
								) : (
									<>
										<Tooltip title="New tasks start in this status" arrow>
											<Chip
												label="Initial"
												size="small"
												onClick={() => updateItem(index, { is_initial_status: !item.is_initial_status })}
												variant={item.is_initial_status ? 'filled' : 'outlined'}
												sx={{
													fontWeight: 700,
													borderRadius: '8px',
													minWidth: 54,
													...(item.is_initial_status ? {
														bgcolor: isDark ? 'rgba(237, 108, 2, 0.22)' : 'warning.main',
														color: isDark ? '#ffe082' : '#ffffff',
														borderColor: 'transparent',
													} : { color: 'text.secondary', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' })
												}}
											/>
										</Tooltip>

										<Tooltip title="Tasks reaching this status count as complete" arrow>
											<Chip
												label="Done"
												size="small"
												onClick={() => updateItem(index, { is_done_status: !item.is_done_status })}
												variant={item.is_done_status ? 'filled' : 'outlined'}
												sx={{
													fontWeight: 700,
													borderRadius: '8px',
													minWidth: 54,
													...(item.is_done_status ? {
														bgcolor: isDark ? 'rgba(46, 125, 50, 0.22)' : 'success.main',
														color: isDark ? '#a5d6a7' : '#ffffff',
														borderColor: 'transparent',
													} : { color: 'text.secondary', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' })
												}}
											/>
										</Tooltip>
									</>
								)}
							</Stack>

							{/* Reorder + Delete */}
							<Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0 }}>
								<Stack
									sx={{
										bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
										borderRadius: '8px',
									}}
								>
									<Tooltip title="Move up" arrow>
										<span>
											<IconButton size="small" disabled={index === 0} onClick={() => moveItem(index, -1)} sx={{ p: 0.4, borderRadius: '8px 8px 0 0' }}>
												<ArrowUpward sx={{ fontSize: '0.85rem' }} />
											</IconButton>
										</span>
									</Tooltip>
									<Tooltip title="Move down" arrow>
										<span>
											<IconButton size="small" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} sx={{ p: 0.4, borderRadius: '0 0 8px 8px' }}>
												<ArrowDownward sx={{ fontSize: '0.85rem' }} />
											</IconButton>
										</span>
									</Tooltip>
								</Stack>

								<Tooltip title="Remove" arrow>
									<span>
										<IconButton
											size="small"
											onClick={() => removeItem(index)}
											disabled={isDeletableStage ? !isDeletableStage(item) : false}
											sx={{
												color: 'error.main',
												bgcolor: isDark ? 'rgba(211, 47, 47, 0.05)' : 'rgba(211, 47, 47, 0.03)',
												'&:hover': {
													bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
												}
											}}
										>
											<DeleteOutline fontSize="small" />
										</IconButton>
									</span>
								</Tooltip>
							</Stack>
						</Stack>
					))}
				</Stack>

				{/* Add Stage (Dashed Outline) */}
				<Button
					variant="outlined"
					startIcon={<Add />}
					onClick={addItem}
					fullWidth
					sx={{
						textTransform: 'none',
						fontWeight: 700,
						borderRadius: '12px',
						borderStyle: 'dashed',
						borderWidth: '1.5px',
						py: 1,
						borderColor: isDark ? 'rgba(255,255,255,0.15)' : alpha(theme.palette.primary.main, 0.35),
						color: 'text.secondary',
						'&:hover': {
							borderStyle: 'dashed',
							borderWidth: '1.5px',
							borderColor: 'primary.main',
							color: 'primary.main',
							bgcolor: alpha(theme.palette.primary.main, 0.04),
						}
					}}
				>
					{type === 'deals' ? 'Add Stage' : 'Add Status'}
				</Button>

				{items.length === 0 && (
					<Stack spacing={1} alignItems="center" sx={{ py: 5 }}>
						<Box
							sx={{
								width: 48,
								height: 48,
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: 'action.selected',
								color: 'text.secondary',
							}}
						>
							<WorkspacesOutlined sx={{ fontSize: 22 }} />
						</Box>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
							{type === 'deals' ? 'This pipeline has no stages' : 'No workflow statuses yet'}
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ maxWidth: 320, textAlign: 'center' }}>
							{type === 'deals'
								? 'Add at least one stage to start moving deals through this pipeline.'
								: 'Add at least one status — or load a category preset above — to start creating tasks.'}
						</Typography>
					</Stack>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default StageManagementDialog;
