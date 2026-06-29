import React, { useEffect, useState } from 'react';
import {
	Box, Typography, Stack, IconButton, Tooltip, useTheme, alpha,
	Tabs, Tab, Grid, CircularProgress, Chip, TextField, InputAdornment, Button
} from '@mui/material';
import {
	Edit, DeleteOutline, Business, Person, CalendarToday, LocalOffer,
	Payments, TrendingUp, Launch, InfoOutlined, ContentCopy
} from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import StatusBadge from '../../../common/badge/StatusBadge';
import { NotesComposer, NotesTimeline } from '../../shared';
import { DealTasksTab } from './DealTasksTab';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchEntityActivities, clearActivities, updateDeal, fetchDealTasks,
	searchCompanyOptions, searchContactOptions
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

const getCurrencySymbol = (currency?: string): string => {
	const map: Record<string, string> = {
		USD: '$',
		EUR: '€',
		INR: '₹',
		GBP: '£',
		JPY: '¥',
		AUD: 'A$',
		CAD: 'C$',
		CNY: '¥',
		SGD: 'S$',
	};
	return currency ? (map[currency.toUpperCase()] || '') : '';
};

const formatValue = (value: number, currency: string) => {
	try {
		return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
	} catch {
		const symbol = getCurrencySymbol(currency);
		return `${symbol} ${value.toLocaleString()} ${currency}`.trim();
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
	const [value, setValue] = useState(deal?.value != null ? Number(deal.value).toLocaleString() : '');
	const [closeDate, setCloseDate] = useState(deal?.close_date || '');

	if (deal?.id !== prevDealId) {
		setPrevDealId(deal?.id);
		setTab(0);
		setFiles([]);
	}

	useEffect(() => {
		if (deal) {
			setValue(deal.value != null ? Number(deal.value).toLocaleString() : '');
			setCloseDate(deal.close_date || '');
		}
	}, [deal?.value, deal?.close_date, deal?.id]);

	const handleChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value.replace(/[^0-9.]/g, '');
		const parts = raw.split('.');
		const integerPart = parts[0] ? Number(parts[0]).toLocaleString() : '';
		const decimalPart = parts[1] !== undefined ? '.' + parts[1].slice(0, 2) : '';
		setValue(integerPart + decimalPart);
	};

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
		const parsed = value ? Number(value.replace(/,/g, '')) : undefined;
		if (parsed !== deal.value) {
			dispatch(updateDeal({ publicId: deal.public_id, payload: { value: parsed } }));
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

	useEffect(() => {
		if (open) {
			dispatch(searchCompanyOptions(undefined));
			dispatch(searchContactOptions(undefined));
		}
	}, [open, dispatch]);

	if (!deal) return null;

	const handleStageChange = async (targetStageId: number) => {
		try {
			await dispatch(updateDeal({ publicId: deal.public_id, payload: { stage_id: targetStageId } })).unwrap();
			const targetStage = pipeline?.stages.find((s) => s.id === targetStageId);
			toast.success(targetStage?.is_won_stage ? 'Deal marked as Won 🎉' : `Moved to ${targetStage?.name}`);
		} catch (err: any) {
			toast.error(err || 'Failed to update stage');
		}
	};

	const company = companyOptions.find((c) => c.id === deal.company_id);
	const contact = contactOptions.find((c) => c.id === deal.contact_id);
	const owner = deal.owner_id != null ? owners.find((o) => o.id === deal.owner_id) : undefined;
	const pipeline = pipelines.find((p) => p.id === deal.pipeline_id);
	const stage = pipeline?.stages.find((s) => s.id === deal.stage_id);
	const displayId = `DL-${String(deal.id).padStart(5, '0')}`;
	const description = deal.custom_fields?.description;

	const fieldCardSx = {
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		p: 1.75,
		boxShadow: isDark ? '0px 4px 20px rgba(0,0,0,0.15)' : '0px 4px 20px rgba(0,0,0,0.02)',
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
	};

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={deal.title}
			width={600}
			disablePadding={true}
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
			{/* Visual Stage Progress Stepper Bar */}
			{pipeline && (
				<Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', px: 1, py: 0.3, borderRadius: '4px' }}>
								{displayId}
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
								Pipeline: <strong style={{ color: theme.palette.text.primary }}>{pipeline.name}</strong>
							</Typography>
						</Stack>
						{stage && (
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
								Stage: <strong style={{ color: theme.palette.primary.main }}>{stage.name} ({deal.probability}%)</strong>
							</Typography>
						)}
					</Stack>
					<Stack direction="row" spacing={0.5} sx={{ width: '100%' }}>
						{pipeline.stages.map((s) => {
							const isCurrent = s.id === deal.stage_id;
							const isCompleted = stage ? s.order < stage.order : false;
							const isWon = s.is_won_stage;
							const isLost = s.is_lost_stage;

							let bg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
							let hoverBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
							
							if (isCurrent) {
								bg = isLost ? theme.palette.error.main : (isWon ? theme.palette.success.main : theme.palette.primary.main);
								hoverBg = bg;
							} else if (isCompleted) {
								bg = alpha(theme.palette.primary.main, 0.4);
								hoverBg = alpha(theme.palette.primary.main, 0.6);
							}

							return (
								<Tooltip key={s.id} title={`${s.name} (${s.probability}%)`}>
									<Box
										onClick={() => handleStageChange(s.id)}
										sx={{
											flex: 1,
											height: 8,
											borderRadius: '4px',
											bgcolor: bg,
											cursor: 'pointer',
											transition: 'all 0.2s',
											transform: isCurrent ? 'scaleY(1.2)' : 'none',
											'&:hover': {
												bgcolor: hoverBg,
												transform: 'scaleY(1.4)'
											}
										}}
									/>
								</Tooltip>
							);
						})}
					</Stack>
				</Box>
			)}

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
			<Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
				
				{/* TAB 0: DETAILS */}
				{tab === 0 && (
					<Stack spacing={2.5}>
						
						{/* Deal Financials Cards */}
						<Grid container spacing={2}>
							<Grid size={{ xs: 6 }}>
								<Box sx={{ ...fieldCardSx, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
									<Box>
										<Typography variant="caption" sx={labelSx}>Deal Value</Typography>
										<Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
											<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
												{deal.value != null ? formatValue(deal.value, deal.currency) : '—'}
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
												{deal.currency}
											</Typography>
										</Stack>
									</Box>
									<Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), p: 1, borderRadius: '50%', color: 'primary.main', display: 'flex' }}>
										<Payments sx={{ fontSize: 20 }} />
									</Box>
								</Box>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Box sx={{ ...fieldCardSx, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
									<Box>
										<Typography variant="caption" sx={labelSx}>Win Probability</Typography>
										<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }}>
											{deal.probability}%
										</Typography>
									</Box>
									<Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), p: 1, borderRadius: '50%', color: 'success.main', display: 'flex' }}>
										<TrendingUp sx={{ fontSize: 20 }} />
									</Box>
								</Box>
							</Grid>
						</Grid>

						{/* Description Section */}
						<Box sx={fieldCardSx}>
							<Typography variant="caption" sx={{ ...sectionTitleSx, display: 'block', mb: 1 }}>Description</Typography>
							{description ? (
								<Box 
									sx={{ 
										fontSize: '0.85rem', 
										color: 'text.secondary',
										lineHeight: 1.6,
										'& p': { m: 0, mb: 1 },
										'& p:last-child': { mb: 0 },
										maxHeight: 150,
										overflowY: 'auto'
									}} 
									dangerouslySetInnerHTML={{ __html: description }} 
								/>
							) : (
								<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
									No description provided. Click Edit to add details.
								</Typography>
							)}
						</Box>

						{/* Quick Updates Section */}
						<Box sx={fieldCardSx}>
							<Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
								<Typography variant="caption" sx={sectionTitleSx}>Quick Updates</Typography>
								<Tooltip title="Changes auto-save when you click away (blur)">
									<InfoOutlined sx={{ fontSize: 13, color: 'text.secondary', cursor: 'help' }} />
								</Tooltip>
							</Stack>
							<Stack direction="row" spacing={2}>
								<TextField
									label="Deal Value"
									value={value}
									onChange={handleChangeValue}
									onBlur={handleSaveValue}
									size="small"
									fullWidth
									InputProps={{
										startAdornment: <InputAdornment position="start">{getCurrencySymbol(deal.currency)}</InputAdornment>,
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

						{/* Associated Entities Section */}
						<Box sx={fieldCardSx}>
							<Typography variant="caption" sx={{ ...sectionTitleSx, display: 'block', mb: 1.5 }}>Associations</Typography>
							<Grid container spacing={2}>
								{/* Company Card */}
								<Grid size={{ xs: 12, sm: 6 }}>
									<Box sx={{
										p: 1.5,
										borderRadius: '8px',
										border: '1px solid',
										borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
										bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
										height: '100%',
										display: 'flex',
										flexDirection: 'column',
										gap: 1
									}}>
										<Stack direction="row" spacing={1} alignItems="center">
											<Business color="primary" fontSize="small" sx={{ opacity: 0.8 }} />
											<Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em' }}>
												Company
											</Typography>
										</Stack>
										
										{company ? (
											<Box>
												<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>
													{company.name}
												</Typography>
												{company.industry && (
													<Typography variant="caption" color="text.secondary" display="block">
														{company.industry}
													</Typography>
												)}
												{company.website && (
													<Button
														href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
														target="_blank"
														rel="noopener noreferrer"
														variant="text"
														size="small"
														endIcon={<Launch sx={{ fontSize: 10 }} />}
														sx={{ 
															p: 0, 
															mt: 0.5, 
															justifyContent: 'flex-start',
															textTransform: 'none', 
															fontSize: '0.72rem',
															fontWeight: 600,
															color: 'primary.main',
															minWidth: 0,
															'&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
														}}
													>
														Visit website
													</Button>
												)}
											</Box>
										) : (
											<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 0.5 }}>
												No company linked
											</Typography>
										)}
									</Box>
								</Grid>

								{/* Contact Card */}
								<Grid size={{ xs: 12, sm: 6 }}>
									<Box sx={{
										p: 1.5,
										borderRadius: '8px',
										border: '1px solid',
										borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
										bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
										height: '100%',
										display: 'flex',
										flexDirection: 'column',
										gap: 1
									}}>
										<Stack direction="row" spacing={1} alignItems="center">
											<Person color="primary" fontSize="small" sx={{ opacity: 0.8 }} />
											<Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em' }}>
												Contact Person
											</Typography>
										</Stack>
										
										{contact ? (
											<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
												<Box sx={{ 
													width: 28, 
													height: 28, 
													borderRadius: '50%', 
													bgcolor: alpha(theme.palette.primary.main, 0.1),
													color: 'primary.main',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontWeight: 700,
													fontSize: '0.75rem',
													flexShrink: 0
												}}>
													{((contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')).toUpperCase()}
												</Box>
												<Box sx={{ minWidth: 0 }}>
													<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
														{contact.first_name} {contact.last_name || ''}
													</Typography>
													{contact.job_title && (
														<Typography variant="caption" color="text.secondary" display="block" noWrap>
															{contact.job_title}
														</Typography>
													)}
													
													{contact.email && (
														<Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
															<Tooltip title={`Copy email: ${contact.email}`}>
																<IconButton 
																	size="small" 
																	onClick={() => {
																		navigator.clipboard.writeText(contact.email || '');
																		toast.success('Email copied to clipboard');
																	}}
																	sx={{ p: 0.1, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
																>
																	<ContentCopy sx={{ fontSize: 11 }} />
																</IconButton>
															</Tooltip>
															<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} noWrap>
																{contact.email}
															</Typography>
														</Stack>
													)}
												</Box>
											</Box>
										) : (
											<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 0.5 }}>
												No contact linked
											</Typography>
										)}
									</Box>
								</Grid>
							</Grid>
						</Box>

						{/* System Info Fields */}
						<Box sx={fieldCardSx}>
							<Typography variant="caption" sx={{ ...sectionTitleSx, display: 'block', mb: 1.5 }}>System Details</Typography>
							<Grid container spacing={2}>
								<Grid size={{ xs: 6 }}>
									<Typography variant="caption" sx={labelSx}>Owner</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{owner ? (owner.full_name || owner.email) : 'Unassigned'}
									</Typography>
								</Grid>
								<Grid size={{ xs: 6 }}>
									<Typography variant="caption" sx={labelSx}>Created On</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{new Date(deal.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
									</Typography>
								</Grid>
								<Grid size={{ xs: 6 }}>
									<Typography variant="caption" sx={labelSx}>Last Updated</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{new Date(deal.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
									</Typography>
								</Grid>
								<Grid size={{ xs: 6 }}>
									<Typography variant="caption" sx={labelSx}>Deal ID</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
										{displayId}
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
