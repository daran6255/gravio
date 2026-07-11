import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Stack, Grid, TextField, InputAdornment, Button, CircularProgress, alpha, useTheme, type Theme } from '@mui/material';
import {
	AccountTreeOutlined as DeptIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Search as SearchIcon,
	Add as AddIcon,
	AutoAwesome as SeedIcon,
	PersonOutline as PersonIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchDepartments, deleteDepartment, createDepartment } from '../../../../store/slices/hrSlice';
import type { HRDepartmentListItem } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import ContextMenu, { type ActionMenuItem } from '../../../common/action-menu/ContextMenu';
import { ConfirmationDialog } from '../../../common/dialogbox';
import EnterpriseAvatar from '../../../common/avatar/Avatar';
import DepartmentDialog from './DepartmentDialog';

const DEFAULT_DEPARTMENTS: Array<{ name: string; description: string }> = [
	{ name: 'Engineering', description: 'Software development, DevOps & cloud architecture.' },
	{ name: 'Human Resources', description: 'Talent acquisition, onboarding & employee relations.' },
	{ name: 'Finance', description: 'Accounting, budgeting & financial planning.' },
	{ name: 'Marketing', description: 'Brand strategy, digital marketing & content.' },
	{ name: 'Sales', description: 'Business development & client relationships.' },
	{ name: 'Operations', description: 'Process management, logistics & facilities.' },
];

const ACCENTS = ['primary', 'info', 'success', 'warning', 'error'] as const;

const getAccent = (theme: Theme, idx: number) => theme.palette[ACCENTS[idx % ACCENTS.length]].main;

