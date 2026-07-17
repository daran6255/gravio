import React, { useState, useCallback, useEffect } from 'react';
import { TableRow, TableCell, Chip, Typography, useMediaQuery, useTheme, Button, Checkbox, alpha } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTeamUsers } from '../../../store/slices/userSlice';
import type { TeamMember } from '../../../models/user';
import { DataTable } from '../../common/table';
import { useOrgUserTableConfig, getRoleColor } from './OrgUserTableConfig';

interface OrgUserTableProps {
	refreshKey: number;
	onAddUser?: () => void;
	onEditUser: (user: TeamMember) => void;
	onDeactivateUser: (user: TeamMember) => void;
	onReactivateUser: (user: TeamMember) => void;
	onResendInvite: (user: TeamMember) => void;
	onDeleteUser: (user: TeamMember) => void;
	selectedIds: string[];
	onSelectId: (id: string, checked: boolean) => void;
	onSelectAll: (checked: boolean) => void;
	onBulkDelete: () => void;
	onUserClick?: (user: TeamMember) => void;
}

export const OrgUserTable: React.FC<OrgUserTableProps> = ({
	refreshKey,
	onAddUser,
	selectedIds,
	onSelectId,
	onSelectAll,
	onBulkDelete,
	onUserClick,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const isMedium = useMediaQuery(theme.breakpoints.down('md'));

	const { user: currentUser } = useAppSelector((state) => state.auth);
	const { users, loading, total } = useAppSelector((state) => state.users);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);

	const { columns } = useOrgUserTableConfig({ isMobile, isMedium });

	const fetchData = useCallback(() => {
		dispatch(fetchTeamUsers({ page: page + 1, pageSize: rowsPerPage }));
	}, [dispatch, page, rowsPerPage]);

	useEffect(() => {
		fetchData();
	}, [fetchData, refreshKey]);



	const headerActions = selectedIds.length > 0 ? (
		<Button
			variant="contained" color="error" startIcon={<Delete />} onClick={onBulkDelete} size="small"
			sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, boxShadow: 'none', '&:hover': { bgcolor: 'error.dark', boxShadow: 'none' } }}
		>
			Delete Selected ({selectedIds.length})
		</Button>
	) : null;

	const renderRow = (user: TeamMember) => {
		const isSelected = selectedIds.includes(user.public_id);
		const isSelf = user.public_id === currentUser?.public_id;
		return (
			<TableRow
				key={user.public_id}
				selected={isSelected}
				onClick={() => onUserClick?.(user)}
				sx={{
					cursor: 'pointer',
					transition: 'background-color 0.2s ease',
					'&:hover': {
						bgcolor: isDark ? alpha(theme.palette.common.white, 0.02) : alpha(theme.palette.primary.main, 0.02),
					},
					'&:last-child td': { borderBottom: 0 }
				}}
			>
				<TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
					<Checkbox checked={isSelected} onChange={(e) => onSelectId(user.public_id, e.target.checked)} disabled={isSelf} size="small" />
				</TableCell>
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
						{user.full_name || '-'}
					</Typography>
				</TableCell>
				<TableCell><Typography variant="body2" color="text.secondary">{user.email}</Typography></TableCell>
				{!isMedium && <TableCell><Typography variant="body2" color="text.secondary">{user.username}</Typography></TableCell>}
				{!isMobile && (
					<TableCell>
						<Chip label={user.role.toUpperCase()} color={getRoleColor(user.role)} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: 0, fontSize: '0.75rem' }} />
					</TableCell>
				)}
				<TableCell>
					<Chip
						label={user.is_active ? 'Active' : 'Inactive'} size="small" variant="outlined"
						sx={{
							fontWeight: 700, borderRadius: '2px', fontSize: '0.7rem', minWidth: 70, height: 24, textTransform: 'none',
							bgcolor: user.is_active ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.text.secondary, 0.1), 
							color: user.is_active ? theme.palette.success.main : theme.palette.text.secondary,
							borderColor: user.is_active ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.text.secondary, 0.3), 
							'& .MuiChip-label': { px: 1.5 }
						}}
					/>
				</TableCell>
				{!isMobile && (
					<TableCell>
						<Chip label={user.is_verified ? 'Accepted' : 'Pending'} size="small" variant="outlined" color={user.is_verified ? 'success' : 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
					</TableCell>
				)}
			</TableRow>
		);
	};

	return (
		<DataTable<TeamMember>
			columns={columns} data={users} loading={loading} totalCount={total} page={page} rowsPerPage={rowsPerPage}
			onPageChange={(_e, p) => setPage(p)} onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
			searchTerm="" onRefresh={fetchData} onCreateClick={onAddUser} createButtonText="Invite Teammate"
			renderRow={renderRow} emptyMessage="No teammates yet — invite your first one."
			numSelected={selectedIds.length} onSelectAllClick={(e) => onSelectAll(e.target.checked)} headerActions={headerActions}
		/>
	);
};

export default OrgUserTable;
