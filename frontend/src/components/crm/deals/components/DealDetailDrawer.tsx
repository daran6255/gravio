import React, { useEffect, useState } from 'react';
import {
	Box, Typography, Stack, IconButton, Tooltip, useTheme, alpha,
	Tabs, Tab, Grid, CircularProgress, Chip, TextField, InputAdornment, Button
} from '@mui/material';
import {
	Edit, DeleteOutline, Business, Person, CalendarToday, LocalOffer
} from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import StatusBadge from '../../../common/badge/StatusBadge';
import { NotesComposer, NotesTimeline } from '../../shared';
import { DealTasksTab } from './DealTasksTab';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchEntityActivities, clearActivities, updateDeal, fetchDealTasks
} from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import crmService from '../../../../services/crmService';
import { MAX_FILE_SIZE_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from '../../../../constants/fileUpload';
import type { Deal } from '../../../../models/crm/deal';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import type { CRMFile } from '../../../../models/crm/crmFile';

interface DealDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	deal: Deal | null;
	owners: CRMOwnerOption[];
	onEdit?: (deal: Deal) => void;
	onDelete?: (deal: Deal) => void;
}

const formatValue = (value: number, currency: string) => {
	try {
		return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
	} catch {
		return `${currency} ${value.toLocaleString()}`;
	}
};

