import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	TableRow,
	TableCell,
	Chip,
	Typography,
	useMediaQuery,
	useTheme
} from '@mui/material';

import { WhatsApp as WhatsAppIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchUsers as fetchUsersThunk, fetchRoles } from '../../../store/slices/userSlice';
import type { User } from '../../../models/user';

// Import modular table components
import { DataTable, DataTableActions } from '../../common/table';
import { useUserTableConfig, getRoleColor } from './UserTableConfig';
import FilterDrawer, { type FilterField } from '../../common/drawer/FilterDrawer';
import useDateTime from '../../../hooks/useDateTime';

interface UserTableProps {
	onAddUser?: () => void;
	onEditUser?: (user: User) => void;
	onViewUser?: (user: User) => void;
	onDeleteUser?: (user: User) => void;
}

const UserTable: React.FC<UserTableProps> = ({ onAddUser, onEditUser, onViewUser, onDeleteUser }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { formatDate } = useDateTime();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const isMedium = useMediaQuery(theme.breakpoints.down('md'));

	// Redux state
	const { user: currentUser } = useAppSelector((state) => state.auth);
	const { users, loading, totalCount, roles } = useAppSelector((state) => state.users);

	// Local UI state
	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);

	// Filtering state
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [activeFilters, setActiveFilters] = useState<Record<string, any>>({ role: '' });
	const [tempFilters, setTempFilters] = useState<Record<string, any>>({ role: '' });

	// Fetch roles on mount
	useEffect(() => {
		dispatch(fetchRoles());
	}, [dispatch]);

	// Table Configuration Hook
	const { columns, rowActions } = useUserTableConfig({
		isMobile,
		isMedium,
		currentUser,
		onViewUser,
		onEditUser,
		onDeleteUser
	});

	// Fetch users logic via Redux Thunk
	const fetchUsersData = useCallback(() => {
		dispatch(fetchUsersThunk({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search: searchTerm,
			role: activeFilters.role || undefined
		}));
	}, [dispatch, page, rowsPerPage, searchTerm, activeFilters.role]);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchUsersData();
		}, 500);
		return () => clearTimeout(timer);
	}, [fetchUsersData]);

	// Synchronize temp filters when drawer opens
	useEffect(() => {
		if (isFilterOpen) {
			setTempFilters(activeFilters);
		}
	}, [isFilterOpen, activeFilters]);

	// Filter Field definitions
	const filterFields = useMemo((): FilterField[] => [
		{
			key: 'role',
			label: 'System Role',
			type: 'single-select',
			options: roles.map(r => ({
				value: r,
				label: r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')
			}))
		}
	], [roles]);

	// Filter Handlers
	const handleFilterChange = useCallback((key: string, value: any) => {
		setTempFilters(prev => ({ ...prev, [key]: value }));
	}, []);

	const handleApplyFilters = () => {
		setActiveFilters(tempFilters);
		setPage(0);
		setIsFilterOpen(false);
	};

	const handleClearFilters = () => {
		const cleared = { role: '' };
		setTempFilters(cleared);
		setActiveFilters(cleared);
		setPage(0);
		setIsFilterOpen(false);
	};

	const activeFilterCount = Object.values(activeFilters).filter(v => v !== '' && v !== null).length;

	const renderRow = (user: User) => (
		<TableRow
			key={user.id}
			sx={{
				'&:hover': { bgcolor: '#f5f8fa' },
				'&:last-child td': { borderBottom: 0 }
			}}
		>
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
			<TableCell>
				{user.mobile ? (() => {
					const cleanPhone = user.mobile.replace(/\D/g, '');
					const displayPhone = cleanPhone.length === 12 && cleanPhone.startsWith('91')
						? `+91 - ${cleanPhone.slice(2)}`
						: cleanPhone.length === 10
							? `+91 - ${cleanPhone}`
							: user.mobile;

					return (
						<Chip
							icon={<WhatsAppIcon sx={{ fontSize: '1.1rem !important', color: '#075E54 !important' }} />}
							label={displayPhone}
							size="small"
							variant="outlined"
							onClick={() => window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}`, '_blank')}
							sx={{
								borderColor: '#075E54',
								color: '#075E54',
								fontWeight: 600,
								borderRadius: '4px',
								'&:hover': {
									bgcolor: alpha('#25D366', 0.1),
									borderColor: '#128C7E'
								},
								'& .MuiChip-label': { px: 1 }
							}}
						/>
					);
				})() : '-'}
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
						variant={'outlined'}
						sx={{ fontWeight: 600, borderRadius: 0, fontSize: '0.75rem' }}
					/>
				</TableCell>
			)}
			{!isMobile && (
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
			)}
			{!isMedium && (
				<TableCell>
					<Typography variant="body2" color="text.secondary">
						{user.created_at ? formatDate(user.created_at) : '-'}
					</Typography>
				</TableCell>
			)}
			<TableCell align="right">
				<DataTableActions item={user} actions={rowActions} />
			</TableCell>
		</TableRow>
	);

	return (
		<>
			<DataTable<User>
				columns={columns}
				data={users}
				loading={loading}
				totalCount={totalCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_e, p) => setPage(p)}
				onRowsPerPageChange={setRowsPerPage}
				searchTerm={searchTerm}
				onSearchChange={(val) => { setSearchTerm(val); setPage(0); }}
				searchPlaceholder="Search users..."
				onRefresh={fetchUsersData}
				onFilterOpen={() => setIsFilterOpen(true)}
				activeFilterCount={activeFilterCount}
				onCreateClick={onAddUser}
				createButtonText="Add User"
				renderRow={renderRow}
				emptyMessage="No users found"
			/>

			<FilterDrawer
				open={isFilterOpen}
				onClose={() => setIsFilterOpen(false)}
				fields={filterFields}
				activeFilters={tempFilters}
				onFilterChange={handleFilterChange}
				onApplyFilters={handleApplyFilters}
				onClearFilters={handleClearFilters}
			/>
		</>
	);
};

export default UserTable;
