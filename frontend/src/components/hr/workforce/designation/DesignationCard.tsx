import React from 'react';
import { Box, Typography, Chip, Card, CardContent, IconButton, Tooltip, alpha, useTheme } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { HRDesignationListItem } from '../../../../models/hr';

interface DesignationCardProps {
	designation: HRDesignationListItem;
	onEdit: () => void;
	onDelete: () => void;
}

export const DesignationCard: React.FC<DesignationCardProps> = ({ designation, onEdit, onDelete }) => {
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
			<CardContent sx={{ p: 2 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
					<Box>
						<Typography variant="subtitle2" fontWeight={700}>{designation.name}</Typography>
						{designation.department_name && (
							<Chip
								label={designation.department_name}
								size="small"
								variant="outlined"
								sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
							/>
						)}
						{designation.grade && (
							<Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
								Grade: {designation.grade}
							</Typography>
						)}
					</Box>
					<Box>
						<Tooltip title="Edit">
							<IconButton size="small" onClick={onEdit}>
								<EditIcon sx={{ fontSize: '0.9rem' }} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Delete">
							<IconButton size="small" color="error" onClick={onDelete}>
								<DeleteIcon sx={{ fontSize: '0.9rem' }} />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>
			</CardContent>
		</Card>
	);
};

export default DesignationCard;
