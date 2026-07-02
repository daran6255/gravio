import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, IconButton, Tooltip, useTheme, alpha, Tabs, Tab } from '@mui/material';
import { Edit, DeleteOutline, PersonOff, NotificationsActiveOutlined } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import StatusBadge from '../../../common/badge/StatusBadge';
import { ConfirmationDialog } from '../../../common/dialogbox';
import { SetReminderDialog } from '../../shared';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { updateLead, searchCompanyOptions, searchContactOptions, anonymizeLead, fetchActiveReminders } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import { formatReminderTime } from '../../../../utils/reminders';
import type { Lead, LeadStatus } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

// Import refactored lead tabs
import { LeadOverviewTab } from './tabs/LeadOverviewTab';
import { LeadTasksTab } from './tabs/LeadTasksTab';
import { LeadTimelineTab } from './tabs/LeadTimelineTab';
import { LeadFilesTab } from './tabs/LeadFilesTab';
import { LeadHistoryTab } from './tabs/LeadHistoryTab';

interface LeadDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	lead: Lead | null;
	owners: CRMOwnerOption[];
	onEdit: (lead: Lead) => void;
	onDelete: (lead: Lead) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({ open, onClose, lead, owners, onEdit, onDelete }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();

	const [tab, setTab] = useState(0);
	const [prevLeadId, setPrevLeadId] = useState<number | undefined>(lead?.id);
	const [anonymizeConfirmOpen, setAnonymizeConfirmOpen] = useState(false);
	const [reminderOpen, setReminderOpen] = useState(false);

	if (lead?.id !== prevLeadId) {
		setPrevLeadId(lead?.id);
		setTab(0);
	}

	const { anonymizeLoading, activeReminders } = useAppSelector((state) => state.crm);
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';

	useEffect(() => {
		if (lead) {
			dispatch(fetchActiveReminders({ entityType: 'lead', entityIds: [lead.id] }));
		}
	}, [dispatch, lead]);

	const activeReminder = lead
		? activeReminders.find((r) => r.entity_type === 'lead' && r.entity_id === lead.id)
		: undefined;

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

	const handleStatusChange = async (targetStatus: LeadStatus) => {
		if (!lead) return;
		try {
			await dispatch(updateLead({ publicId: lead.public_id, payload: { status: targetStatus } })).unwrap();
			toast.success(`Lead status updated to ${getStepLabel(targetStatus)}`);
		} catch (err: any) {
			toast.error(err || 'Failed to update status');
		}
	};

	useEffect(() => {
		if (open) {
			dispatch(searchCompanyOptions(undefined));
			dispatch(searchContactOptions(undefined));
		}
	}, [open, dispatch]);

	if (!lead) return null;

	const owner = lead.owner_id != null ? owners.find((o) => o.id === lead.owner_id) : undefined;
	const displayId = `LD-${String(lead.id).padStart(5, '0')}`;

	const leadSteps: LeadStatus[] = lead.status === 'unqualified'
		? ['new', 'contacted', 'unqualified']
		: ['new', 'contacted', 'qualified', 'converted'];

	const getStepLabel = (status: LeadStatus) => {
		switch (status) {
			case 'new': return 'New';
			case 'contacted': return 'Contacted';
			case 'qualified': return 'Qualified';
			case 'unqualified': return 'Unqualified';
			case 'converted': return 'Converted';
			default: return status;
		}
	};

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			width={600}
			disablePadding={true}
			title={
				<Stack direction="row" spacing={1.5} alignItems="center">
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: '50%',
							flexShrink: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							bgcolor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
							color: 'primary.main',
							fontWeight: 800,
							fontSize: '1rem',
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
			headerExtra={<StatusBadge label={lead.status} status={lead.status} type="lead" />}
			headerActions={
				<Stack direction="row" spacing={1} sx={{ mr: 1 }}>
					<Tooltip title="Edit Lead">
						<IconButton
							size="small"
							onClick={() => onEdit(lead)}
							sx={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
						>
							<Edit fontSize="small" />
						</IconButton>
					</Tooltip>
					{lead.status !== 'converted' && (
						<Tooltip title="Set Reminder">
							<IconButton
								size="small"
								onClick={() => setReminderOpen(true)}
								sx={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', '&:hover': { color: 'warning.main' } }}
							>
								<NotificationsActiveOutlined fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
					<Tooltip title="Delete Lead">
						<IconButton
							size="small"
							onClick={() => onDelete(lead)}
							sx={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}
						>
							<DeleteOutline fontSize="small" />
						</IconButton>
					</Tooltip>
					{isAdmin && !lead.is_anonymized && (
						<Tooltip title="Anonymize (GDPR)">
							<IconButton
								size="small"
								onClick={() => setAnonymizeConfirmOpen(true)}
								sx={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}
							>
								<PersonOff fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
				</Stack>
			}
		>
			{/* Visual Lead Status Stepper */}
			<Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', px: 1, py: 0.3, borderRadius: '4px' }}>
							#{displayId}
						</Typography>
						{owner && (
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
								Owner: <strong style={{ color: theme.palette.text.primary }}>{owner.full_name || owner.email}</strong>
							</Typography>
						)}
						{activeReminder && (
							<Stack direction="row" spacing={0.4} alignItems="center">
								<NotificationsActiveOutlined sx={{ fontSize: 13, color: 'warning.main' }} />
								<Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
									Reminds {formatReminderTime(activeReminder.remind_at)}
								</Typography>
							</Stack>
						)}
					</Stack>
					<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
						Status: <strong style={{ color: lead.status === 'unqualified' ? theme.palette.error.main : (lead.status === 'converted' ? theme.palette.success.main : theme.palette.primary.main), textTransform: 'capitalize' }}>{getStepLabel(lead.status)}</strong>
					</Typography>
				</Stack>
				<Stack direction="row" spacing={0.5} sx={{ width: '100%' }}>
					{leadSteps.map((step, idx) => {
						const isCurrent = lead.status === step;
						const currentIdx = leadSteps.indexOf(lead.status);
						const isCompleted = idx < currentIdx;
						
						let bg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
						let hoverBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';

						if (isCurrent) {
							bg = step === 'unqualified' 
								? theme.palette.error.main 
								: (step === 'converted' ? theme.palette.success.main : theme.palette.primary.main);
							hoverBg = bg;
						} else if (isCompleted) {
							bg = alpha(theme.palette.primary.main, 0.4);
							hoverBg = alpha(theme.palette.primary.main, 0.6);
						}

						return (
							<Tooltip key={step} title={`Mark status as ${getStepLabel(step)}`}>
								<Box
									onClick={() => handleStatusChange(step)}
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

			{/* Tabs Navigation */}
			<Tabs
				value={tab}
				onChange={(_e, value) => setTab(value)}
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
				<Tab label="Overview" />
				<Tab label="Tasks" />
				<Tab label="Activities" />
				<Tab label="Files" />
				<Tab label="History" />
			</Tabs>

			{/* Scrollable drawer body */}
			<Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, overscrollBehavior: 'contain' }}>
				{tab === 0 && <LeadOverviewTab lead={lead} owners={owners} />}
				{tab === 1 && <LeadTasksTab lead={lead} />}
				{tab === 2 && <LeadTimelineTab lead={lead} />}
				{tab === 3 && <LeadFilesTab lead={lead} />}
				{tab === 4 && <LeadHistoryTab lead={lead} owners={owners} />}
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

			<SetReminderDialog
				open={reminderOpen}
				onClose={() => setReminderOpen(false)}
				entityType="lead"
				entityId={lead.id}
				entityLabel={lead.title}
			/>
		</DetailDrawer>
	);
};

export default LeadDetailDrawer;
