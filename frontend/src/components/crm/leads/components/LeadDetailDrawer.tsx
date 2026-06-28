import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, IconButton, Tooltip, useTheme, alpha, Tabs, Tab, Grid, CircularProgress, Chip } from '@mui/material';
import { Edit, DeleteOutline, Phone, Email, InsertDriveFileOutlined, KeyboardArrowDown, KeyboardArrowUp, CloudUploadOutlined, GetApp, PictureAsPdf, Image, Description, GridOn, InsertDriveFile, HelpOutline, PersonOff, History as HistoryIcon } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import PremiumTooltip from '../../../common/PremiumTooltip';
import { ConfirmationDialog } from '../../../common/dialogbox';
import { RichTextViewer } from '../../../common/form';
import { NotesComposer, NotesTimeline } from '../../shared';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchEntityActivities, clearActivities, fetchLeadHistory, anonymizeLead } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import crmService from '../../../../services/crmService';
import { MAX_FILE_SIZE_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from '../../../../constants/fileUpload';
import type { Lead } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import type { CRMFile } from '../../../../models/crm/crmFile';

interface LeadDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	lead: Lead | null;
	owners: CRMOwnerOption[];
	onEdit: (lead: Lead) => void;
	onDelete: (lead: Lead) => void;
}

const formatValue = (value: number, currency: string) => {
	try {
		return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
	} catch {
		return value.toLocaleString();
	}
};

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({ open, onClose, lead, owners, onEdit, onDelete }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [tab, setTab] = useState(0);
	const [prevLeadId, setPrevLeadId] = useState(lead?.id);
	const [contactExpanded, setContactExpanded] = useState(false);
	const [composerType, setComposerType] = useState<string>('note');

	const toast = useToast();
	const [files, setFiles] = useState<CRMFile[]>([]);
	const [filesLoading, setFilesLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [anonymizeConfirmOpen, setAnonymizeConfirmOpen] = useState(false);

	if (lead?.id !== prevLeadId) {
		setPrevLeadId(lead?.id);
		setTab(0);
		setContactExpanded(false);
		setFiles([]);
		setComposerType('note');
	}

	const { activities, activitiesLoading } = useAppSelector((state) => state.crm);
	const { companyOptions, contactOptions, leadHistory, leadHistoryLoading, anonymizeLoading } = useAppSelector((state) => state.crm);
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';

	const loadFiles = async () => {
		if (!lead?.id) return;
		setFilesLoading(true);
		try {
			const res = await crmService.listFiles('lead', lead.id);
			setFiles(res.items);
		} catch (err: any) {
			toast.error('Failed to load files');
		} finally {
			setFilesLoading(false);
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!lead?.id || !e.target.files || e.target.files.length === 0) return;
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
			await crmService.uploadFile('lead', lead.id, file);
			toast.success('File uploaded successfully');
			loadFiles();
		} catch (err: any) {
			toast.error(err.response?.data?.error?.message || 'Failed to upload file');
		} finally {
			setUploading(false);
			e.target.value = '';
		}
	};

	const handleAnonymize = async () => {
		if (!lead) return;
		try {
			await dispatch(anonymizeLead(lead.public_id)).unwrap();
			toast.success('Lead anonymized');
			setAnonymizeConfirmOpen(false);
		} catch (err: any) {
			toast.error(err || 'Failed to anonymize lead');
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

	useEffect(() => {
		if (open && tab === 2 && lead?.id) {
			loadFiles();
		}
	}, [open, tab, lead?.id]);

	useEffect(() => {
		if (open && tab === 3 && lead?.public_id) {
			dispatch(fetchLeadHistory(lead.public_id));
		}
	}, [open, tab, lead?.public_id, dispatch]);

	useEffect(() => {
		if (open && lead) {
			dispatch(fetchEntityActivities({ entityType: 'lead', entityId: lead.id }));
		} else {
			dispatch(clearActivities());
		}
	}, [open, lead, dispatch]);

	if (!lead) return null;

	const company = companyOptions.find((c) => c.id === lead.company_id);
	const contact = contactOptions.find((c) => c.id === lead.contact_id);
	const owner = lead.owner_id != null ? owners.find((o) => o.id === lead.owner_id) : undefined;
	const displayId = `LD-${String(lead.id).padStart(5, '0')}`;

	const fieldCardSx = {
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		p: 1.5,
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
			width={520}
			hideDivider
			title={
				<Stack direction="row" spacing={1.5} alignItems="center">
					<Box
						sx={{
							width: 44,
							height: 44,
							borderRadius: '50%',
							flexShrink: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							bgcolor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
							color: 'primary.main',
							fontWeight: 800,
							fontSize: '1.1rem',
						}}
					>
						{lead.title.charAt(0).toUpperCase()}
					</Box>
					<Box sx={{ minWidth: 0 }}>
						<Typography
							variant="h5"
							noWrap
							sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary', fontSize: '1rem', lineHeight: 1.3 }}
						>
							{lead.title}
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem' }}>
							ID: #{displayId}
						</Typography>
					</Box>
				</Stack>
			}
			headerExtra={
				<Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
					<Box
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							px: 1.5,
							height: 24,
							borderRadius: '6px',
							bgcolor: 'primary.main',
							color: '#ffffff',
							fontSize: '0.65rem',
							fontWeight: 800,
							letterSpacing: '0.06em',
							textTransform: 'uppercase',
							lineHeight: 1,
							boxSizing: 'border-box',
						}}
					>
						{lead.status} Lead
					</Box>
					<Box
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							px: 1.5,
							height: 24,
							borderRadius: '6px',
							border: '1px solid',
							borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
							color: 'text.secondary',
							fontSize: '0.65rem',
							fontWeight: 800,
							letterSpacing: '0.06em',
							textTransform: 'uppercase',
							lineHeight: 1,
							boxSizing: 'border-box',
						}}
					>
						{owner ? (owner.full_name || owner.email) : 'Unassigned'}
					</Box>
				</Stack>
			}
			headerActions={
				<>
					<Tooltip title="Edit Lead">
						<IconButton
							size="small"
							onClick={() => onEdit(lead)}
							sx={{
								color: 'text.secondary',
								'&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) },
							}}
						>
							<Edit sx={{ fontSize: 17 }} />
						</IconButton>
					</Tooltip>
					<Tooltip title="Delete Lead">
						<IconButton
							size="small"
							onClick={() => onDelete(lead)}
							sx={{
								color: 'text.secondary',
								'&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) },
							}}
						>
							<DeleteOutline sx={{ fontSize: 17 }} />
						</IconButton>
					</Tooltip>
					{isAdmin && !lead.is_anonymized && (
						<Tooltip title="Anonymize (GDPR)">
							<IconButton
								size="small"
								onClick={() => setAnonymizeConfirmOpen(true)}
								sx={{
									color: 'text.secondary',
									'&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) },
								}}
							>
								<PersonOff sx={{ fontSize: 17 }} />
							</IconButton>
						</Tooltip>
					)}
				</>
			}
		>
			<Tabs
				value={tab}
				onChange={(_e, value) => setTab(value)}
				sx={{
					mb: 2.5,
					minHeight: 36,
					borderBottom: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
					'& .MuiTabs-indicator': { height: 2, bgcolor: 'primary.main', borderRadius: '2px 2px 0 0' },
					'& .MuiTab-root': {
						textTransform: 'none',
						fontWeight: 700,
						minHeight: 36,
						px: 2,
						py: 1,
						fontSize: '0.82rem',
						color: 'text.secondary',
						'&.Mui-selected': { color: 'primary.main' },
					},
				}}
			>
				<Tab label="Overview" />
				<Tab label="Timeline" />
				<Tab label="Files" />
				<Tab label="History" />
			</Tabs>

			<Box sx={{ display: tab === 0 ? 'flex' : 'none', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1 }}>

				{(company || lead.estimated_value != null) && (
					<Grid container spacing={1.5}>
						{company && (
							<Grid size={{ xs: 6 }}>
								<Box sx={fieldCardSx}>
									<Typography sx={labelSx}>Company</Typography>
									<Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'text.primary' }}>
										{company.name}
									</Typography>
								</Box>
							</Grid>
						)}
						{lead.estimated_value != null && (
							<Grid size={{ xs: 6 }}>
								<Box sx={fieldCardSx}>
									<Typography sx={labelSx}>Value</Typography>
									<Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'primary.main' }}>
										{formatValue(lead.estimated_value, lead.currency)}
									</Typography>
								</Box>
							</Grid>
						)}
					</Grid>
				)}

				{lead.tags && lead.tags.length > 0 && (
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
						{lead.tags.map((tag) => (
							<Chip key={tag} label={tag} size="small" sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.72rem' }} />
						))}
					</Stack>
				)}

				{contact && (
					<Box sx={fieldCardSx}>
						<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 0.5 }}>
							<Typography sx={{ ...labelSx, mb: 0 }}>Contact</Typography>
							<PremiumTooltip title="The associated candidate contact info. Click expand button to view email/phone details, or use quick actions to call or email." arrow placement="right">
								<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
							</PremiumTooltip>
						</Box>
						<Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mt: 0.5 }}>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: contactExpanded ? 0.75 : 0 }}>
									{contact.first_name} {contact.last_name || ''}
								</Typography>
								{contactExpanded && (
									<Stack spacing={0.75}>
										{contact.email && (
											<Stack
												direction="row"
												spacing={0.75}
												alignItems="center"
												component="a"
												href={`mailto:${contact.email}`}
												onClick={() => { setTab(0); setComposerType('email'); }}
												sx={{
													textDecoration: 'none',
													color: 'text.secondary',
													width: 'fit-content',
													'&:hover': { color: 'primary.main' }
												}}
											>
												<Email sx={{ fontSize: 14, color: 'text.disabled' }} />
												<Typography variant="caption" sx={{ color: 'inherit', fontWeight: 500 }}>
													{contact.email}
												</Typography>
											</Stack>
										)}
										{(contact.phone || contact.mobile) && (
											<Stack
												direction="row"
												spacing={0.75}
												alignItems="center"
												component="a"
												href={`tel:${contact.phone || contact.mobile}`}
												onClick={() => { setTab(0); setComposerType('call'); }}
												sx={{
													textDecoration: 'none',
													color: 'text.secondary',
													width: 'fit-content',
													'&:hover': { color: 'primary.main' }
												}}
											>
												<Phone sx={{ fontSize: 14, color: 'text.disabled' }} />
												<Typography variant="caption" sx={{ color: 'inherit', fontWeight: 500 }}>
													{contact.phone || contact.mobile}
												</Typography>
											</Stack>
										)}
									</Stack>
								)}
							</Box>
							<Stack direction="row" spacing={0.25} sx={{ alignSelf: contactExpanded ? 'flex-start' : 'center', mt: contactExpanded ? -0.25 : 0 }}>
								{!contactExpanded && (
									<>
										{(contact.phone || contact.mobile) && (
											<Tooltip title="Call">
												<IconButton
													size="small"
													component="a"
													href={`tel:${contact.phone || contact.mobile}`}
													onClick={() => { setTab(0); setComposerType('call'); }}
													sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
												>
													<Phone sx={{ fontSize: 17 }} />
												</IconButton>
											</Tooltip>
										)}
										{contact.email && (
											<Tooltip title="Email">
												<IconButton
													size="small"
													component="a"
													href={`mailto:${contact.email}`}
													onClick={() => { setTab(0); setComposerType('email'); }}
													sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
												>
													<Email sx={{ fontSize: 17 }} />
												</IconButton>
											</Tooltip>
										)}
									</>
								)}
								<Tooltip title={contactExpanded ? "Collapse Details" : "Expand Details"}>
									<IconButton
										size="small"
										onClick={() => setContactExpanded(!contactExpanded)}
										sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
									>
										{contactExpanded ? <KeyboardArrowUp sx={{ fontSize: 18 }} /> : <KeyboardArrowDown sx={{ fontSize: 18 }} />}
									</IconButton>
								</Tooltip>
							</Stack>
						</Stack>
					</Box>
				)}

				{lead.description && (
					<Box>
						<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 1.25 }}>
							<Typography sx={{ ...sectionTitleSx, mb: 0 }}>Description</Typography>
							<PremiumTooltip title="Primary overview or background details of the lead." arrow placement="right">
								<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
							</PremiumTooltip>
						</Box>
						<Box
							sx={{
								...fieldCardSx,
								borderLeft: `3px solid ${theme.palette.primary.main}`,
								borderRadius: '12px',
							}}
						>
							<RichTextViewer html={lead.description} />
						</Box>
					</Box>
				)}

				<Box>
					<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 1.25 }}>
						<Typography sx={{ ...sectionTitleSx, mb: 0 }}>Notes</Typography>
						<PremiumTooltip title="Log communication activities for this lead. Notes, calls, emails, and meetings logged here will populate the Timeline." arrow placement="right">
							<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
						</PremiumTooltip>
					</Box>
					<Box
						sx={{
							...fieldCardSx,
							p: 0,
							overflow: 'hidden',
						}}
					>
						<Box sx={{ p: 1.5 }}>
							<NotesComposer
								key={`${lead.id}-${composerType}`}
								entityType="lead"
								entityId={lead.id}
								variant="compact"
								defaultType={composerType as any}
								onCreated={() => {
									setComposerType('note');
									dispatch(fetchEntityActivities({ entityType: 'lead', entityId: lead.id }));
								}}
							/>
						</Box>
					</Box>
				</Box>
			</Box>

			<Box sx={{ display: tab === 1 ? 'flex' : 'none', flexDirection: 'column', overflowY: 'auto', flex: 1, p: 2.5 }}>
				<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Activity History</Typography>
					<PremiumTooltip title="Timeline trace of logged phone calls, emails, notes, tasks, and meetings. Helps keep your sales outreach history transparent." arrow placement="right">
						<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Box>
				<NotesTimeline activities={activities} loading={activitiesLoading} />
			</Box>

			<Box
				sx={{
					display: tab === 2 ? 'flex' : 'none',
					flexDirection: 'column',
					flex: 1,
					p: 2.5,
					overflowY: 'auto',
				}}
			>
				<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Candidate Attachments</Typography>
					<PremiumTooltip title="Securely upload, store, and download resumes, certificates, and profiles. Scoped strictly under your organization tenant ID and uploader user credentials." arrow placement="right">
						<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Box>
				{/* Dotted Upload Card */}
				<Box
					sx={{
						border: '2px dashed',
						borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
						borderRadius: '12px',
						p: 2.5,
						textAlign: 'center',
						cursor: uploading ? 'default' : 'pointer',
						bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
						transition: 'all 0.2s',
						'&:hover': uploading ? {} : {
							borderColor: 'primary.main',
							bgcolor: isDark ? 'rgba(33, 150, 243, 0.05)' : 'rgba(33, 150, 243, 0.02)',
						},
						mb: 3,
					}}
					component="label"
				>
					<input
						type="file"
						hidden
						onChange={handleFileUpload}
						disabled={uploading}
					/>
					{uploading ? (
						<Stack spacing={1} alignItems="center">
							<CircularProgress size={24} />
							<Typography variant="body2" color="text.secondary">
								Uploading file...
							</Typography>
						</Stack>
					) : (
						<Stack spacing={1} alignItems="center">
							<CloudUploadOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								Click to upload a file
							</Typography>
							<Typography variant="caption" color="text.secondary">
								Max size: 10MB
							</Typography>
						</Stack>
					)}
				</Box>

				{/* File List */}
				{filesLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress size={28} />
					</Box>
				) : files.length === 0 ? (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							py: 4,
							gap: 1,
						}}
					>
						<Box
							sx={{
								width: 52,
								height: 52,
								borderRadius: '14px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
								mb: 0.5,
							}}
						>
							<InsertDriveFileOutlined sx={{ fontSize: 24, color: 'text.disabled' }} />
						</Box>
						<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
							No files attached
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Files will appear here once attached.
						</Typography>
					</Box>
				) : (
					<Stack spacing={1.5}>
						{files.map((f) => (
							<Box
								key={f.public_id}
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									p: 1.5,
									borderRadius: '12px',
									border: '1px solid',
									borderColor: 'divider',
									bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
									transition: 'transform 0.15s, box-shadow 0.15s',
									'&:hover': {
										boxShadow: theme.shadows[1],
									}
								}}
							>
								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: 'hidden', flex: 1 }}>
									<Box
										sx={{
											width: 36,
											height: 36,
											borderRadius: '8px',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											bgcolor: getFileIconBg(f.mime_type),
											flexShrink: 0,
										}}
									>
										{getFileIcon(f.mime_type)}
									</Box>
									<Box sx={{ overflow: 'hidden', flex: 1 }}>
										<Typography
											variant="body2"
											sx={{
												fontWeight: 600,
												color: 'text.primary',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{f.file_name}
										</Typography>
										<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
											{formatFileSize(f.file_size)} • {new Date(f.created_at).toLocaleDateString()}
										</Typography>
									</Box>
								</Stack>
								<Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 1.5 }}>
									<Tooltip title="Download File">
										<IconButton
											size="small"
											onClick={() => crmService.downloadFile(f.public_id, f.file_name)}
											sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
										>
											<GetApp sx={{ fontSize: 18 }} />
										</IconButton>
									</Tooltip>
									<Tooltip title="Delete File">
										<IconButton
											size="small"
											onClick={() => handleFileDelete(f.public_id)}
											sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
										>
											<DeleteOutline sx={{ fontSize: 18 }} />
										</IconButton>
									</Tooltip>
								</Stack>
							</Box>
						))}
					</Stack>
				)}
			</Box>

			<Box sx={{ display: tab === 3 ? 'flex' : 'none', flexDirection: 'column', overflowY: 'auto', flex: 1, p: 2.5 }}>
				<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Change History</Typography>
					<PremiumTooltip title="A read-only audit trail of who changed what on this lead, and when." arrow placement="right">
						<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
					</PremiumTooltip>
				</Box>
				{leadHistoryLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress size={28} />
					</Box>
				) : leadHistory.length === 0 ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1 }}>
						<HistoryIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
						<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>No changes recorded yet</Typography>
					</Box>
				) : (
					<Stack spacing={1.5}>
						{leadHistory.map((h) => (
							<Box key={h.id} sx={{ ...fieldCardSx, borderLeft: `3px solid ${theme.palette.primary.main}`, borderRadius: '12px' }}>
								<Typography variant="body2" sx={{ fontWeight: 700 }}>
									{h.field_name
										? `${h.field_name.replace('_', ' ')} changed from "${h.old_value ?? '—'}" to "${h.new_value ?? '—'}"`
										: h.action}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{new Date(h.changed_at).toLocaleString()}
								</Typography>
							</Box>
						))}
					</Stack>
				)}
			</Box>

			<ConfirmationDialog
				open={anonymizeConfirmOpen}
				onClose={() => setAnonymizeConfirmOpen(false)}
				onConfirm={handleAnonymize}
				title="Anonymize Lead (GDPR)"
				subtitle="Scrub personally identifiable information"
				message="This will permanently scrub this lead's title, description, tags, and delete all attached files. Status, source, and priority are kept for reporting. This action cannot be undone."
				confirmLabel="Anonymize"
				severity="error"
				loading={anonymizeLoading}
			/>
		</DetailDrawer>
	);
};

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIconBg = (mime: string) => {
	if (mime.startsWith('image/')) return 'rgba(76, 175, 80, 0.1)';
	if (mime.includes('pdf')) return 'rgba(244, 67, 54, 0.1)';
	if (mime.includes('word') || mime.includes('officedocument')) return 'rgba(33, 150, 243, 0.1)';
	if (mime.includes('excel') || mime.includes('sheet') || mime.includes('csv')) return 'rgba(76, 175, 80, 0.1)';
	return 'rgba(0, 0, 0, 0.05)';
};

const getFileIcon = (mime: string) => {
	if (mime.startsWith('image/')) return <Image sx={{ fontSize: 18, color: '#4CAF50' }} />;
	if (mime.includes('pdf')) return <PictureAsPdf sx={{ fontSize: 18, color: '#F44336' }} />;
	if (mime.includes('word') || mime.includes('officedocument')) return <Description sx={{ fontSize: 18, color: '#2196F3' }} />;
	if (mime.includes('excel') || mime.includes('sheet') || mime.includes('csv')) return <GridOn sx={{ fontSize: 18, color: '#4CAF50' }} />;
	return <InsertDriveFile sx={{ fontSize: 18, color: '#9E9E9E' }} />;
};

export default LeadDetailDrawer;
