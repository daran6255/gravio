import React, { useState } from 'react';
import {
	Box,
	CircularProgress,
	Stack,
	TextField,
	InputAdornment,
	FormControlLabel,
	Switch,
	Typography,
	Paper,
	Grid,
	Chip
} from '@mui/material';
import { Search as SearchIcon, AccountTree as TreeIcon, GroupOff as UnassignedIcon } from '@mui/icons-material';
import {
	DndContext,
	DragOverlay,
	useSensor,
	useSensors,
	PointerSensor,
	type DragEndEvent,
	type DragStartEvent
} from '@dnd-kit/core';
import { OrgHierarchyTree } from './OrgHierarchyTree';
import { UnassignedGrid } from './UnassignedGrid';
import EnterpriseAvatar from '../../common/avatar/Avatar';
import { useManagerAllocation } from './hooks/useManagerAllocation';
import type { TeamMember } from '../../../models/user';

export const ManagerAllocationPanel: React.FC = () => {
	const {
		searchTerm, setSearchTerm,
		updatingUserPublicId,
		roleFilterOnlyManagers, setRoleFilterOnlyManagers,
		allUsers,
		usersLoading,
		filteredManagers,
		wouldCreateCycle,
		handleManagerChange,
		getOwnerId,
		getDirectReports,
		treeRoots,
		unassignedPool,
		subtreeMatchesSearch
	} = useManagerAllocation();

	const [activeUser, setActiveUser] = useState<TeamMember | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveUser((event.active.data.current?.user as TeamMember) ?? null);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveUser(null);
		const { active, over } = event;
		if (!over) return;

		const user = active.data.current?.user as TeamMember | undefined;
		if (!user) return;

		if (over.id === 'unassigned-pool') {
			if (user.reporting_manager_id == null) return;
			handleManagerChange(user, '');
			return;
		}

		const match = String(over.id).match(/^manager-(\d+)$/);
		if (!match) return;

		const targetOwnerId = Number(match[1]);
		const selfOwnerId = getOwnerId(user);
		if (targetOwnerId === selfOwnerId || targetOwnerId === user.reporting_manager_id) return;
		if (wouldCreateCycle(user.email, targetOwnerId)) return;

		handleManagerChange(user, targetOwnerId);
	};

	if (usersLoading && allUsers.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress size={40} />
			</Box>
		);
	}

	return (
		<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<Stack spacing={3}>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={1.5}
					alignItems={{ xs: 'stretch', sm: 'center' }}
					justifyContent="space-between"
				>
					<TextField
						size="small"
						placeholder="Search teammates by name, email, or role..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						sx={{ maxWidth: { sm: 360 }, flex: 1 }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
								</InputAdornment>
							)
						}}
					/>
					<FormControlLabel
						control={
							<Switch
								checked={roleFilterOnlyManagers}
								onChange={(e) => setRoleFilterOnlyManagers(e.target.checked)}
								size="small"
							/>
						}
						label={
							<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
								Limit assign options to Admins &amp; Managers
							</Typography>
						}
					/>
				</Stack>

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 8 }}>
						<Paper
							elevation={0}
							sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 5, bgcolor: 'background.paper' }}
						>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
								<TreeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
								<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
									Reporting Hierarchy
								</Typography>
							</Stack>
							<OrgHierarchyTree
								roots={treeRoots}
								searchTerm={searchTerm}
								subtreeMatchesSearch={subtreeMatchesSearch}
								getDirectReports={getDirectReports}
								getOwnerId={getOwnerId}
								filteredManagers={filteredManagers}
								wouldCreateCycle={wouldCreateCycle}
								onManagerChange={handleManagerChange}
								updatingUserPublicId={updatingUserPublicId}
							/>
						</Paper>
					</Grid>

					<Grid size={{ xs: 12, md: 4 }}>
						<Paper
							elevation={0}
							sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 5, bgcolor: 'background.paper', height: '100%' }}
						>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
								<UnassignedIcon sx={{ fontSize: 20, color: 'warning.main' }} />
								<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
									Unassigned
								</Typography>
								<Chip label={unassignedPool.length} size="small" sx={{ fontWeight: 700, borderRadius: 2 }} />
							</Stack>
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
								Drag a teammate onto a manager in the tree to assign them.
							</Typography>
							<UnassignedGrid
								users={unassignedPool.filter((u) => subtreeMatchesSearch(u, searchTerm))}
								filteredManagers={filteredManagers}
								onManagerChange={handleManagerChange}
								updatingUserPublicId={updatingUserPublicId}
							/>
						</Paper>
					</Grid>
				</Grid>
			</Stack>

			<DragOverlay>
				{activeUser ? (
					<Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1, boxShadow: 6 }}>
						<EnterpriseAvatar name={activeUser.full_name || activeUser.email} size={28} />
						<Typography variant="body2" sx={{ fontWeight: 700 }}>
							{activeUser.full_name || activeUser.username}
						</Typography>
					</Paper>
				) : null}
			</DragOverlay>
		</DndContext>
	);
};

export default ManagerAllocationPanel;
