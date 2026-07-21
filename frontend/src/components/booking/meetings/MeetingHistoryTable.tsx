import React from 'react';
import { TableRow, TableCell, Typography, Stack, MenuItem, TextField, Tooltip } from '@mui/material';
import { VideocamOutlined, PlaceOutlined, PhoneOutlined, HelpOutline } from '@mui/icons-material';
import dayjs from 'dayjs';
import { DataTable, type ColumnDefinition } from '../../common/table';
import StatusBadge from '../../common/badge/StatusBadge';
import EnterpriseAvatar from '../../common/avatar/Avatar';
import type { MeetingLocationType, MeetingStatus, ScheduledMeetingHost } from '../../../models/booking/meeting';

const LOCATION_ICON: Record<MeetingLocationType, React.ReactElement> = {
	google_meet: <VideocamOutlined sx={{ fontSize: 16 }} />,
	offline: <PlaceOutlined sx={{ fontSize: 16 }} />,
	phone: <PhoneOutlined sx={{ fontSize: 16 }} />,
};

const STATUS_OPTIONS: { value: MeetingStatus | ''; label: string }[] = [
	{ value: '', label: 'All statuses' },
	{ value: 'scheduled', label: 'Scheduled' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
];

function formatDuration(startIso: string, endIso: string): string {
	const minutes = dayjs(endIso).diff(dayjs(startIso), 'minute');
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h <= 0) return `${m}m`;
	return m ? `${h}h ${m}m` : `${h}h`;
}

interface MeetingHistoryTableProps {
	meetings: ScheduledMeetingHost[];
	loading: boolean;
	totalCount: number;
	page: number;
	rowsPerPage: number;
	onPageChange: (event: unknown, newPage: number) => void;
	onRowsPerPageChange: (newRowsPerPage: number) => void;
	searchTerm: string;
	onSearchChange: (value: string) => void;
	statusFilter: MeetingStatus | '';
	onStatusFilterChange: (value: MeetingStatus | '') => void;
	onRefresh: () => void;
	/** Adds a Host column — used by the manager/admin team view (gap 7). */
	showHost?: boolean;
}

const MeetingHistoryTable: React.FC<MeetingHistoryTableProps> = ({
	meetings, loading, totalCount, page, rowsPerPage, onPageChange, onRowsPerPageChange,
	searchTerm, onSearchChange, statusFilter, onStatusFilterChange, onRefresh, showHost,
}) => {
	const columns: ColumnDefinition<ScheduledMeetingHost>[] = [
		{ id: 'client_name', label: 'Client' },
		{ id: 'meeting_title', label: 'Title', hideOnMobile: true },
		{ id: 'start_time', label: 'Date / Time' },
		{ id: 'end_time', label: 'Duration', hideOnMobile: true },
		{ id: 'location_type', label: 'Location', hideOnMobile: true },
		...(showHost ? [{ id: 'host_name', label: 'Host', hideOnMobile: true } as ColumnDefinition<ScheduledMeetingHost>] : []),
		{ id: 'status', label: 'Status' },
	];

	const renderRow = (meeting: ScheduledMeetingHost) => (
		<TableRow key={meeting.public_id} hover>
			<TableCell>
				<Stack direction="row" spacing={1} alignItems="center">
					<EnterpriseAvatar name={meeting.client_name} size={28} />
					<Stack sx={{ minWidth: 0 }}>
						<Typography variant="body2" fontWeight={600} noWrap>{meeting.client_name}</Typography>
						<Typography variant="caption" color="text.secondary" noWrap>{meeting.client_email}</Typography>
					</Stack>
				</Stack>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				{meeting.meeting_title || '—'}
			</TableCell>
			<TableCell>
				<Typography variant="body2" noWrap>{dayjs(meeting.start_time).format('MMM D, YYYY')}</Typography>
				<Typography variant="caption" color="text.secondary" noWrap>{dayjs(meeting.start_time).format('h:mm A')}</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				{formatDuration(meeting.start_time, meeting.end_time)}
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Stack direction="row" spacing={0.75} alignItems="center">
					{LOCATION_ICON[meeting.location_type]}
					<Typography variant="caption" color="text.secondary" noWrap>
						{meeting.location_type === 'offline' ? 'In person' : meeting.location_type === 'phone' ? 'Phone' : 'Video'}
					</Typography>
				</Stack>
			</TableCell>
			{showHost && (
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					<Typography variant="body2" noWrap>{meeting.host_name || '—'}</Typography>
				</TableCell>
			)}
			<TableCell>
				<Stack spacing={0.5}>
					<StatusBadge label={meeting.status} status={meeting.status} type="meeting" />
					{meeting.outcome_notes && (
						<Tooltip title={meeting.outcome_notes} arrow placement="top">
							<Stack direction="row" spacing={0.4} alignItems="center" sx={{ cursor: 'help' }}>
								<HelpOutline sx={{ fontSize: 12, color: 'text.disabled' }} />
								<Typography variant="caption" color="text.disabled">Notes</Typography>
							</Stack>
						</Tooltip>
					)}
				</Stack>
			</TableCell>
		</TableRow>
	);

	return (
		<DataTable<ScheduledMeetingHost>
			columns={columns}
			data={meetings}
			loading={loading}
			totalCount={totalCount}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			searchTerm={searchTerm}
			onSearchChange={onSearchChange}
			searchPlaceholder="Search by client name or email..."
			onRefresh={onRefresh}
			renderRow={renderRow}
			emptyMessage="No meetings found for this filter."
			headerActions={
				<TextField
					select size="small" value={statusFilter}
					onChange={(e) => onStatusFilterChange(e.target.value as MeetingStatus | '')}
					sx={{ minWidth: 160 }}
				>
					{STATUS_OPTIONS.map((opt) => <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>)}
				</TextField>
			}
		/>
	);
};

export default MeetingHistoryTable;
