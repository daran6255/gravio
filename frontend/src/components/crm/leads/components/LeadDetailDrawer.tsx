import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, IconButton, Tooltip, useTheme, alpha, Tabs, Tab, Grid } from '@mui/material';
import { Edit, DeleteOutline, Phone, Email, InsertDriveFileOutlined } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import { RichTextViewer } from '../../../common/form';
import { ActivityComposer, ActivityTimeline } from '../../shared';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchEntityActivities, clearActivities } from '../../../../store/slices/crmSlice';
import type { Lead } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

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

	if (lead?.id !== prevLeadId) {
		setPrevLeadId(lead?.id);
		setTab(0);
	}

	const { activities, activitiesLoading } = useAppSelector((state) => state.crm);
	const { companyOptions, contactOptions } = useAppSelector((state) => state.crm);

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

				{contact && (
					<Box sx={fieldCardSx}>
						<Typography sx={labelSx}>Contact</Typography>
						<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
							<Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'text.primary' }}>
								{contact.first_name} {contact.last_name || ''}
							</Typography>
							<Stack direction="row" spacing={0.25}>
								{(contact.phone || contact.mobile) && (
									<Tooltip title="Call">
										<IconButton
											size="small"
											component="a"
											href={`tel:${contact.phone || contact.mobile}`}
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
											sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
										>
											<Email sx={{ fontSize: 17 }} />
										</IconButton>
									</Tooltip>
								)}
							</Stack>
						</Stack>
					</Box>
				)}

				{lead.description && (
					<Box>
						<Typography sx={sectionTitleSx}>Description</Typography>
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
					<Typography sx={sectionTitleSx}>Log Activity</Typography>
					<Box
						sx={{
							...fieldCardSx,
							p: 0,
							overflow: 'hidden',
						}}
					>
						<Box sx={{ p: 1.5 }}>
							<ActivityComposer
								entityType="lead"
								entityId={lead.id}
								variant="compact"
								onCreated={() => dispatch(fetchEntityActivities({ entityType: 'lead', entityId: lead.id }))}
							/>
						</Box>
					</Box>
				</Box>
			</Box>

			<Box sx={{ display: tab === 1 ? 'flex' : 'none', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
				<ActivityTimeline activities={activities} loading={activitiesLoading} />
			</Box>

			<Box
				sx={{
					display: tab === 2 ? 'flex' : 'none',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					flex: 1,
					py: 6,
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
		</DetailDrawer>
	);
};

export default LeadDetailDrawer;
