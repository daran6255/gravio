import React, { useState } from 'react';
import { Box, Typography, Button, Stack, Menu, MenuItem, Fade, useTheme, alpha } from '@mui/material';
import { Close, PersonOutline, SyncAlt, KeyboardArrowDown, DeleteOutline } from '@mui/icons-material';
import type { LeadStatus } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { LEAD_STATUSES } from '../constants';

interface LeadsBulkActionBarProps {
	selectedCount: number;
	owners: CRMOwnerOption[];
	loading: boolean;
	onReassign: (ownerId: number) => void;
	onChangeStatus: (status: LeadStatus) => void;
	onDelete: () => void;
	onClear: () => void;
}

export const LeadsBulkActionBar: React.FC<LeadsBulkActionBarProps> = ({
	selectedCount,
	owners,
	loading,
	onReassign,
	onChangeStatus,
	onDelete,
	onClear,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [reassignAnchorEl, setReassignAnchorEl] = useState<null | HTMLElement>(null);
	const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);

	if (selectedCount === 0) return null;

	const handleReassignClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setReassignAnchorEl(event.currentTarget);
	};

	const handleReassignClose = () => {
		setReassignAnchorEl(null);
	};

	const handleStatusClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setStatusAnchorEl(event.currentTarget);
	};

	const handleStatusClose = () => {
		setStatusAnchorEl(null);
	};

	return (
		<Fade in={selectedCount > 0}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					flexWrap: 'wrap',
					gap: 2,
					px: 3,
					py: 1.25,
					mb: 3,
					borderRadius: '12px',
					background: isDark 
						? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`
						: `linear-gradient(135deg, #ffffff 0%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`,
					backdropFilter: 'blur(10px)',
					border: '1px solid',
					borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : alpha(theme.palette.primary.main, 0.15),
					boxShadow: isDark
						? '0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3)'
						: '0 12px 32px -4px rgba(24, 28, 48, 0.12), 0 4px 12px -2px rgba(24, 28, 48, 0.04)',
					transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					position: 'relative',
					zIndex: 10,
				}}
			>
				{/* Selected Count Indicator */}
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<Box
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 28,
							height: 28,
							borderRadius: '50%',
							bgcolor: 'primary.main',
							color: '#ffffff',
							fontSize: '0.85rem',
							fontWeight: 800,
							boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.4)}`,
						}}
					>
						{selectedCount}
					</Box>
					<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9rem' }}>
						Selected
					</Typography>
				</Stack>

				<Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ ml: { xs: 0, sm: 2 } }}>
					{/* Reassign Button */}
					<Button
						variant="outlined"
						size="small"
						color="inherit"
						startIcon={<PersonOutline fontSize="small" />}
						endIcon={<KeyboardArrowDown fontSize="small" />}
						onClick={handleReassignClick}
						disabled={loading}
						sx={{
							borderRadius: '20px',
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '0.8rem',
							px: 2,
							py: 0.5,
							borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
							bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
							'&:hover': {
								borderColor: 'primary.main',
								color: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, 0.04),
							},
							transition: 'all 0.2s ease-in-out',
						}}
					>
						Reassign Owner
					</Button>
					<Menu
						anchorEl={reassignAnchorEl}
						open={Boolean(reassignAnchorEl)}
						onClose={handleReassignClose}
						TransitionComponent={Fade}
						PaperProps={{
							sx: {
								borderRadius: '12px',
								mt: 0.5,
								minWidth: 200,
								boxShadow: isDark
									? '0 8px 24px rgba(0,0,0,0.4)'
									: '0 8px 24px rgba(24,28,48,0.1)',
							}
						}}
					>
						{owners.map((o) => (
							<MenuItem
								key={o.id}
								onClick={() => {
									onReassign(o.id);
									handleReassignClose();
								}}
								sx={{ py: 1, fontSize: '0.85rem', fontWeight: 500 }}
							>
								{o.full_name || o.email}
							</MenuItem>
						))}
					</Menu>

					{/* Change Status Button */}
					<Button
						variant="outlined"
						size="small"
						color="inherit"
						startIcon={<SyncAlt fontSize="small" />}
						endIcon={<KeyboardArrowDown fontSize="small" />}
						onClick={handleStatusClick}
						disabled={loading}
						sx={{
							borderRadius: '20px',
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '0.8rem',
							px: 2,
							py: 0.5,
							borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
							bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
							'&:hover': {
								borderColor: 'primary.main',
								color: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, 0.04),
							},
							transition: 'all 0.2s ease-in-out',
						}}
					>
						Change Status
					</Button>
					<Menu
						anchorEl={statusAnchorEl}
						open={Boolean(statusAnchorEl)}
						onClose={handleStatusClose}
						TransitionComponent={Fade}
						PaperProps={{
							sx: {
								borderRadius: '12px',
								mt: 0.5,
								minWidth: 160,
								boxShadow: isDark
									? '0 8px 24px rgba(0,0,0,0.4)'
									: '0 8px 24px rgba(24,28,48,0.1)',
							}
						}}
					>
						{LEAD_STATUSES.map((s) => (
							<MenuItem
								key={s}
								onClick={() => {
									onChangeStatus(s);
									handleStatusClose();
								}}
								sx={{ py: 1, fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: 500 }}
							>
								{s}
							</MenuItem>
						))}
					</Menu>

					{/* Delete Button */}
					<Button
						variant="outlined"
						size="small"
						color="error"
						startIcon={<DeleteOutline fontSize="small" />}
						onClick={onDelete}
						disabled={loading}
						sx={{
							borderRadius: '20px',
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '0.8rem',
							px: 2,
							py: 0.5,
							'&:hover': {
								bgcolor: alpha(theme.palette.error.main, 0.08),
							},
							transition: 'all 0.2s ease-in-out',
						}}
					>
						Delete
					</Button>
				</Stack>

				<Button
					size="small"
					color="error"
					startIcon={<Close fontSize="small" />}
					onClick={onClear}
					sx={{
						ml: 'auto',
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.8rem',
						borderRadius: '20px',
						px: 2,
						py: 0.5,
						'&:hover': {
							bgcolor: alpha(theme.palette.error.main, 0.08),
						}
					}}
				>
					Clear Selection
				</Button>
			</Box>
		</Fade>
	);
};

export default LeadsBulkActionBar;

