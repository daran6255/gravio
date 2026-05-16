import React from 'react';
import {
	TableRow,
	TableCell,
	IconButton,
	Chip,
	Typography,
	Box,
	useTheme,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Tooltip,
	Paper,
	alpha
} from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Warning as WarningIcon,
	CheckCircle as ApprovedIcon,
	HourglassEmpty as PendingIcon,
	Visibility as ViewIcon,
	MoreVert as MoreIcon,
	CalendarMonth as DateIcon,
	AccessTime as TimeIcon
} from '@mui/icons-material';
import { ConfirmationDialog } from '../../../common/dialogbox';
import type { DSREntry } from '../../../../models/dsr';
import { DSRStatusValues } from '../../../../models/dsr';
import useDateTime from '../../../../hooks/useDateTime';

interface MySubmissionsRowProps {
	entry: DSREntry;
	onDelete: (id: string) => void;
	onEdit?: (id: string) => void;
	onView?: (id: string) => void;
}

export const StatusChip: React.FC<{ entry: DSREntry }> = ({ entry }) => {
	// DRAFT with admin_notes = rejected and returned, needs re-submission
	const isRejected = entry.status === DSRStatusValues.DRAFT && entry.admin_notes;

	if (isRejected) {
		return (
			<Tooltip title={entry.admin_notes || 'Re-submission Required'}>
				<Chip
					icon={<WarningIcon />}
					label="Re-submission Required"
					size="small"
					sx={{
						bgcolor: '#fdf3f1',
						color: '#d13212',
						border: '1px solid #f5bdaf',
						fontWeight: 700,
						fontSize: '0.65rem',
						borderRadius: '4px',
						'& .MuiChip-icon': { color: '#d13212', fontSize: 13 }
					}}
				/>
			</Tooltip>
		);
	}

	const config: Record<string, { label: string; color: string; bg: string; border: string; icon?: React.ReactNode }> = {
		[DSRStatusValues.DRAFT]: {
			label: 'In Draft',
			color: '#4b5563', bg: '#f9fafb', border: '#e5e7eb'
		},
		[DSRStatusValues.SUBMITTED]: {
			label: 'Pending Review',
			color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd',
			icon: <PendingIcon />
		},
		[DSRStatusValues.APPROVED]: {
			label: 'Approved',
			color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0',
			icon: <ApprovedIcon />
		},
		[DSRStatusValues.REJECTED]: {
			label: 'Rejected',
			color: '#b91c1c', bg: '#fef2f2', border: '#fecaca'
		},
	};

	if (entry.is_leave) {
		return (
			<Chip
				label={`Leave: ${entry.leave_type || 'Unspecified'}`}
				size="small"
				sx={{
					bgcolor: '#fff7ed',
					color: '#c2410c',
					border: '1px solid #ffedd5',
					fontWeight: 600,
					fontSize: '0.65rem',
					borderRadius: '4px',
				}}
			/>
		);
	}

	const c = config[entry.status] || config[DSRStatusValues.DRAFT];
	return (
		<Chip
			label={c.label}
			size="small"
			sx={{
				bgcolor: c.bg,
				color: c.color,
				border: `1px solid ${c.border}`,
				fontWeight: 600,
				fontSize: '0.65rem',
				borderRadius: '4px',
			}}
		/>
	);
};

export const MySubmissionsMobileCard: React.FC<MySubmissionsRowProps> = ({ entry, onDelete, onEdit, onView }) => {
	const { formatDate } = useDateTime();
	const totalHours = entry.items.reduce((sum, item) => sum + item.hours, 0);
	const isRejected = entry.status === DSRStatusValues.DRAFT && entry.admin_notes;
	const isDraft = entry.status === DSRStatusValues.DRAFT;

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 2,
				mb: 2,
				borderRadius: '6px',
				bgcolor: isRejected ? '#fffafb' : 'white',
				borderColor: isRejected ? '#fecaca' : '#e5e7eb',
				transition: 'all 0.2s ease',
				'&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderColor: '#cbd5e1' }
			}}
		>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
						<DateIcon sx={{ fontSize: 16, color: '#64748b' }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
							{formatDate(entry.report_date)}
						</Typography>
					</Box>
					<StatusChip entry={entry} />
				</Box>
				<ActionMenu
					entry={entry}
					onView={onView}
					onEdit={onEdit}
					onDelete={onDelete}
					isDraft={isDraft}
					isRejected={!!isRejected}
				/>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, pt: 1, borderTop: '1px dashed #f1f5f9' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
					<TimeIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
					<Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
						{entry.is_leave ? 'Leave Day' : `${totalHours.toFixed(1)} hours logged`}
					</Typography>
				</Box>
			</Box>
		</Paper>
	);
};

