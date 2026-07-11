import React, { useState } from 'react';
import { Box, Card, Stack, Typography, IconButton, Menu, MenuItem, useTheme, alpha } from '@mui/material';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { MoreVert as MoreIcon, DragIndicator as DragIcon, GroupOff as EmptyIcon } from '@mui/icons-material';
import EnterpriseAvatar from '../../common/avatar/Avatar';
import type { TeamMember } from '../../../models/user';
import type { CRMOwnerOption } from '../../../models/crm/owner';

interface UnassignedCardProps {
	user: TeamMember;
	filteredManagers: CRMOwnerOption[];
	onManagerChange: (user: TeamMember, newManagerId: number | '') => void;
	isUpdating: boolean;
}

const UnassignedCard: React.FC<UnassignedCardProps> = ({ user, filteredManagers, onManagerChange, isUpdating }) => {
	const theme = useTheme();
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: user.public_id,
		data: { user },
		disabled: isUpdating
	});

	return (
		<Card
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			variant="outlined"
			sx={{
				p: 1.25,
				borderRadius: 3,
				borderStyle: 'dashed',
				borderColor: alpha(theme.palette.warning.main, 0.4),
				bgcolor: alpha(theme.palette.warning.main, 0.04),
				cursor: isUpdating ? 'default' : 'grab',
				touchAction: 'none',
				opacity: isDragging ? 0.4 : 1,
				transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
				'&:hover': { borderColor: 'warning.main', boxShadow: `0 4px 16px ${alpha(theme.palette.warning.main, 0.15)}` }
			}}
		>
			<Stack direction="row" alignItems="center" spacing={1}>
				<DragIcon sx={{ fontSize: 15, color: 'text.disabled', flexShrink: 0 }} />
				<EnterpriseAvatar name={user.full_name || user.email} size={30} />
				<Box sx={{ minWidth: 0, flex: 1 }}>
					<Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
						{user.full_name || user.username}
					</Typography>
					<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
						{user.email}
					</Typography>
				</Box>
				<IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ flexShrink: 0 }}>
					<MoreIcon fontSize="small" />
				</IconButton>
			</Stack>
			<Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
				<MenuItem disabled sx={{ opacity: '1 !important', fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
					Assign Manager
				</MenuItem>
				{filteredManagers.map((m) => (
					<MenuItem key={m.id} onClick={() => { onManagerChange(user, m.id); setMenuAnchor(null); }}>
						{m.full_name || m.email}
					</MenuItem>
				))}
			</Menu>
		</Card>
	);
};

interface UnassignedGridProps {
	users: TeamMember[];
	filteredManagers: CRMOwnerOption[];
	onManagerChange: (user: TeamMember, newManagerId: number | '') => void;
	updatingUserPublicId: string | null;
}

export const UnassignedGrid: React.FC<UnassignedGridProps> = ({ users, filteredManagers, onManagerChange, updatingUserPublicId }) => {
	const { setNodeRef, isOver } = useDroppable({ id: 'unassigned-pool' });

	return (
		<Box
			ref={setNodeRef}
			sx={{
				display: 'flex',
				flexDirection: 'column',
				gap: 1.25,
				minHeight: 140,
				p: isOver ? 1 : 0,
				borderRadius: 3,
				border: '2px dashed',
				borderColor: isOver ? 'warning.main' : 'transparent',
				transition: 'border-color 0.15s ease'
			}}
		>
			{users.length === 0 ? (
				<Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
					<EmptyIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
					<Typography variant="caption" color="text.secondary">
						Everyone has a manager.
					</Typography>
				</Stack>
			) : (
				users.map((user) => (
					<UnassignedCard
						key={user.public_id}
						user={user}
						filteredManagers={filteredManagers}
						onManagerChange={onManagerChange}
						isUpdating={updatingUserPublicId === user.public_id}
					/>
				))
			)}
		</Box>
	);
};

export default UnassignedGrid;
