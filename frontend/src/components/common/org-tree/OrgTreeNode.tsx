import React, { useState } from 'react';
import { Box, Stack, Typography, Chip, IconButton, Menu, MenuItem, Tooltip, CircularProgress, useTheme, alpha } from '@mui/material';
import {
	ExpandMore as ExpandMoreIcon,
	ChevronRight as CollapsedIcon,
	MoreVert as MoreIcon,
	Warning as WarningIcon,
	WorkspacePremium as RootIcon,
	DragIndicator as DragIcon
} from '@mui/icons-material';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import EnterpriseAvatar from '../avatar/Avatar';
import type { TeamMember } from '../../../models/user';
import type { CRMOwnerOption } from '../../../models/crm/owner';

export interface OrgTreeNodeProps {
	user: TeamMember;
	depth: number;
	getDirectReports: (user: TeamMember) => TeamMember[];
	getOwnerId: (user: TeamMember) => number | undefined;
	filteredManagers: CRMOwnerOption[];
	wouldCreateCycle: (employeeEmail: string, potentialManagerId: number | '') => boolean;
	onManagerChange: (user: TeamMember, newManagerId: number | '') => void;
	updatingUserPublicId: string | null;
	searchTerm: string;
	subtreeMatchesSearch: (user: TeamMember, query: string) => boolean;
	/** public_ids of everyone already rendered above this node in the current
	 * branch -- guards against any unexpected cyclic reporting_manager_id data
	 * recursing forever, beyond the self-loop case already filtered upstream. */
	ancestorIds?: ReadonlySet<string>;
}

const getRoleColor = (role: string): 'error' | 'warning' | 'primary' => {
	switch (role) {
		case 'admin': return 'error';
		case 'manager': return 'warning';
		default: return 'primary';
	}
};

const OrgTreeNode: React.FC<OrgTreeNodeProps> = (props) => {
	const {
		user, depth, getDirectReports, getOwnerId, filteredManagers,
		wouldCreateCycle, onManagerChange, updatingUserPublicId, searchTerm, subtreeMatchesSearch,
		ancestorIds
	} = props;

	const theme = useTheme();
	const [expanded, setExpanded] = useState(true);
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

	const ownerId = getOwnerId(user);
	const nextAncestorIds = new Set(ancestorIds);
	nextAncestorIds.add(user.public_id);
	const directReports = getDirectReports(user)
		.filter((child) => !nextAncestorIds.has(child.public_id))
		.filter((child) => subtreeMatchesSearch(child, searchTerm));
	const hasChildren = directReports.length > 0;
	const isUpdating = updatingUserPublicId === user.public_id;
	const isRoot = depth === 0;
	const roleMismatch = hasChildren && user.role !== 'admin' && user.role !== 'manager';

	const droppableId = ownerId != null ? `manager-${ownerId}` : `manager-none-${user.public_id}`;
	const { setNodeRef: setDropRef, isOver } = useDroppable({ id: droppableId, disabled: ownerId == null });
	const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
		id: user.public_id,
		data: { user },
		disabled: isUpdating
	});

	const hasOtherManagers = filteredManagers.some((m) => m.id !== ownerId && !wouldCreateCycle(user.email, m.id));

	return (
		<Box sx={{ position: 'relative' }}>
			<Box
				ref={setDropRef}
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					borderRadius: 3,
					border: '1px solid',
					borderColor: isOver ? 'primary.main' : 'divider',
					bgcolor: isOver ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
					boxShadow: isOver ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}` : 'none',
					p: 1,
					pr: 1.5,
					opacity: isDragging ? 0.4 : 1,
					transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease'
				}}
			>
				<IconButton
					size="small"
					onClick={() => setExpanded((e) => !e)}
					sx={{ visibility: hasChildren ? 'visible' : 'hidden', width: 28, height: 28, flexShrink: 0 }}
				>
					{expanded ? <ExpandMoreIcon fontSize="small" /> : <CollapsedIcon fontSize="small" />}
				</IconButton>

				<Box
					ref={setDragRef}
					{...listeners}
					{...attributes}
					sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1, minWidth: 0, cursor: isUpdating ? 'default' : 'grab', touchAction: 'none' }}
				>
					<DragIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
					<EnterpriseAvatar name={user.full_name || user.email} size={32} />
					<Box sx={{ minWidth: 0 }}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
								{user.full_name || user.username}
							</Typography>
							{isRoot && (
								<Tooltip title="Top of the reporting chain" arrow>
									<RootIcon sx={{ fontSize: 14, color: 'warning.main' }} />
								</Tooltip>
							)}
						</Stack>
						<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
							{user.email}
						</Typography>
					</Box>
				</Box>

				<Chip
					label={user.role.toUpperCase()}
					color={getRoleColor(user.role)}
					size="small"
					variant="outlined"
					sx={{ fontWeight: 700, borderRadius: 2, fontSize: '0.65rem', flexShrink: 0 }}
				/>

				{roleMismatch && (
					<Tooltip title="This teammate has direct reports but isn't an Admin or Manager, so they can't approve timesheets yet." arrow>
						<WarningIcon color="warning" sx={{ fontSize: 16, flexShrink: 0 }} />
					</Tooltip>
				)}

				{hasChildren && (
					<Chip
						label={`${directReports.length} report${directReports.length === 1 ? '' : 's'}`}
						size="small"
						sx={{ fontWeight: 700, borderRadius: 2, fontSize: '0.65rem', bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', flexShrink: 0 }}
					/>
				)}

				{isUpdating ? (
					<CircularProgress size={18} sx={{ flexShrink: 0 }} />
				) : (
					<IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ flexShrink: 0 }}>
						<MoreIcon fontSize="small" />
					</IconButton>
				)}

				<Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
					<MenuItem disabled sx={{ opacity: '1 !important', fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
						Reassign Manager
					</MenuItem>
					<MenuItem
						onClick={() => { onManagerChange(user, ''); setMenuAnchor(null); }}
						disabled={user.reporting_manager_id == null}
					>
						<em>Unassigned / None</em>
					</MenuItem>
					{filteredManagers.map((m) => {
						const isSelf = m.id === ownerId;
						const selfBlocked = isSelf && hasOtherManagers;
						const isCircular = !isSelf && wouldCreateCycle(user.email, m.id);
						return (
							<MenuItem
								key={m.id}
								onClick={() => { onManagerChange(user, m.id); setMenuAnchor(null); }}
								disabled={selfBlocked || isCircular || m.id === user.reporting_manager_id}
							>
								{m.full_name || m.email}
								{isSelf && !selfBlocked && ' (Self — no other manager available)'}
								{isCircular && ' (Loop)'}
							</MenuItem>
						);
					})}
				</Menu>
			</Box>

			{hasChildren && expanded && (
				<Box sx={{ ml: 2.5, pl: 2, mt: 1, borderLeft: '2px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
					{directReports.map((child) => (
						<OrgTreeNode key={child.public_id} {...props} user={child} depth={depth + 1} ancestorIds={nextAncestorIds} />
					))}
				</Box>
			)}
		</Box>
	);
};

export default OrgTreeNode;
