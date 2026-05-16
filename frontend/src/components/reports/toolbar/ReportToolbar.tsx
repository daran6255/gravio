import {
	Box,
	Paper,
	TextField,
	InputAdornment,
	Button,
	Badge,
	Typography,
	useTheme,
	useMediaQuery
} from '@mui/material';
import {
	Search as SearchIcon,
	FilterList as FilterIcon
} from '@mui/icons-material';

interface ReportToolbarProps {
	search: string;
	onSearchChange: (value: string) => void;
	total: number;
	filterCount: number;
	onFilterClick: () => void;
	children?: React.ReactNode;
}

const ReportToolbar: React.FC<ReportToolbarProps> = ({
	search,
	onSearchChange,
	total,
	filterCount,
	onFilterClick,
	children
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				mb: 0,
				border: `1px solid ${theme.palette.divider}`,
				borderBottom: 'none',
				display: 'flex',
				flexDirection: isMobile ? 'column' : 'row',
				justifyContent: 'space-between',
				alignItems: isMobile ? 'stretch' : 'center',
				backgroundColor: theme.palette.background.paper,
				borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
				gap: isMobile ? 2 : 0
			}}
		>
			<Box sx={{
				display: 'flex',
				flexDirection: isMobile ? 'column' : 'row',
				alignItems: isMobile ? 'stretch' : 'center',
				gap: 2,
				flexGrow: 1
			}}>
				<TextField
					placeholder="Search candidates..."
					variant="outlined"
					size="small"
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					sx={{
						width: isMobile ? '100%' : 400,
						'& .MuiOutlinedInput-root': {
							height: 36,
							backgroundColor: theme.palette.background.paper,
							fontSize: theme.typography.body2.fontSize,
							'& fieldset': { borderColor: theme.palette.divider },
							'&:hover fieldset': { borderColor: theme.palette.primary.light },
							'&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 }
						}
					}}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
							</InputAdornment>
						),
						'aria-label': 'Search candidates'
					}}
				/>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
					<Button
						variant="outlined"
						startIcon={
							<Badge
								badgeContent={filterCount}
								color="primary"
								sx={{
									'& .MuiBadge-badge': {
										fontSize: '0.65rem',
										height: 16,
										minWidth: 16,
										top: 2,
										right: -2,
									}
								}}
							>
								<FilterIcon sx={{ fontSize: 18 }} />
							</Badge>
						}
						onClick={onFilterClick}
						aria-label="Toggle filters"
						sx={{
							height: 36,
							borderColor: theme.palette.divider,
							color: theme.palette.text.primary,
							textTransform: 'none',
							fontSize: theme.typography.body2.fontSize,
							fontWeight: 500,
							flex: isMobile ? 1 : 'none',
							'&:hover': { 
								borderColor: theme.palette.primary.light, 
								backgroundColor: theme.palette.action.hover 
							}
						}}
					>
						Filter
					</Button>
					<Typography 
						variant="body2" 
						sx={{ 
							color: theme.palette.text.secondary, 
							fontWeight: 500, 
							whiteSpace: 'nowrap' 
						}}
					>
						({total} candidates)
					</Typography>
				</Box>
			</Box>
			<Box sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 1,
				mt: isMobile ? 1 : 0,
				width: isMobile ? '100%' : 'auto',
				justifyContent: isMobile ? 'flex-start' : 'flex-end'
			}}>
				{children}
			</Box>
		</Paper>
	);
};

export default ReportToolbar;
