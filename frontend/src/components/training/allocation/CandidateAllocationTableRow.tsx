import React, { memo } from 'react';
import {
	TableRow,
	TableCell,
	Box,
	Typography,
	FormControl,
	Select,
	MenuItem,
	Tooltip,
	IconButton,
	Avatar,
	Stack,
	useTheme,
	alpha
} from '@mui/material';
import {
	MailOutline as MailIcon,
	PhoneIphone as PhoneIcon,
	SwapHoriz as MoveIcon
} from '@mui/icons-material';
import type { CandidateAllocation } from '../../../models/training';

interface CandidateAllocationTableRowProps {
	allocation: CandidateAllocation;
	updatingStatusId: string | null;
	onStatusChange: (publicId: string, status: string) => void;
	onMove: (allocation: CandidateAllocation) => void;
	getAllocationStatusColor: (status: string) => string;
	ALLOCATION_STATUSES: string[];
}

const CandidateAllocationTableRow: React.FC<CandidateAllocationTableRowProps> = memo(({
	allocation,
	updatingStatusId,
	onStatusChange,
	onMove,
	getAllocationStatusColor,
	ALLOCATION_STATUSES
}) => {
	const theme = useTheme();
	const isDropout = allocation.is_dropout || allocation.status === 'dropped_out';
	// Handle backward compatibility if status comes as object
	const statusStr = typeof allocation.status === 'string' ? allocation.status : (allocation.status as any)?.current;
	const currentStatus = isDropout ? 'dropped_out' : (statusStr || 'allocated');

	const getDisplayStatus = (status: string) => {
		switch (status) {
			case 'allocated': return 'Allocated';
			case 'in_training': return 'In Training';
			case 'completed': return 'Completed';
			case 'dropped_out': return 'Drop Out';
			case 'moved_to_placement': return 'Moved to placement';
			default: return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
		}
	};

	return (
		<TableRow
			hover
			sx={{
				'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
				transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
				'& td': { py: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5) }
			}}
		>
			<TableCell>
				<Stack direction="row" spacing={2} alignItems="center">
					<Avatar
						sx={{
							width: 36,
							height: 36,
							fontSize: '0.875rem',
							fontWeight: 700,
							bgcolor: isDropout ? alpha(theme.palette.text.disabled, 0.1) : alpha(theme.palette.primary.main, 0.08),
							color: isDropout ? 'text.disabled' : 'primary.main',
							border: '1px solid',
							borderColor: isDropout ? alpha(theme.palette.text.disabled, 0.2) : alpha(theme.palette.primary.main, 0.15),
							boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
						}}
					>
						{allocation.candidate?.name?.[0] || 'C'}
					</Avatar>
					<Box>
						<Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: isDropout ? 'text.disabled' : 'text.primary', mb: 0 }}>
							{allocation.candidate?.name}
						</Typography>
						{isDropout && (
							<Typography variant="caption" sx={{ fontWeight: 800, color: 'error.main', fontSize: '0.6rem', letterSpacing: '0.05em', textTransform: 'uppercase', bgcolor: alpha(theme.palette.error.main, 0.08), px: 0.75, py: 0.1, borderRadius: 0.5 }}>
								DROPOUT
							</Typography>
						)}
					</Box>
				</Stack>
			</TableCell>
			<TableCell>
				<Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'capitalize', fontSize: '0.8125rem' }}>
					{allocation.candidate?.gender || '-'}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8125rem' }}>
					{allocation.candidate?.disability_details?.disability_type || allocation.candidate?.disability_details?.type || '-'}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8125rem' }}>
					{allocation.candidate?.education_details?.degrees?.[0]?.degree_name || '-'}
				</Typography>
			</TableCell>
			<TableCell>
				<Stack spacing={0.5}>
					<Stack direction="row" spacing={1} alignItems="center">
						<MailIcon sx={{ fontSize: 14, color: 'text.disabled', opacity: 0.8 }} />
						<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>{allocation.candidate?.email}</Typography>
					</Stack>
					<Stack direction="row" spacing={1} alignItems="center">
						<PhoneIcon sx={{ fontSize: 14, color: 'text.disabled', opacity: 0.8 }} />
						<Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem' }}>{allocation.candidate?.phone}</Typography>
					</Stack>
				</Stack>
			</TableCell>
			<TableCell>
				<FormControl size="small" sx={{ minWidth: 160 }}>
					<Select
						value={currentStatus}
						onChange={(e) => onStatusChange(allocation.public_id, e.target.value)}
						disabled={updatingStatusId === allocation.public_id}
						variant="outlined"
						sx={{
							height: 28,
							fontSize: '0.65rem',
							fontWeight: 800,
							bgcolor: alpha(getAllocationStatusColor(currentStatus), 0.05),
							borderRadius: 1,
							'& .MuiSelect-select': {
								py: 0,
								display: 'flex',
								alignItems: 'center',
								gap: 1.5,
								color: getAllocationStatusColor(currentStatus),
								textTransform: 'uppercase',
								letterSpacing: '0.05em'
							},
							'& fieldset': {
								borderColor: alpha(getAllocationStatusColor(currentStatus), 0.2),
							},
							'&:hover fieldset': { 
								borderColor: `${getAllocationStatusColor(currentStatus)} !important`,
							}
						}}
						renderValue={(selected) => (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{
									width: 6,
									height: 6,
									borderRadius: '50%',
									bgcolor: getAllocationStatusColor(selected as string),
									boxShadow: `0 0 0 2px ${alpha(getAllocationStatusColor(selected as string), 0.2)}`
								}} />
								{getDisplayStatus(selected as string)}
							</Box>
						)}
					>
						{ALLOCATION_STATUSES.map(s => (
							<MenuItem key={s} value={s} sx={{ fontSize: '0.75rem', fontWeight: 700, py: 1 }}>
								<Box component="span" sx={{
									display: 'inline-block',
									width: 8,
									height: 8,
									borderRadius: '50%',
									bgcolor: getAllocationStatusColor(s),
									mr: 1.5
								}} />
								{getDisplayStatus(s)}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				{allocation.dropout_remark && (
					<Tooltip title={allocation.dropout_remark}>
						<Typography
							variant="caption"
							sx={{
								display: 'block',
								maxWidth: 160,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								color: 'error.main',
								fontWeight: 600,
								mt: 0.5,
								fontSize: '0.6rem'
							}}
						>
							REASON: {allocation.dropout_remark}
						</Typography>
					</Tooltip>
				)}
			</TableCell>
			<TableCell align="right">
				<Stack direction="row" spacing={0.5} justifyContent="flex-end">
					<Tooltip title="Move to different batch">
						<IconButton
							size="small"
							onClick={() => onMove(allocation)}
							sx={{
								color: 'text.secondary',
								transition: 'all 0.2s',
								'&:hover': { 
									color: 'primary.main',
									bgcolor: alpha(theme.palette.primary.main, 0.08)
								}
							}}
						>
							<MoveIcon sx={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>
				</Stack>
			</TableCell>
		</TableRow>
	);
});

CandidateAllocationTableRow.displayName = 'CandidateAllocationTableRow';

export default CandidateAllocationTableRow;