export const DepartmentsPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const { departments, departmentsLoading: loading } = useAppSelector((state) => state.hr);

	const [searchTerm, setSearchTerm] = useState('');

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HRDepartmentListItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<HRDepartmentListItem | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [seeding, setSeeding] = useState(false);

	useEffect(() => {
		dispatch(fetchDepartments(true));
	}, [dispatch]);

	const filtered = useMemo(() => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return departments;
		return departments.filter((d) => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q));
	}, [departments, searchTerm]);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await dispatch(deleteDepartment(deleteTarget.id)).unwrap();
			success('Department deleted');
			setDeleteTarget(null);
		} catch {
			error('Failed to delete department');
		} finally {
			setDeleting(false);
		}
	};

	const handleSeedDefaults = async () => {
		setSeeding(true);
		try {
			for (const dept of DEFAULT_DEPARTMENTS) {
				await dispatch(createDepartment({ name: dept.name, description: dept.description, parent_id: null, head_user_id: null })).unwrap();
			}
			success('Default departments added');
		} catch {
			error('Some default departments could not be added');
		} finally {
			setSeeding(false);
		}
	};

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				justifyContent="space-between"
				alignItems={{ xs: 'stretch', sm: 'center' }}
				spacing={2}
				sx={{ mb: 3.5 }}
			>
				<TextField
					placeholder="Search departments…"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					size="small"
					sx={{
						maxWidth: { xs: '100%', sm: 320 },
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
					New Department
				</Button>
			</Stack>

			{!loading && filtered.length === 0 ? (
				<Box sx={{ py: 8, textAlign: 'center' }}>
					<Typography color="text.secondary" sx={{ fontStyle: 'italic', mb: searchTerm ? 0 : 2.5 }}>
						{searchTerm ? 'No departments match your search.' : 'No departments yet — create your first one to structure your organization.'}
					</Typography>
					{!searchTerm && (
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
							{seeding ? 'Adding Departments…' : 'Add Default Departments'}
						</Button>
					)}
				</Box>
			) : (
				<Grid container spacing={2.5}>
					{(loading ? Array.from({ length: 8 }) : filtered).map((dept, idx) => {
						if (loading || !dept) {
							return (
								<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={idx}>
									<Box sx={{ height: 210, borderRadius: '20px', bgcolor: alpha(theme.palette.text.primary, 0.04) }} />
								</Grid>
							);
						}
						const d = dept as HRDepartmentListItem;
						const accent = getAccent(theme, idx);
						const menuActions: ActionMenuItem[] = [
							{ label: 'Edit Department', icon: <EditIcon fontSize="small" />, onClick: () => { setEditTarget(d); setDialogOpen(true); } },
							{ label: 'Delete Department', icon: <DeleteIcon fontSize="small" />, color: theme.palette.error.main, onClick: () => setDeleteTarget(d) },
						];

						return (
							<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={d.id}>
								<Box
									sx={{
										position: 'relative',
										height: '100%',
										p: 2.25,
										borderRadius: '20px',
										overflow: 'hidden',
										bgcolor: theme.palette.background.paper,
										boxShadow: isDark
											? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.25)'
											: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
										border: '1px solid',
										borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
										transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
										display: 'flex',
										flexDirection: 'column',
										'&:hover': {
											borderColor: alpha(accent, 0.4),
											boxShadow: `0 16px 32px ${alpha(accent, 0.16)}`,
											transform: 'translateY(-4px)',
										},
									}}
								>
									<Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.75 }}>
										<Box sx={{
											width: 40, height: 40, borderRadius: '12px',
											display: 'flex', alignItems: 'center', justifyContent: 'center',
											background: `linear-gradient(135deg, ${alpha(accent, 0.22)} 0%, ${alpha(accent, 0.08)} 100%)`,
											color: accent,
										}}>
											<DeptIcon sx={{ fontSize: '1.15rem' }} />
										</Box>
										<Stack direction="row" spacing={0.5} alignItems="center">
											{d.is_active && (
												<Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 0.5 }}>
													<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.18)}` }} />
													<Typography variant="caption" fontWeight={800} color="success.main" sx={{ textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.04em' }}>
														Active
													</Typography>
												</Stack>
											)}
											<ContextMenu actions={menuActions} triggerTooltip="Department Actions" size="small" />
										</Stack>
									</Stack>

									<Typography variant="subtitle1" fontWeight={800} noWrap sx={{ letterSpacing: '-0.01em' }}>{d.name}</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{
											mt: 0.4, mb: 1.75, minHeight: '2.2em', lineHeight: 1.5,
											display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
										}}
									>
										{d.description || 'No description provided.'}
									</Typography>

									<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
										{d.head_user_name ? (
											<>
												<EnterpriseAvatar name={d.head_user_name} size={22} />
												<Typography variant="caption" color="text.secondary" noWrap sx={{ fontWeight: 600 }}>
													<Typography component="span" variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>Lead:</Typography>
													{d.head_user_name}
												</Typography>
											</>
										) : (
											<Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.disabled' }}>
												<PersonIcon sx={{ fontSize: '0.95rem' }} />
												<Typography variant="caption" sx={{ fontStyle: 'italic' }}>No department lead yet</Typography>
											</Stack>
										)}
									</Stack>

									<Stack
										direction="row"
										sx={{
											mt: 'auto', borderRadius: '14px',
											bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.025)',
											overflow: 'hidden',
										}}
									>
										<Box sx={{ flex: 1, py: 1, px: 1.5 }}>
											<Typography variant="h6" fontWeight={800} lineHeight={1.2}>{d.employee_count ?? 0}</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em' }}>
												Staff
											</Typography>
										</Box>
										<Box sx={{ width: '1px', my: 1, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }} />
										<Box sx={{ flex: 1, py: 1, px: 1.5 }}>
											<Typography variant="h6" fontWeight={800} lineHeight={1.2} color={accent}>{d.designation_count ?? 0}</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em' }}>
												Roles
											</Typography>
										</Box>
									</Stack>
								</Box>
							</Grid>
						);
					})}
				</Grid>
			)}

			<DepartmentDialog
				open={dialogOpen}
				onClose={() => { setDialogOpen(false); setEditTarget(null); }}
				existing={editTarget}
				departments={departments}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleConfirmDelete}
				title="Delete Department"
				message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>
		</Box>
	);
};

export default DepartmentsPanel;
