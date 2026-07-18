import React, { memo } from 'react';
import {
	Box,
	TextField,
	Button,
	InputAdornment,
	Badge,
	useTheme,
	Tooltip,
	alpha,
	type SxProps,
	type Theme
} from '@mui/material';
import { Search, FilterList, Refresh, Add } from '@mui/icons-material';

export interface DataTableHeaderProps {
	searchTerm: string;
	onSearchChange?: (value: string) => void;
	searchPlaceholder?: string;
	activeFilterCount?: number;
	onFilterOpen?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	onRefresh?: () => void;
	onCreateClick?: () => void;
	createButtonText?: string;
	/** Overrides the create button's default styling (background/shadow/hover) for
	 *  call sites that want to match a different button elsewhere, e.g. "Invite Teammate". */
	createButtonSx?: SxProps<Theme>;
	canCreate?: boolean;
	loading?: boolean;
	headerActions?: React.ReactNode;
}

const DataTableHeader: React.FC<DataTableHeaderProps> = memo(({
	searchTerm,
	onSearchChange,
	searchPlaceholder = 'Search...',
	activeFilterCount = 0,
	onFilterOpen,
	onRefresh,
	onCreateClick,
	createButtonText = 'Create',
	createButtonSx,
	canCreate = false,
	loading = false,
	headerActions
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box sx={{
			p: { xs: 1.5, sm: 2.5 },
			display: 'flex',
			flexDirection: { xs: 'column', md: 'row' },
			justifyContent: 'space-between',
			alignItems: { xs: 'stretch', md: 'center' },
			borderBottom: '1px solid',
			borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
			gap: { xs: 1.5, sm: 2 }
		}}>
			<Box sx={{ display: 'flex', flex: 1, gap: { xs: 1.5, sm: 2 }, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, minWidth: 0 }}>
				{onSearchChange && (
					<TextField
						placeholder={searchPlaceholder}
						value={searchTerm}
						onChange={(e) => onSearchChange(e.target.value)}
						size="small"
						fullWidth
						inputProps={{
							autoComplete: 'off',
							name: 'enterprise-table-search'
						}}
						sx={{
							maxWidth: { xs: '100%', sm: '350px' },
							'& .MuiOutlinedInput-root': {
								borderRadius: '12px',
								bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
								transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
								'& fieldset': { borderColor: 'transparent' },
								'&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.3) },
								'&.Mui-focused': {
									boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`
								},
								'&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
							}
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search sx={{ color: 'text.secondary', fontSize: 20 }} />
								</InputAdornment>
							),
						}}
					/>
				)}
				{headerActions}
			</Box>

			<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
				<Box sx={{ display: 'flex', gap: 1 }}>
					{onRefresh && (
						<Tooltip title="Refresh data">
							<Button
								variant="outlined"
								startIcon={<Refresh className={loading ? 'spin-animation' : ''} />}
								onClick={onRefresh}
								disabled={loading}
								sx={{
									textTransform: 'none',
									fontWeight: 600,
									borderRadius: '10px',
									color: theme.palette.text.primary,
									borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
									'&:hover': {
										borderColor: theme.palette.primary.main,
										bgcolor: alpha(theme.palette.primary.main, 0.06)
									}
								}}
							>
								Refresh
							</Button>
						</Tooltip>
					)}

					{onFilterOpen && (
						<Badge badgeContent={activeFilterCount} color="primary">
							<Button
								variant="outlined"
								startIcon={<FilterList fontSize="small" />}
								onClick={onFilterOpen}
								sx={{
									textTransform: 'none',
									fontWeight: 600,
									borderRadius: '10px',
									color: theme.palette.text.primary,
									borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
									'&:hover': {
										borderColor: theme.palette.primary.main,
										bgcolor: alpha(theme.palette.primary.main, 0.06)
									}
								}}
							>
								Filters
							</Button>
						</Badge>
					)}
				</Box>

				{canCreate && onCreateClick && (
					<Button
						variant="contained"
						startIcon={<Add />}
						onClick={onCreateClick}
						sx={[
							{
								color: 'white',
								textTransform: 'none',
								fontWeight: 700,
								borderRadius: '10px',
								boxShadow: 'none',
								background: theme.gradients.brand,
								'&:hover': {
									boxShadow: '0 4px 12px rgba(139,124,246,0.3)',
								}
							},
							...(Array.isArray(createButtonSx) ? createButtonSx : [createButtonSx ?? {}]),
						]}
					>
						{createButtonText}
					</Button>
				)}
			</Box>
			<style>
				{`
					@keyframes spin {
						from { transform: rotate(0deg); }
						to { transform: rotate(360deg); }
					}
					.spin-animation {
						animation: spin 1s linear infinite;
					}
				`}
			</style>
		</Box>
	);
});

DataTableHeader.displayName = 'DataTableHeader';

export default DataTableHeader;