export const DealDetailDrawer: React.FC<DealDetailDrawerProps> = ({
	open, onClose, deal, owners, onEdit, onDelete
}) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();

	const [tab, setTab] = useState(0);
	const [prevDealId, setPrevDealId] = useState<number | undefined>(deal?.id);
	const [files, setFiles] = useState<CRMFile[]>([]);
	const [filesLoading, setFilesLoading] = useState(false);
	const [uploading, setUploading] = useState(false);

	// Editable field states
	const [value, setValue] = useState('');
	const [closeDate, setCloseDate] = useState('');

	if (deal?.id !== prevDealId) {
		setPrevDealId(deal?.id);
		setTab(0);
		setFiles([]);
		if (deal) {
			setValue(deal.value != null ? String(deal.value) : '');
			setCloseDate(deal.close_date || '');
		}
	}

	const { activities, activitiesLoading, companyOptions, contactOptions, pipelines } = useAppSelector((state) => state.crm);

	const loadFiles = async () => {
		if (!deal?.id) return;
		setFilesLoading(true);
		try {
			const res = await crmService.listFiles('deal', deal.id);
			setFiles(res.items);
		} catch (err: any) {
			toast.error('Failed to load files');
		} finally {
			setFilesLoading(false);
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!deal?.id || !e.target.files || e.target.files.length === 0) return;
		const file = e.target.files[0];

		if (file.size > MAX_FILE_SIZE_BYTES) {
			toast.error(`File size exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`);
			e.target.value = '';
			return;
		}
		if (file.type && !ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
			toast.error(`File type "${file.type}" is not allowed`);
			e.target.value = '';
			return;
		}

		setUploading(true);
		try {
			await crmService.uploadFile('deal', deal.id, file);
			toast.success('File uploaded successfully');
			loadFiles();
		} catch (err: any) {
			toast.error(err.response?.data?.error?.message || 'Failed to upload file');
		} finally {
			setUploading(false);
			e.target.value = '';
		}
	};

	const handleFileDelete = async (publicId: string) => {
		try {
			await crmService.deleteFile(publicId);
			toast.success('File deleted successfully');
			setFiles((prev) => prev.filter((f) => f.public_id !== publicId));
		} catch (err: any) {
			toast.error('Failed to delete file');
		}
	};

	const handleSaveValue = () => {
		if (!deal) return;
		const numeric = value ? Number(value) : undefined;
		if (numeric !== deal.value) {
			dispatch(updateDeal({ publicId: deal.public_id, payload: { value: numeric } }));
		}
	};

	const handleSaveCloseDate = () => {
		if (!deal) return;
		if (closeDate !== (deal.close_date || '')) {
			dispatch(updateDeal({ publicId: deal.public_id, payload: { close_date: closeDate || undefined } }));
		}
	};

	useEffect(() => {
		if (open && tab === 1 && deal?.public_id) {
			dispatch(fetchDealTasks(deal.public_id));
		}
	}, [open, tab, deal?.public_id, dispatch]);

	useEffect(() => {
		if (open && tab === 2 && deal?.id) {
			loadFiles();
		}
	}, [open, tab, deal?.id]);

	useEffect(() => {
		if (open && deal) {
			dispatch(fetchEntityActivities({ entityType: 'deal', entityId: deal.id }));
		} else {
			dispatch(clearActivities());
		}
	}, [open, deal, dispatch]);

	if (!deal) return null;

	const company = companyOptions.find((c) => c.id === deal.company_id);
	const contact = contactOptions.find((c) => c.id === deal.contact_id);
	const owner = deal.owner_id != null ? owners.find((o) => o.id === deal.owner_id) : undefined;
	const pipeline = pipelines.find((p) => p.id === deal.pipeline_id);
	const stage = pipeline?.stages.find((s) => s.id === deal.stage_id);
	const displayId = `DL-${String(deal.id).padStart(5, '0')}`;

	const fieldCardSx = {
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		p: 1.75,
	};

	const labelSx = {
		fontWeight: 700,
		color: 'text.secondary',
		textTransform: 'uppercase' as const,
		fontSize: '0.65rem',
		letterSpacing: '0.07em',
		display: 'block' as const,
		mb: 0.5,
	};

	const sectionTitleSx = {
		fontWeight: 800,
		fontSize: '0.7rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.08em',
		color: 'text.primary',
		mb: 1.25,
	};

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={deal.title}
			width={600}
			headerExtra={<StatusBadge label={deal.status} status={deal.status} type="deal" />}
			headerActions={
				<Stack direction="row" spacing={1} sx={{ mr: 1 }}>
					{onEdit && (
						<Tooltip title="Edit Deal">
							<IconButton
								size="small"
								onClick={() => {
									onClose();
									onEdit(deal);
								}}
								sx={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
							>
								<Edit fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
					{onDelete && (
						<Tooltip title="Delete Deal">
							<IconButton
								size="small"
								onClick={() => {
									onClose();
									onDelete(deal);
								}}
								sx={{
									border: '1px solid',
									borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
									color: 'error.main',
									'&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
								}}
							>
								<DeleteOutline fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
				</Stack>
			}
		>
			{/* Sub-header info */}
			<Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
				<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', px: 1, py: 0.3, borderRadius: '4px' }}>
					{displayId}
				</Typography>
				{pipeline && (
					<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
						Pipeline: <strong style={{ color: theme.palette.text.primary }}>{pipeline.name}</strong>
					</Typography>
				)}
				{stage && (
					<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
						Stage: <strong style={{ color: theme.palette.text.primary }}>{stage.name}</strong>
					</Typography>
				)}
			</Stack>

			{/* Tabs Navigation */}
			<Tabs
				value={tab}
				onChange={(_, newValue) => setTab(newValue)}
				variant="fullWidth"
				sx={{
					borderBottom: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
					'& .MuiTab-root': {
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.8rem',
						minHeight: 44,
					}
				}}
			>
				<Tab label="Details" />
				<Tab label="Tasks" />
				<Tab label="Attachments" />
				<Tab label="Notes" />
			</Tabs>

			{/* Scrollable drawer body */}
			<Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
				
				{/* TAB 0: DETAILS */}
				{tab === 0 && (
					<Stack spacing={2.5}>
						
						{/* Deal Financials Cards */}
						<Grid container spacing={2}>
							<Grid size={{ xs: 6 }}>
								<Box sx={{ ...fieldCardSx, p: 2 }}>
									<Typography variant="caption" sx={labelSx}>Deal Value</Typography>
									<Stack direction="row" alignItems="baseline" spacing={0.5}>
										<Typography variant="h6" sx={{ fontWeight: 800 }}>
											{deal.value != null ? formatValue(deal.value, deal.currency) : '—'}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{deal.currency}
										</Typography>
									</Stack>
								</Box>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Box sx={{ ...fieldCardSx, p: 2 }}>
									<Typography variant="caption" sx={labelSx}>Win Probability</Typography>
									<Typography variant="h6" sx={{ fontWeight: 800 }}>
										{deal.probability}%
									</Typography>
								</Box>
							</Grid>
						</Grid>

						{/* Editable Fields Section */}
						<Box sx={fieldCardSx}>
							<Typography variant="caption" sx={sectionTitleSx}>Quick Updates</Typography>
							<Stack direction="row" spacing={2} sx={{ mt: 1 }}>
								<TextField
									label="Deal Value"
									type="number"
									value={value}
									onChange={(e) => setValue(e.target.value)}
									onBlur={handleSaveValue}
									size="small"
									fullWidth
									InputProps={{
										endAdornment: <InputAdornment position="end">{deal.currency}</InputAdornment>,
									}}
								/>
								<TextField
									label="Close Date"
									type="date"
									value={closeDate}
									onChange={(e) => setCloseDate(e.target.value)}
									onBlur={handleSaveCloseDate}
									size="small"
									fullWidth
									InputLabelProps={{ shrink: true }}
								/>
							</Stack>
						</Box>

						{/* Primary Info Fields */}
						<Box sx={fieldCardSx}>
							<Typography variant="caption" sx={sectionTitleSx}>Deal details</Typography>
							<Grid container spacing={2.5} sx={{ mt: 0.5 }}>
								<Grid size={{ xs: 12, sm: 6 }}>
									<Typography variant="caption" sx={labelSx}>Company</Typography>
									{company ? (
										<Stack direction="row" spacing={1} alignItems="center">
											<Business fontSize="small" sx={{ color: 'text.secondary' }} />
											<Typography variant="body2" sx={{ fontWeight: 600 }}>{company.name}</Typography>
										</Stack>
									) : (
										<Typography variant="body2" color="text.disabled">No company linked</Typography>
									)}
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									<Typography variant="caption" sx={labelSx}>Contact Person</Typography>
									{contact ? (
										<Stack direction="row" spacing={1} alignItems="center">
											<Person fontSize="small" sx={{ color: 'text.secondary' }} />
											<Typography variant="body2" sx={{ fontWeight: 600 }}>
												{contact.first_name} {contact.last_name || ''}
											</Typography>
										</Stack>
									) : (
										<Typography variant="body2" color="text.disabled">No contact linked</Typography>
									)}
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									<Typography variant="caption" sx={labelSx}>Owner</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{owner ? (owner.full_name || owner.email) : 'Unassigned'}
									</Typography>
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									<Typography variant="caption" sx={labelSx}>Created On</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{new Date(deal.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
									</Typography>
								</Grid>
							</Grid>
						</Box>

						{/* Tags */}
						{deal.tags && deal.tags.length > 0 && (
							<Box sx={fieldCardSx}>
								<Typography variant="caption" sx={labelSx}>Tags</Typography>
								<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
									{deal.tags.map((t) => (
										<Chip key={t} label={t} size="small" icon={<LocalOffer style={{ fontSize: 12 }} />} />
									))}
								</Stack>
							</Box>
						)}

						{/* Lost Reason banner */}
						{deal.status === 'lost' && deal.lost_reason && (
							<Box sx={{ ...fieldCardSx, borderColor: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.04) }}>
								<Typography variant="caption" sx={{ ...labelSx, color: 'error.main' }}>Reason for loss</Typography>
								<Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
									{deal.lost_reason}
								</Typography>
							</Box>
						)}
					</Stack>
				)}

				{/* TAB 1: CHECKLIST / TASKS */}
				{tab === 1 && <DealTasksTab deal={deal} />}

				{/* TAB 2: ATTACHMENTS */}
				{tab === 2 && (
					<Stack spacing={2.5}>
						<Box sx={{ ...fieldCardSx, display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, gap: 1.5 }}>
							<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
								Upload Deal Attachments
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
								Accepts PDF, Word, Excel, CSV, Images (up to 10MB)
							</Typography>
							<Button
								variant="outlined"
								component="label"
								disabled={uploading}
								sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
							>
								{uploading ? 'Uploading...' : 'Choose File'}
								<input type="file" hidden onChange={handleFileUpload} />
							</Button>
						</Box>

						<Typography variant="caption" sx={sectionTitleSx}>Files ({files.length})</Typography>

						{filesLoading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
						) : files.length === 0 ? (
							<Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
								No attachments uploaded.
							</Typography>
						) : (
							<Stack spacing={1}>
								{files.map((file) => (
									<Box key={file.public_id} sx={{ ...fieldCardSx, p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
										<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
											<IconButton size="small" onClick={() => crmService.downloadFile(file.public_id, file.file_name)}>
												<CalendarToday fontSize="small" color="primary" />
											</IconButton>
											<Box sx={{ minWidth: 0 }}>
												<Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{file.file_name}</Typography>
												<Typography variant="caption" color="text.secondary">
													{(file.file_size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
												</Typography>
											</Box>
										</Stack>
										<IconButton size="small" onClick={() => handleFileDelete(file.public_id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
											<DeleteOutline fontSize="small" />
										</IconButton>
									</Box>
								))}
							</Stack>
						)}
					</Stack>
				)}

				{/* TAB 3: NOTES & TIMELINE */}
				{tab === 3 && (
					<Stack spacing={2}>
						<NotesComposer
							entityType="deal"
							entityId={deal.id}
							onCreated={() => dispatch(fetchEntityActivities({ entityType: 'deal', entityId: deal.id }))}
						/>
						<NotesTimeline activities={activities} loading={activitiesLoading} />
					</Stack>
				)}
			</Box>
		</DetailDrawer>
	);
};

export default DealDetailDrawer;
