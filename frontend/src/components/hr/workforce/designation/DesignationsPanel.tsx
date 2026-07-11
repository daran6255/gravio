import React, { useState, useEffect, useMemo } from 'react';
import {
	Box, Typography, Stack, TextField, InputAdornment, Button, FormControl, Select, MenuItem,
	LinearProgress, CircularProgress, alpha, useTheme, type Theme,
} from '@mui/material';
import {
	Search as SearchIcon,
	Add as AddIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	WorkOutline as DesignationIcon,
	AccountTreeOutlined as HierarchyIcon,
	AutoAwesome as SeedIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchDesignations, deleteDesignation, fetchDepartments, createDesignation } from '../../../../store/slices/hrSlice';
import type { HRDesignationListItem } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import ContextMenu, { type ActionMenuItem } from '../../../common/action-menu/ContextMenu';
import { ConfirmationDialog } from '../../../common/dialogbox';
import DesignationDialog from './DesignationDialog';

const ACCENTS = ['primary', 'info', 'success', 'warning', 'secondary', 'error'] as const;
const getAccent = (theme: Theme, idx: number) => theme.palette[ACCENTS[idx % ACCENTS.length]].main;

const DEFAULT_DESIGNATIONS: Array<{ name: string; grade: string; description: string }> = [
	{ name: 'Software Engineer', grade: 'L2', description: 'Full-stack development and feature delivery.' },
	{ name: 'Senior Software Engineer', grade: 'L3', description: 'Technical leadership within engineering pods.' },
	{ name: 'HR Manager', grade: 'L3', description: 'Oversees recruitment, onboarding & employee relations.' },
	{ name: 'Financial Analyst', grade: 'L2', description: 'Budgeting, reporting & financial planning support.' },
	{ name: 'Marketing Specialist', grade: 'L2', description: 'Campaign execution and brand communications.' },
	{ name: 'Sales Executive', grade: 'L2', description: 'Client acquisition and relationship management.' },
	{ name: 'Operations Associate', grade: 'L1', description: 'Day-to-day operational and logistics support.' },
	{ name: 'Product Manager', grade: 'L3', description: 'Owns product roadmap and cross-functional delivery.' },
];

