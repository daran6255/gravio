import React from 'react';
import {
	Drawer,
	Box,
	Typography,
	IconButton,
	Button,
	Chip,
	Divider,
	Checkbox,
	FormControlLabel,
	Radio,
	RadioGroup,
	TextField,
	useTheme,
	alpha
} from '@mui/material';
import { Close, FilterAltOutlined } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import dayjs from 'dayjs';
import { awsStyles } from '../../../theme/theme';

// Types for filter configuration
export interface FilterOption {
	value: string;
	label: string;
}

export interface FilterField {
	key: string;
	label: string;
	type: 'multi-select' | 'single-select' | 'boolean' | 'range' | 'text' | 'date' | 'searchable-multi-select';
	options?: FilterOption[];
}

interface FilterDrawerProps {
	open: boolean;
	onClose: () => void;
	fields: FilterField[];
	activeFilters: Record<string, any>;
	onFilterChange: (key: string, value: any) => void;
	onClearFilters: () => void;
	onApplyFilters: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
	open,
	onClose,
	fields,
	activeFilters,
	onFilterChange,
	onClearFilters,
	onApplyFilters
}) => {
	const theme = useTheme();
	const { awsPanel } = awsStyles;

	// Theme-driven input styles
	const inputSx = {
		'& .MuiInputBase-root': {
			borderRadius: `${(theme.shape.borderRadius as number) / 3}px`, // Aiming for that sharp '2px' console look
			bgcolor: theme.palette.background.paper,
		},
		'& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
		'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.text.primary, 0.4) },
		'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.accent.main }
	};

	// Calculate active filter count
	const activeFilterCount = fields.reduce((count, field) => {
		const value = activeFilters[field.key];
		if (field.type === 'multi-select' || field.type === 'searchable-multi-select') {
			return count + (Array.isArray(value) ? value.length : 0);
		} else {
			return count + (value && value !== '' ? 1 : 0);
		}
	}, 0);

	const handleMultiSelectChange = (key: string, value: string) => {
		const current = activeFilters[key] || [];
		const newValues = current.includes(value)
			? current.filter((item: string) => item !== value)
			: [...current, value];
		onFilterChange(key, newValues);
	};

	const handleSingleSelectChange = (key: string, value: string) => {
		onFilterChange(key, value);
	};

	const renderFieldContent = (field: FilterField) => {
		switch (field.type) {
			case 'searchable-multi-select':
				return (
					<Box sx={{ p: 1.5 }}>
						<Autocomplete
							multiple
							options={field.options || []}
							getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
							value={(field.options || []).filter(opt => (activeFilters[field.key] || []).includes(opt.value))}
							onChange={(_e, newValue) => {
								const values = newValue.map(v => (typeof v === 'string' ? v : v.value));
								onFilterChange(field.key, values);
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder={`Search ${field.label}...`}
									size="small"
									sx={inputSx}
								/>
							)}
							renderTags={(value, getTagProps) =>
								value.map((option, index) => (
									<Chip
										label={typeof option === 'string' ? option : option.label}
										{...getTagProps({ index })}
										size="small"
										sx={{
											borderRadius: `${(theme.shape.borderRadius as number) / 3}px`,
											bgcolor: alpha(theme.palette.accent.main, 0.1),
											color: theme.palette.accent.main,
											border: `1px solid ${alpha(theme.palette.accent.main, 0.3)}`,
											height: 24,
											fontSize: '0.75rem'
										}}
									/>
								))
							}
							sx={{
								'& .MuiAutocomplete-endAdornment': { top: 'calc(50% - 11px)' }
							}}
						/>
					</Box>
				);
			case 'multi-select':
				return field.options && field.options.length > 0 ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 300, overflow: 'auto' }}>
						{field.options.map((option, optIdx) => (
							<Box key={option.value} sx={{
								px: 1.5,
								borderBottom: optIdx === field.options!.length - 1 ? 0 : `1px solid ${theme.palette.divider}`,
								'&:hover': { bgcolor: alpha(theme.palette.accent.main, 0.05) }
							}}>
								<FormControlLabel
									control={
										<Checkbox
											size="small"
											checked={(activeFilters[field.key] || []).includes(option.value)}
											onChange={() => handleMultiSelectChange(field.key, option.value)}
											sx={{ color: theme.palette.divider, '&.Mui-checked': { color: theme.palette.accent.main } }}
										/>
									}
									label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{option.label}</Typography>}
									sx={{ width: '100%', m: 0, py: 0.5 }}
								/>
							</Box>
						))}
					</Box>
				) : (
					<Box sx={{ p: 2 }}>
						<Typography variant="body2" color="text.secondary">No options available</Typography>
					</Box>
				);
			case 'single-select':
				return (
					<RadioGroup
						value={activeFilters[field.key] || ''}
						onChange={(e) => handleSingleSelectChange(field.key, e.target.value)}
						sx={{ display: 'flex', flexDirection: 'column' }}
					>
						<Box sx={{
							px: 1.5,
							borderBottom: `1px solid ${theme.palette.divider}`,
							'&:hover': { bgcolor: alpha(theme.palette.accent.main, 0.05) }
						}}>
							<FormControlLabel
								value=""
								control={<Radio size="small" sx={{ color: theme.palette.divider, '&.Mui-checked': { color: theme.palette.accent.main } }} />}
								label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>All</Typography>}
								sx={{ width: '100%', m: 0, py: 0.5 }}
							/>
						</Box>
						{field.options && field.options.map((option, optIdx) => (
							<Box key={option.value} sx={{
								px: 1.5,
								borderBottom: optIdx === field.options!.length - 1 ? 0 : `1px solid ${theme.palette.divider}`,
								'&:hover': { bgcolor: alpha(theme.palette.accent.main, 0.05) }
							}}>
								<FormControlLabel
									value={option.value}
									control={<Radio size="small" sx={{ color: theme.palette.divider, '&.Mui-checked': { color: theme.palette.accent.main } }} />}
									label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{option.label}</Typography>}
									sx={{ width: '100%', m: 0, py: 0.5 }}
								/>
							</Box>
						))}
					</RadioGroup>
				);
			case 'range':
				return (
					<Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
						<TextField
							label="Min"
							size="small"
							type="number"
							value={(activeFilters[field.key] || {}).min || ''}
							onChange={(e) => onFilterChange(field.key, { ...(activeFilters[field.key] || {}), min: e.target.value })}
							sx={{ flex: 1, ...inputSx }}
						/>
						<Typography variant="body2" color="text.secondary">-</Typography>
						<TextField
							label="Max"
							size="small"
							type="number"
							value={(activeFilters[field.key] || {}).max || ''}
							onChange={(e) => onFilterChange(field.key, { ...(activeFilters[field.key] || {}), max: e.target.value })}
							sx={{ flex: 1, ...inputSx }}
						/>
					</Box>
				);
			case 'text':
				return (
					<Box sx={{ p: 1.5 }}>
						<TextField
							fullWidth
							size="small"
							placeholder={`Filter by ${field.label}...`}
							value={activeFilters[field.key] || ''}
							onChange={(e) => onFilterChange(field.key, e.target.value)}
							autoFocus
							sx={inputSx}
						/>
					</Box>
				);
			case 'date':
				return (
					<Box sx={{ p: 1.5 }}>
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DatePicker
								label={field.label}
								format="DD/MMM/YYYY"
								value={activeFilters[field.key] ? dayjs(activeFilters[field.key]) : null}
								onChange={(newValue) => onFilterChange(field.key, newValue ? newValue.format('YYYY-MM-DD') : null)}
								slotProps={{
									textField: {
										size: 'small',
										fullWidth: true,
										sx: inputSx
									}
								}}
							/>
						</LocalizationProvider>
					</Box>
				);
			default:
				return (
					<Box sx={{ px: 1.5, '&:hover': { bgcolor: alpha(theme.palette.accent.main, 0.05) } }}>
						<FormControlLabel
							control={
								<Checkbox
									size="small"
									checked={!!activeFilters[field.key]}
									onChange={(e) => onFilterChange(field.key, e.target.checked)}
									sx={{ color: theme.palette.divider, '&.Mui-checked': { color: theme.palette.accent.main } }}
								/>
							}
							label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Enable {field.label}</Typography>}
							sx={{ width: '100%', m: 0, py: 0.5 }}
						/>
					</Box>
				);
		}
	};

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', sm: 400 },
					bgcolor: theme.palette.background.default,
					color: theme.palette.text.primary,
					display: 'flex',
					flexDirection: 'column',
					boxShadow: 'none',
					borderLeft: `1px solid ${theme.palette.divider}`
				}
			}}
		>
			{/* Header */}
			<Box sx={{
				p: 2.5,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				bgcolor: theme.palette.background.paper,
				borderBottom: `1px solid ${theme.palette.divider}`,
				boxShadow: theme.shadows[1]
			}}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<FilterAltOutlined sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
					<Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 700, fontSize: '1rem' }}>
						Filters
					</Typography>
					{activeFilterCount > 0 && (
						<Chip
							label={`${activeFilterCount} active`}
							size="small"
							sx={{
								height: 18,
								fontSize: '0.65rem',
								bgcolor: theme.palette.accent.main,
								color: 'white',
								borderRadius: `${(theme.shape.borderRadius as number) / 3}px`,
								fontWeight: 700
							}}
						/>
					)}
				</Box>
				<IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}>
					<Close fontSize="small" />
				</IconButton>
			</Box>

			{/* Filter Content */}
			<Box sx={{
				flex: 1,
				overflowY: 'auto',
				p: 2.5,
				'overscrollBehavior': 'contain'
			}}>
				{fields.map((field, index) => (
					<Box
						key={field.key}
						sx={{
							mb: index === fields.length - 1 ? 0 : 3,
						}}
					>
						<Typography variant="awsSectionTitle" sx={{ mb: 1, fontSize: '0.85rem' }}>
							{field.label}
						</Typography>

						<Box sx={{
							...awsPanel,
							p: 0,
							overflow: 'hidden',
							bgcolor: theme.palette.background.paper,
							borderColor: theme.palette.divider,
							boxShadow: theme.shadows[1]
						}}>
							{renderFieldContent(field)}
						</Box>
					</Box>
				))}
			</Box>

			{/* Footer */}
			<Divider sx={{ borderColor: theme.palette.divider }} />
			<Box sx={{ p: 2, bgcolor: theme.palette.background.paper, display: 'flex', gap: 1.5, justifyContent: 'flex-end', boxShadow: theme.shadows[1] }}>
				<Button
					variant="text"
					onClick={onClearFilters}
					sx={{
						color: theme.palette.text.secondary,
						px: 2,
						'&:hover': { bgcolor: alpha(theme.palette.secondary.light, 0.05) }
					}}
				>
					Clear All
				</Button>
				<Button
					variant="contained"
					onClick={onApplyFilters}
					sx={{
						bgcolor: theme.palette.accent.main,
						color: 'white',
						px: 3,
						boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)',
						'&:hover': {
							bgcolor: theme.palette.accent.dark,
							boxShadow: '0 2px 4px 0 rgba(0,0,0,0.2)'
						}
					}}
				>
					Apply Filters
				</Button>
			</Box>
		</Drawer>
	);
};

export default FilterDrawer;
