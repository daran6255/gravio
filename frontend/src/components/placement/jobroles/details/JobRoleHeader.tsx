import React from 'react';
import { Box, Typography, Stack, Button, useTheme, alpha } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Edit as EditIcon,
	Business as BusinessIcon,
	LocationOn as LocationOnIcon,
	Person as PersonIcon,
	Close as CloseIcon,
	CheckCircleOutline as OpenIcon
} from '@mui/icons-material';
import { IconButton } from '@mui/material';
import PlacementStatusBadge from '../common/PlacementStatusBadge';
import ModuleHeader from '../../../common/header/ModuleHeader';
import { useNavigate } from 'react-router-dom';
import type { JobRole } from '../../../../models/jobRole';

interface JobRoleHeaderProps {
	jobRole: JobRole;
	onEdit: () => void;
	onRefresh: () => void;
	onStatusChange?: (status: 'active' | 'closed') => void;
}

const JobRoleHeader: React.FC<JobRoleHeaderProps> = ({ jobRole, onEdit, onStatusChange }) => {
	const theme = useTheme();
	const navigate = useNavigate();

	const infoBar = (
		<Stack direction="row" spacing={4} sx={{ color: alpha(theme.palette.common.white, 0.8), flexWrap: 'wrap', gap: 2 }}>
			<Stack direction="row" spacing={1} alignItems="center">
				<BusinessIcon sx={{ fontSize: 18, color: alpha(theme.palette.common.white, 0.6) }} />
				<Box>
					<Typography variant="awsFieldLabel" sx={{ color: alpha(theme.palette.common.white, 0.5), mb: 0 }}>COMPANY</Typography>
					<Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.common.white }}>{jobRole.company?.name || 'N/A'}</Typography>
				</Box>
			</Stack>

			<Stack direction="row" spacing={1} alignItems="center">
				<LocationOnIcon sx={{ fontSize: 18, color: alpha(theme.palette.common.white, 0.6) }} />
				<Box>
					<Typography variant="awsFieldLabel" sx={{ color: alpha(theme.palette.common.white, 0.5), mb: 0 }}>LOCATION</Typography>
					<Typography variant="body2" sx={{ color: theme.palette.common.white, fontWeight: 500 }}>
						{jobRole.location?.cities?.join(', ') || jobRole.location?.states?.join(', ') || 'Remote'}
					</Typography>
				</Box>
			</Stack>

			<Stack direction="row" spacing={1} alignItems="center">
				<PersonIcon sx={{ fontSize: 18, color: alpha(theme.palette.common.white, 0.6) }} />
				<Box>
					<Typography variant="awsFieldLabel" sx={{ color: alpha(theme.palette.common.white, 0.5), mb: 0 }}>OWNER</Typography>
					<Typography variant="body2" sx={{ color: theme.palette.common.white, fontWeight: 500 }}>
						{jobRole.creator?.full_name || jobRole.creator?.username || 'System'}
					</Typography>
				</Box>
			</Stack>
		</Stack>
	);

	return (
		<>
			{/* Top Bar / Navigation */}
			<Box sx={{ mb: 2 }}>
				<Button
					variant="text"
					size="small"
					startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
					onClick={() => navigate('/placement/job-roles')}
					sx={{
						color: theme.palette.text.secondary,
						fontWeight: 700,
						textTransform: 'none',
						fontSize: '0.75rem',
						'&:hover': { bgcolor: 'transparent', color: theme.palette.primary.main }
					}}
				>
					Back to Job Roles
				</Button>
			</Box>

			<ModuleHeader
				title={
					<Stack direction="row" spacing={2} alignItems="center">
						<Typography
							variant="h4"
							sx={{
								fontWeight: 700,
								color: 'common.white',
								fontSize: { xs: '1.5rem', sm: '2rem' },
							}}
						>
							{jobRole.title}
						</Typography>
						{(() => {
							const isExpired = jobRole.close_date && new Date(jobRole.close_date) < new Date(new Date().setHours(0, 0, 0, 0));
							const displayStatus = isExpired && jobRole.status === 'active' ? 'closed' : jobRole.status;
							const displayLabel = isExpired && jobRole.status === 'active' ? 'Expired' : jobRole.status;
							return <PlacementStatusBadge label={displayLabel} status={displayStatus} />;
						})()}
						<IconButton
							size="small"
							onClick={onEdit}
							sx={{
								color: alpha(theme.palette.common.white, 0.6),
								'&:hover': { color: theme.palette.common.white, bgcolor: alpha(theme.palette.common.white, 0.1) }
							}}
						>
							<EditIcon fontSize="small" />
						</IconButton>

						{onStatusChange && (
							<Button
								size="small"
								variant="outlined"
								startIcon={jobRole.status === 'closed' ? <OpenIcon /> : <CloseIcon />}
								onClick={() => onStatusChange(jobRole.status === 'closed' ? 'active' : 'closed')}
								sx={{
									ml: 2,
									color: theme.palette.common.white,
									borderColor: alpha(theme.palette.common.white, 0.3),
									textTransform: 'none',
									fontWeight: 700,
									fontSize: '0.75rem',
									'&:hover': {
										borderColor: theme.palette.common.white,
										bgcolor: alpha(theme.palette.common.white, 0.1)
									}
								}}
							>
								{jobRole.status === 'closed' ? 'Re-open Role' : 'Close Role'}
							</Button>
						)}
					</Stack>
				}
				subtitle={
					<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.5), fontWeight: 700, mt: 0.5, display: 'block' }}>
						ID: {jobRole.public_id}
					</Typography>
				}
			>
				{infoBar}
			</ModuleHeader>
		</>
	);
};

export default JobRoleHeader;