export const DesignationsPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();
	const { error, success } = useToast();
	const { designations, designationsLoading: loading, departments } = useAppSelector((state) => state.hr);

	const [searchTerm, setSearchTerm] = useState('');
	const [deptFilter, setDeptFilter] = useState<number | ''>('');

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HRDesignationListItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<HRDesignationListItem | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [seeding, setSeeding] = useState(false);

	useEffect(() => {
		dispatch(fetchDepartments(undefined));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchDesignations(deptFilter as number | undefined)).unwrap().catch(() => error('Failed to load designations'));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, deptFilter]);

	const filtered = useMemo(() => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return designations;
		return designations.filter((d) => d.name.toLowerCase().includes(q) || d.grade?.toLowerCase().includes(q));
	}, [designations, searchTerm]);

	const gradeStats = useMemo(() => {
		const counts = new Map<string, number>();
		designations.forEach((d) => {
			const key = d.grade?.trim() || 'Ungraded';
			counts.set(key, (counts.get(key) || 0) + 1);
		});
		return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
	}, [designations]);

	const total = designations.length;
	const filledCount = designations.filter((d) => d.employee_count > 0).length;
	const filledPct = total ? Math.round((filledCount / total) * 100) : 0;
	const vacantPct = total ? 100 - filledPct : 0;

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await dispatch(deleteDesignation(deleteTarget.id)).unwrap();
			success('Designation deleted');
			setDeleteTarget(null);
		} catch {
			error('Failed to delete designation');
		} finally {
			setDeleting(false);
		}
	};

	const handleSeedDefaults = async () => {
		setSeeding(true);
		try {
			for (const desig of DEFAULT_DESIGNATIONS) {
				await dispatch(createDesignation({ name: desig.name, grade: desig.grade, description: desig.description, department_id: null })).unwrap();
			}
			success('Default designations added');
		} catch {
			error('Some default designations could not be added');
		} finally {
			setSeeding(false);
		}
	};

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				justifyContent="space-between"
				alignItems={{ xs: 'stretch', md: 'center' }}
				spacing={2}
				sx={{ mb: 3 }}
			>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flex: 1 }}>
					<TextField
						placeholder="Search designations…"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						size="small"
						sx={{
							maxWidth: { xs: '100%', sm: 280 },
							'& .MuiOutlinedInput-root': {
								borderRadius: '999px',
								bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
								'& fieldset': { borderColor: 'transparent' },
								'&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.3) },
								'&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}` },
								'&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
							},
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
								</InputAdornment>
							),
						}}
					/>
					<FormControl size="small" sx={{ minWidth: 190 }}>
						<Select
							value={deptFilter}
							displayEmpty
							onChange={(e) => setDeptFilter(e.target.value as number | '')}
							sx={{
								borderRadius: '999px',
								bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
								'& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
							}}
						>
							<MenuItem value="">All Departments</MenuItem>
							{departments.map((dep) => <MenuItem key={dep.id} value={dep.id}>{dep.name}</MenuItem>)}
						</Select>
					</FormControl>
				</Stack>

				<Stack direction="row" spacing={1.5} alignItems="center">
					<Box sx={{
						px: 2, py: 0.75, borderRadius: '999px',
						bgcolor: alpha(theme.palette.primary.main, 0.1),
						display: 'flex', alignItems: 'baseline', gap: 0.75,
					}}>
						<Typography variant="subtitle2" fontWeight={800} color="primary.main">{total}</Typography>
						<Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.04em' }}>
							Total Titles
						</Typography>
					</Box>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() => { setEditTarget(null); setDialogOpen(true); }}
						sx={{
							color: 'white',
							textTransform: 'none',
							fontWeight: 700,
							borderRadius: '12px',
							px: 2.5,
							boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
							background: theme.gradients.brand,
							'&:hover': { boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}` },
						}}
					>
						New Designation
					</Button>
				</Stack>
			</Stack>

			{total > 0 && (
				<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ mb: 3 }}>
					<Box sx={{
						flex: 2, p: 2.5, borderRadius: '20px',
						bgcolor: theme.palette.background.paper,
						border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
						boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
					}}>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
							<HierarchyIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
							<Typography variant="subtitle2" fontWeight={800}>Grade Distribution</Typography>
						</Stack>
						<Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2.5 }}>
							{gradeStats.map(([grade, count], idx) => {
								const accent = getAccent(theme, idx);
								return (
									<Box key={grade} sx={{ textAlign: 'center', minWidth: 88 }}>
										<Typography variant="h5" fontWeight={800} sx={{ color: idx === 0 ? accent : 'text.primary', opacity: idx === 0 ? 1 : 0.75 }}>
											{count}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
											noWrap
											sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', maxWidth: 100 }}
										>
											{grade}
										</Typography>
									</Box>
								);
							})}
						</Stack>
					</Box>

					<Box sx={{
						flex: 1, p: 2.5, borderRadius: '20px', minWidth: { lg: 260 },
						bgcolor: theme.palette.background.paper,
						border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
						boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
					}}>
						<Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Coverage</Typography>

						<Stack spacing={0.5} sx={{ mb: 2 }}>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="caption" color="text.secondary" fontWeight={600}>Filled Titles</Typography>
								<Typography variant="caption" fontWeight={800}>{filledPct}%</Typography>
							</Stack>
							<LinearProgress
								variant="determinate"
								value={filledPct}
								sx={{
									height: 6, borderRadius: 3,
									bgcolor: alpha(theme.palette.success.main, 0.12),
									'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'success.main' },
								}}
							/>
						</Stack>

						<Stack spacing={0.5}>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="caption" color="text.secondary" fontWeight={600}>Unfilled Titles</Typography>
								<Typography variant="caption" fontWeight={800}>{vacantPct}%</Typography>
							</Stack>
							<LinearProgress
								variant="determinate"
								value={vacantPct}
								sx={{
									height: 6, borderRadius: 3,
									bgcolor: alpha(theme.palette.warning.main, 0.12),
									'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'warning.main' },
								}}
							/>
						</Stack>

						<Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
							{filledCount} of {total} titles have at least one employee assigned.
						</Typography>
					</Box>
				</Stack>
			)}

			{!loading && filtered.length === 0 ? (
				<Box sx={{ py: 8, textAlign: 'center' }}>
					<Typography color="text.secondary" sx={{ fontStyle: 'italic', mb: searchTerm || deptFilter ? 0 : 2.5 }}>
						{searchTerm || deptFilter ? 'No designations match your filters.' : 'No designations yet — define job titles to assign to employees.'}
					</Typography>
					{!searchTerm && !deptFilter && (
						<Button
							variant="outlined"
							startIcon={seeding ? <CircularProgress size={16} color="inherit" /> : <SeedIcon />}
							onClick={handleSeedDefaults}
							disabled={seeding}
							sx={{
								textTransform: 'none',
								fontWeight: 700,
								borderRadius: '12px',
								borderColor: alpha(theme.palette.primary.main, 0.35),
								color: 'primary.main',
								'&:hover': {
									borderColor: theme.palette.primary.main,
									bgcolor: alpha(theme.palette.primary.main, 0.06),
								},
							}}
						>
							{seeding ? 'Adding Designations…' : 'Add Default Designations'}
						</Button>
					)}
				</Box>
			) : (
				<Stack spacing={1.5}>
					{(loading ? Array.from({ length: 4 }) : filtered).map((desig, idx) => {
						if (loading || !desig) {
							return <Box key={idx} sx={{ height: 84, borderRadius: '18px', bgcolor: alpha(theme.palette.text.primary, 0.04) }} />;
						}
						const d = desig as HRDesignationListItem;
						const accent = getAccent(theme, idx);
						const menuActions: ActionMenuItem[] = [
							{ label: 'Edit Designation', icon: <EditIcon fontSize="small" />, onClick: () => { setEditTarget(d); setDialogOpen(true); } },
							{ label: 'Delete Designation', icon: <DeleteIcon fontSize="small" />, color: theme.palette.error.main, onClick: () => setDeleteTarget(d) },
						];

						return (
							<Box
								key={d.id}
								sx={{
									p: 2, borderRadius: '18px',
									bgcolor: theme.palette.background.paper,
									border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
									boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.35)' : '0 1px 2px rgba(15,23,42,0.04)',
									display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
									transition: 'all 0.2s ease',
									'&:hover': {
										borderColor: alpha(accent, 0.35),
										boxShadow: `0 10px 24px ${alpha(accent, 0.12)}`,
									},
								}}
							>
								<Box sx={{
									width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
									display: 'flex', alignItems: 'center', justifyContent: 'center',
									background: `linear-gradient(135deg, ${alpha(accent, 0.22)} 0%, ${alpha(accent, 0.08)} 100%)`,
									color: accent,
								}}>
									<DesignationIcon sx={{ fontSize: '1.1rem' }} />
								</Box>

								<Box sx={{ flex: 1, minWidth: 200 }}>
									<Stack direction="row" spacing={1} alignItems="center">
										<Typography variant="body2" fontWeight={800}>{d.name}</Typography>
										{d.department_name && (
											<Typography variant="caption" color="text.disabled">· {d.department_name}</Typography>
										)}
									</Stack>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{
											display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
										}}
									>
										{d.description || 'No description provided.'}
									</Typography>
								</Box>

								<Box sx={{ textAlign: 'center', minWidth: 64 }}>
									<Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
										{String(d.employee_count).padStart(2, '0')}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em' }}>
										Holders
									</Typography>
								</Box>

								<Box sx={{
									px: 1.5, py: 0.5, borderRadius: '999px',
									bgcolor: alpha(theme.palette.text.primary, 0.05),
								}}>
									<Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.68rem' }}>
										{d.grade || 'Ungraded'}
									</Typography>
								</Box>

								<ContextMenu actions={menuActions} triggerTooltip="Designation Actions" size="small" />
							</Box>
						);
					})}
				</Stack>
			)}

			<DesignationDialog
				open={dialogOpen}
				onClose={() => { setDialogOpen(false); setEditTarget(null); }}
				existing={editTarget}
				departments={departments}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleConfirmDelete}
				title="Delete Designation"
				message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>
		</Box>
	);
};

export default DesignationsPanel;
