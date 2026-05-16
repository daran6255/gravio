import React, { memo } from 'react';
import {
	Paper,
	Stack,
	TextField,
	InputAdornment,
	Tooltip,
	IconButton,
	Button,
	useTheme,
	alpha
} from '@mui/material';
import {
	Search as SearchIcon,
	Refresh as RefreshIcon,
	FilterList as FilterIcon,
	Add as AddIcon
} from '@mui/icons-material';

interface MockInterviewTableHeaderProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	onRefresh: () => void;
	onCreate: () => void;
}

const MockInterviewTableHeader: React.FC<MockInterviewTableHeaderProps> = memo(({
	searchTerm,
	onSearchChange,
	onRefresh,
	onCreate
}) => {
	const theme = useTheme();

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2.5,
				mb: 4,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				borderRadius: 3,
				border: '1px solid',
				borderColor: 'divider',
				bgcolor: alpha(theme.palette.background.paper, 0.8),
				backdropFilter: 'blur(8px)',
				boxShadow: theme.shadows[1]
			}}
		>
			<Stack direction="row" spacing={3} alignItems="center" sx={{ flexGrow: 1 }}>
				<TextField
					placeholder="Search candidates or interviewers..."
					size="small"
					value={searchTerm}
					onChange={(e) => onSearchChange(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" color="primary" sx={{ opacity: 0.7 }} />
							</InputAdornment>
						),
						sx: { 
							borderRadius: 2,
							bgcolor: alpha(theme.palette.action.hover, 0.04),
							'&:hover': {
								bgcolor: alpha(theme.palette.action.hover, 0.08),
							}
						}
					}}
					sx={{ width: { xs: 280, md: 400 } }}
				/>
				<Stack direction="row" spacing={1}>
					<Tooltip title="Refresh Data">
						<IconButton 
							onClick={onRefresh} 
							size="medium"
							sx={{ 
								bgcolor: alpha(theme.palette.primary.main, 0.05),
								color: 'primary.main',
								'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
							}}
						>
							<RefreshIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title="Advanced Filters">
						<IconButton 
							size="medium"
							sx={{ 
								bgcolor: alpha(theme.palette.secondary.main, 0.05),
								color: 'secondary.main',
								'&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.1) }
							}}
						>
							<FilterIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Stack>
			</Stack>

			<Button
				variant="contained"
				startIcon={<AddIcon />}
				onClick={onCreate}
				sx={{
					textTransform: 'none',
					fontWeight: 700,
					borderRadius: 2,
					px: 3,
					py: 1,
					boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
					'&:hover': {
						boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
						transform: 'translateY(-1px)'
					},
					transition: 'all 0.2s ease'
				}}
			>
				Create Session
			</Button>
		</Paper>
	);
});

MockInterviewTableHeader.displayName = 'MockInterviewTableHeader';

export default MockInterviewTableHeader;