const MySubmissionsRow: React.FC<MySubmissionsRowProps> = ({
	entry,
	onDelete,
	onEdit,
	onView
}) => {
	const theme = useTheme();
	const { formatDate, formatDateTime } = useDateTime();
	const totalHours = entry.items.reduce((sum, item) => sum + item.hours, 0);
	const isRejected = entry.status === DSRStatusValues.DRAFT && entry.admin_notes;
	const isDraft = entry.status === DSRStatusValues.DRAFT;

	return (
		<TableRow
			hover
			sx={{
				bgcolor: isRejected ? alpha(theme.palette.error.main, 0.02) : 'inherit',
				borderLeft: isRejected ? `4px solid ${theme.palette.error.main}` : 'none',
				transition: theme.transitions.create(['background-color']),
				'&:hover': { 
					bgcolor: isRejected ? alpha(theme.palette.error.main, 0.04) : `${alpha(theme.palette.action.hover, 0.04)} !important` 
				}
			}}
		>
			<TableCell>
				<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
					{formatDate(entry.report_date)}
				</Typography>
			</TableCell>

			<TableCell>
				<StatusChip entry={entry} />
			</TableCell>

			<TableCell>
				<Typography 
					variant="body2" 
					sx={{ 
						fontWeight: 700, 
						color: entry.is_leave ? 'warning.dark' : 'text.primary' 
					}}
				>
					{entry.is_leave ? '—' : `${totalHours.toFixed(1)} hrs`}
				</Typography>
			</TableCell>

			<TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
				<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
					{entry.submitted_at ? formatDateTime(entry.submitted_at) : '—'}
				</Typography>
			</TableCell>

			<TableCell align="right" sx={{ pr: 2 }}>
				<ActionMenu
					entry={entry}
					onView={onView}
					onEdit={onEdit}
					onDelete={onDelete}
					isDraft={isDraft}
					isRejected={!!isRejected}
				/>
			</TableCell>
		</TableRow>
	);
};

interface ActionMenuProps {
	entry: DSREntry;
	onView?: (id: string) => void;
	onEdit?: (id: string) => void;
	onDelete: (id: string) => void;
	isDraft: boolean;
	isRejected: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ entry, onView, onEdit, onDelete, isDraft, isRejected }) => {
	const { formatDate } = useDateTime();
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
	const open = Boolean(anchorEl);

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleAction = (cb?: (id: string) => void) => {
		handleClose();
		if (cb) cb(entry.public_id);
	};

	const handleDeleteClick = () => {
		handleClose();
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		setDeleteDialogOpen(false);
		onDelete(entry.public_id);
	};

	return (
		<>
			<IconButton
				size="small"
				onClick={handleClick}
				sx={{
					color: '#94a3b8',
					transition: 'all 0.2s',
					'&:hover': { color: '#475569', bgcolor: '#f1f5f9' }
				}}
			>
				<MoreIcon fontSize="small" />
			</IconButton>

			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				PaperProps={{
					sx: {
						minWidth: 160,
						boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
						border: '1px solid #f1f5f9',
						borderRadius: '6px',
						mt: 0.5
					}
				}}
				transformOrigin={{ horizontal: 'right', vertical: 'top' }}
				anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
			>
				<MenuItem onClick={() => handleAction(onView)} sx={{ py: 1.2, px: 2 }}>
					<ListItemIcon sx={{ minWidth: '32px !important' }}>
						<ViewIcon fontSize="small" sx={{ color: '#64748b' }} />
					</ListItemIcon>
					<ListItemText primary="View Details" primaryTypographyProps={{ fontSize: '0.6rem', fontWeight: 500 }} />
				</MenuItem>

				{isDraft && (
					<MenuItem onClick={() => handleAction(onEdit)} sx={{ py: 1.2, px: 2 }}>
						<ListItemIcon sx={{ minWidth: '32px !important' }}>
							<EditIcon fontSize="small" sx={isRejected ? { color: '#dc2626' } : { color: '#64748b' }} />
						</ListItemIcon>
						<ListItemText
							primary={isRejected ? 'Fix & Resubmit' : 'Edit Draft'}
							primaryTypographyProps={{ fontSize: '0.6rem', fontWeight: 500, color: isRejected ? '#dc2626' : 'inherit' }}
						/>
					</MenuItem>
				)}

				{isDraft && (
					<MenuItem onClick={handleDeleteClick} sx={{ py: 1.2, px: 2, color: '#dc2626' }}>
						<ListItemIcon sx={{ minWidth: '32px !important' }}>
							<DeleteIcon fontSize="small" sx={{ color: '#dc2626' }} />
						</ListItemIcon>
						<ListItemText primary="Delete Draft" primaryTypographyProps={{ fontSize: '0.6rem', fontWeight: 500 }} />
					</MenuItem>
				)}
			</Menu>

			<ConfirmationDialog
				open={deleteDialogOpen}
				title="Delete DSR Entry"
				message={`Are you sure you want to delete the timesheet for ${formatDate(entry.report_date)}?`}
				onClose={() => setDeleteDialogOpen(false)}
				onConfirm={handleDeleteConfirm}
				confirmLabel="Delete"
				severity="error"
			/>
		</>
	);
};

export default MySubmissionsRow;
