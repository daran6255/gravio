import React from 'react';
import {
	Box,
	TextField,
	Button,
	InputAdornment,
	Badge,
	Typography
} from '@mui/material';
import { Search, FilterList, Refresh } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface DSRAdminTableHeaderProps {
	title?: string;
	searchTerm: string;
	onSearchChange: (value: string) => void;
	onRefresh: () => void;
	activeFilterCount?: number;
	onFilterOpen?: () => void;
	placeholder?: string;
	actions?: React.ReactNode;
	hideSearch?: boolean;
}

const DSRAdminTableHeader: React.FC<DSRAdminTableHeaderProps> = ({
	title,
	searchTerm,
	onSearchChange,
	onRefresh,
	activeFilterCount = 0,
	onFilterOpen,
	placeholder = "Search...",
	actions,
	hideSearch = false
}) => {
	const theme = useTheme();

	return (
		<Box sx={{
			p: 2,
			display: 'flex',
			flexDirection: { xs: 'column', md: 'row' },
			justifyContent: 'space-between',
			alignItems: { xs: 'stretch', md: 'center' },
			borderBottom: '1px solid #d5dbdb',
			bgcolor: '#fafafa',
			gap: 2
		}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
				{title && (
					<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', display: { xs: 'none', lg: 'block' }, whiteSpace: 'nowrap' }}>
						{title}
					</Typography>
				)}
				{!hideSearch && (
					<TextField
						placeholder={placeholder}
						value={searchTerm}
						onChange={(e) => onSearchChange(e.target.value)}
						size="small"
						fullWidth
						sx={{
							maxWidth: { xs: '100%', md: '350px' },
							'& .MuiOutlinedInput-root': {
								bgcolor: 'white',
								height: '36px',
								'& fieldset': {
									borderColor: '#d5dbdb',
								},
								'&:hover fieldset': {
									borderColor: theme.palette.primary.main,
								},
							}
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search sx={{ color: 'text.secondary', fontSize: 18 }} />
								</InputAdornment>
							),
						}}
					/>
				)}
			</Box>

			<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Button
						variant="outlined"
						startIcon={<Refresh />}
						onClick={onRefresh}
						size="small"
						sx={{
							textTransform: 'none',
							color: '#232f3e',
							borderColor: '#d5dbdb',
							fontWeight: 600,
							height: '36px',
							'&:hover': {
								borderColor: '#232f3e',
								bgcolor: '#f5f8fa'
							}
						}}
					>
						Refresh
					</Button>

					{onFilterOpen && (
						<Badge badgeContent={activeFilterCount} color="primary">
							<Button
								variant="outlined"
								startIcon={<FilterList fontSize="small" />}
								onClick={onFilterOpen}
								size="small"
								sx={{
									textTransform: 'none',
									color: '#232f3e',
									borderColor: '#d5dbdb',
									fontWeight: 600,
									height: '36px',
									'&:hover': {
										borderColor: '#232f3e',
										bgcolor: '#f5f8fa'
									}
								}}
							>
								Filters
							</Button>
						</Badge>
					)}
				</Box>
				{actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
			</Box>
		</Box>
	);
};

export default React.memo(DSRAdminTableHeader);
