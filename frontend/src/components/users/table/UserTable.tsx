import React, { useState, useCallback, useEffect } from 'react';
import {
	TableRow,
	TableCell,
	Chip,
	Typography,
	useMediaQuery,
	useTheme
} from '@mui/material';
import { Block, CheckCircleOutline, Delete, MailOutline } from '@mui/icons-material';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTeamUsers } from '../../../store/slices/userSlice';
import type { TeamMember } from '../../../models/user';

import { DataTable, DataTableActions, type TableMenuAction } from '../../common/table';
import { useUserTableConfig, getRoleColor } from './UserTableConfig';

interface UserTableProps {
	refreshKey: number;
	onAddUser?: () => void;
	onDeactivateUser: (user: TeamMember) => void;
	onReactivateUser: (user: TeamMember) => void;
	onResendInvite: (user: TeamMember) => void;
	onCancelInvite: (user: TeamMember) => void;
}

const UserTable: React.FC<UserTableProps> = ({
	refreshKey,
	onAddUser,
	onDeactivateUser,
	onReactivateUser,
	onResendInvite,
	onCancelInvite,
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const isMedium = useMediaQuery(theme.breakpoints.down('md'));

	const { user: currentUser } = useAppSelector((state) => state.auth);
	const { users, loading, total } = useAppSelector((state) => state.users);

	// MUI's DataTable is 0-indexed; the backend's `page` is 1-indexed.
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);

	const { columns } = useUserTableConfig({ isMobile, isMedium });

	const fetchData = useCallback(() => {
		dispatch(fetchTeamUsers({ page: page + 1, pageSize: rowsPerPage }));
	}, [dispatch, page, rowsPerPage]);

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetchData, refreshKey]);

	const getRowActions = (user: TeamMember): TableMenuAction<TeamMember>[] => {
		const actions: TableMenuAction<TeamMember>[] = [];

		if (!user.is_verified) {
			actions.push({
				label: 'Resend Invite',
				icon: <MailOutline fontSize="small" />,
				onClick: () => onResendInvite(user),
				color: 'primary.main',
			});
			actions.push({
				label: 'Cancel Invite',
				icon: <Delete fontSize="small" />,
				onClick: () => onCancelInvite(user),
				color: 'error.main',
			});
		} else {
			if (user.is_active) {
				actions.push({
					label: 'Deactivate',
					icon: <Block fontSize="small" />,
					onClick: () => onDeactivateUser(user),
					color: 'error.main',
					hidden: user.public_id === currentUser?.public_id,
				});
			} else {
				actions.push({
					label: 'Reactivate',
					icon: <CheckCircleOutline fontSize="small" />,
					onClick: () => onReactivateUser(user),
					color: 'success.main',
				});
			}
		}

		return actions;
	};

	const renderRow = (user: TeamMember) => (
		<TableRow key={user.public_id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
			<TableCell>
				<Typography variant="body2" sx={{ fontWeight: 500 }}>
					{user.full_name || '-'}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{user.email}
				</Typography>
			</TableCell>
			{!isMedium && (
				<TableCell>
					<Typography variant="body2" color="text.secondary">
						{user.username}
					</Typography>
				</TableCell>
			)}
			{!isMobile && (
				<TableCell>
					<Chip
						label={user.role.toUpperCase()}
						color={getRoleColor(user.role)}
						size="small"
						variant="outlined"
						sx={{ fontWeight: 600, borderRadius: 0, fontSize: '0.75rem' }}
					/>
				</TableCell>
			)}
			<TableCell>
				<Chip
					label={user.is_active ? 'Active' : 'Inactive'}
					size="small"
					variant="outlined"
					sx={{
						fontWeight: 700,
						borderRadius: '2px',
						fontSize: '0.7rem',
						minWidth: 70,
						height: 24,
						textTransform: 'none',
						bgcolor: user.is_active ? '#f3f9ff' : '#f8f9fa',
						color: user.is_active ? '#0073bb' : '#5c7080',
						borderColor: user.is_active ? '#0073bb' : '#d5dbdb',
						'& .MuiChip-label': { px: 1.5 }
					}}
				/>
			</TableCell>
			{!isMobile && (
				<TableCell>
					<Chip
						label={user.is_verified ? 'Accepted' : 'Pending'}
						size="small"
						variant="outlined"
						color={user.is_verified ? 'success' : 'default'}
						sx={{ fontWeight: 600, fontSize: '0.7rem' }}
					/>
				</TableCell>
			)}
			<TableCell align="right">
				<DataTableActions item={user} actions={getRowActions(user)} />
			</TableCell>
		</TableRow>
	);

	return (
		<DataTable<TeamMember>
			columns={columns}
			data={users}
			loading={loading}
			totalCount={total}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={(_e, p) => setPage(p)}
			onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
			searchTerm=""
			onRefresh={fetchData}
			onCreateClick={onAddUser}
			createButtonText="Invite Teammate"
			renderRow={renderRow}
			emptyMessage="No teammates yet — invite your first one."
		/>
	);
};

export default UserTable;
