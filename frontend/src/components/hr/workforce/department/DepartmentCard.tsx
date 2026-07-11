import React from 'react';
import { Box, Typography, Avatar, Chip, Card, CardContent, IconButton, Tooltip, Divider, alpha, useTheme } from '@mui/material';
import {
	AccountTreeOutlined as DeptIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	PeopleAlt as PeopleIcon,
	WorkOutlined as DesignationIcon,
	PersonOutlined as HODIcon,
} from '@mui/icons-material';
import type { HRDepartmentListItem } from '../../../../models/hr';

interface DepartmentCardProps {
	dept: HRDepartmentListItem;
	onEdit: () => void;
	onDelete: () => void;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({ dept, onEdit, onDelete }) => {
	const theme = useTheme();
	return (
		<Card
			sx={{
				border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
				transition: 'all 0.18s ease',
				'&:hover': {
					boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
					borderColor: alpha(theme.palette.primary.main, 0.25),
				},
			}}
		>
			<CardContent sx={{ p: 2.5 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
					<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1 }}>
						<Avatar
							sx={{
								width: 40, height: 40,
								bgcolor: alpha(theme.palette.primary.main, 0.12),
								color: 'primary.main',
							}}
						>
							<DeptIcon sx={{ fontSize: '1.1rem' }} />
						</Avatar>
						<Box>
							<Typography variant="subtitle2" fontWeight={700}>{dept.name}</Typography>
							{dept.description && (
								<Typography variant="caption" color="text.secondary" noWrap>
									{dept.description}
								</Typography>
							)}
						</Box>
					</Box>
					<Box>
						<Tooltip title="Edit">
							<IconButton size="small" onClick={onEdit}>
								<EditIcon sx={{ fontSize: '1rem' }} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Delete">
							<IconButton size="small" color="error" onClick={onDelete}>
								<DeleteIcon sx={{ fontSize: '1rem' }} />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>

				<Divider sx={{ my: 1.5 }} />

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
						<PeopleIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
						<Typography variant="caption" color="text.secondary">
							<strong>{dept.employee_count ?? 0}</strong> employees
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
						<DesignationIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
						<Typography variant="caption" color="text.secondary">
							<strong>{dept.designation_count ?? 0}</strong> designations
						</Typography>
					</Box>
					{dept.head_user_name && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
							<HODIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
							<Typography variant="caption" color="text.secondary">
								HOD: <strong>{dept.head_user_name}</strong>
							</Typography>
						</Box>
					)}
				</Box>

				{!dept.is_active && (
					<Chip label="Inactive" size="small" color="default" sx={{ mt: 1.5, height: 18, fontSize: '0.65rem' }} />
				)}
			</CardContent>
		</Card>
	);
};

export default DepartmentCard;
