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
	useTheme,
} from '@mui/material';
import { Add, DeleteOutline, ArrowUpward, ArrowDownward } from '@mui/icons-material';
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

interface StageManagementDialogProps {
	open: boolean;
	onClose: () => void;
	title: string;
	subtitle?: string;
	loading: boolean;
	initialItems: StageItem[];
	type: 'deals' | 'projects';
	onSave: (items: StageItem[]) => Promise<void>;
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
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [items, setItems] = useState<StageItem[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setItems(initialItems.map((item) => ({ ...item })));
			setError(null);
		}
	}, [open, initialItems]);

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
			<Stack spacing={1.5}>
				{error && <Alert severity="error">{error}</Alert>}

				{items.map((item, index) => (
					<Stack
						key={index}
						direction="row"
						spacing={2}
						alignItems="center"
						sx={{
							p: 1.5,
							borderRadius: '12px',
							bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
							border: '1px solid',
							borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
							transition: 'all 0.2s ease',
							'&:hover': {
								bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
								borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
							}
						}}
					>
						{/* Reorder Buttons (Horizontal pill) */}
						<Stack
							direction="row"
							spacing={0.25}
							sx={{
								bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
								borderRadius: '8px',
								p: 0.25,
								alignItems: 'center',
								flexShrink: 0
							}}
						>
							<IconButton
								size="small"
								disabled={index === 0}
								onClick={() => moveItem(index, -1)}
								sx={{ p: 0.5 }}
							>
								<ArrowUpward sx={{ fontSize: '0.9rem' }} />
							</IconButton>
							<IconButton
								size="small"
								disabled={index === items.length - 1}
								onClick={() => moveItem(index, 1)}
								sx={{ p: 0.5 }}
							>
								<ArrowDownward sx={{ fontSize: '0.9rem' }} />
							</IconButton>
						</Stack>

						{/* Circle Swatch Color Trigger */}
						<Box sx={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
							<Box
								sx={{
									width: 28,
									height: 28,
									borderRadius: '50%',
									bgcolor: item.color,
									cursor: 'pointer',
									border: '2px solid #ffffff',
									boxShadow: '0 0 0 1px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
								}}
								component="label"
								htmlFor={`stage-color-input-${index}`}
							/>
							<input
								id={`stage-color-input-${index}`}
								type="color"
								value={item.color}
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
							sx={{
								flex: 1,
								'& .MuiOutlinedInput-root': {
									borderRadius: '10px',
									bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
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
									width: 90,
									'& .MuiOutlinedInput-root': {
										borderRadius: '10px',
										bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
									}
								}}
								inputProps={{ min: 0, max: 100 }}
							/>
						)}

						{/* Toggle Chips */}
						<Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
							{type === 'deals' ? (
								<>
									<Tooltip title="Deals reaching this stage count as Won" arrow>
										<Chip
											label="Won"
											size="small"
											onClick={() => updateItem(index, { is_won_stage: !item.is_won_stage, is_lost_stage: false })}
											color={item.is_won_stage ? 'success' : 'default'}
											variant={item.is_won_stage ? 'filled' : 'outlined'}
											sx={{
												fontWeight: 700,
												borderRadius: '8px',
												minWidth: 54,
												...(item.is_won_stage ? {
													bgcolor: isDark ? 'rgba(46, 125, 50, 0.22)' : 'success.main',
													color: isDark ? '#a5d6a7' : '#ffffff',
												} : {})
											}}
										/>
									</Tooltip>

									<Tooltip title="Deals reaching this stage count as Lost" arrow>
										<Chip
											label="Lost"
											size="small"
											onClick={() => updateItem(index, { is_lost_stage: !item.is_lost_stage, is_won_stage: false })}
											color={item.is_lost_stage ? 'error' : 'default'}
											variant={item.is_lost_stage ? 'filled' : 'outlined'}
											sx={{
												fontWeight: 700,
												borderRadius: '8px',
												minWidth: 54,
												...(item.is_lost_stage ? {
													bgcolor: isDark ? 'rgba(211, 47, 47, 0.22)' : 'error.main',
													color: isDark ? '#ff9e80' : '#ffffff',
												} : {})
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
											color={item.is_initial_status ? 'warning' : 'default'}
											variant={item.is_initial_status ? 'filled' : 'outlined'}
											sx={{
												fontWeight: 700,
												borderRadius: '8px',
												minWidth: 54,
												...(item.is_initial_status ? {
													bgcolor: isDark ? 'rgba(237, 108, 2, 0.22)' : 'warning.main',
													color: isDark ? '#ffe082' : '#ffffff',
												} : {})
											}}
										/>
									</Tooltip>

									<Tooltip title="Tasks reaching this status count as complete" arrow>
										<Chip
											label="Done"
											size="small"
											onClick={() => updateItem(index, { is_done_status: !item.is_done_status })}
											color={item.is_done_status ? 'success' : 'default'}
											variant={item.is_done_status ? 'filled' : 'outlined'}
											sx={{
												fontWeight: 700,
												borderRadius: '8px',
												minWidth: 54,
												...(item.is_done_status ? {
													bgcolor: isDark ? 'rgba(46, 125, 50, 0.22)' : 'success.main',
													color: isDark ? '#a5d6a7' : '#ffffff',
												} : {})
											}}
										/>
									</Tooltip>
								</>
							)}
						</Stack>

						{/* Delete button */}
						<IconButton
							size="small"
							onClick={() => removeItem(index)}
							color="error"
							sx={{
								bgcolor: isDark ? 'rgba(211, 47, 47, 0.05)' : 'rgba(211, 47, 47, 0.03)',
								'&:hover': {
									bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
								}
							}}
						>
							<DeleteOutline fontSize="small" />
						</IconButton>
					</Stack>
				))}

				{/* Add Stage (Dashed Outline) */}
				<Box sx={{ pt: 1 }}>
					<Button
						variant="outlined"
						startIcon={<Add />}
						onClick={addItem}
						sx={{
							textTransform: 'none',
							fontWeight: 700,
							borderRadius: '10px',
							borderStyle: 'dashed',
							borderWidth: '1.5px',
							py: 0.75,
							px: 2,
							borderColor: 'primary.main',
							'&:hover': {
								borderStyle: 'dashed',
								borderWidth: '1.5px',
							}
						}}
					>
						{type === 'deals' ? 'Add Stage' : 'Add Status'}
					</Button>
				</Box>

				{items.length === 0 && (
					<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
						{type === 'deals'
							? 'This pipeline has no stages. Add at least one to use it.'
							: 'No task statuses configured yet. Add at least one to create tasks.'}
					</Typography>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default StageManagementDialog;
