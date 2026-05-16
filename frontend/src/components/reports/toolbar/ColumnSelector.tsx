import React from 'react';
import {
	Box,
	Typography,
	Divider,
	MenuItem,
	FormControlLabel,
	Checkbox,
	Menu,
	Button,
	useTheme,
	useMediaQuery
} from '@mui/material';
import { ViewColumn as ColumnIcon } from '@mui/icons-material';

interface Column {
	id: string;
	label: string;
}

interface ColumnSelectorProps {
	anchorEl: HTMLElement | null;
	onClose: () => void;
	onOpen: (event: React.MouseEvent<HTMLElement>) => void;
	columns: Column[];
	visibleColumns: string[];
	onToggleColumn: (columnId: string) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
	anchorEl,
	onClose,
	onOpen,
	columns,
	visibleColumns,
	onToggleColumn
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Box sx={{ width: isMobile ? '100%' : 'auto' }}>
			<Button
				variant="outlined"
				startIcon={<ColumnIcon />}
				onClick={onOpen}
				size="small"
				sx={{
					height: 36,
					width: isMobile ? '100%' : 'auto',
					borderColor: theme.palette.divider,
					color: theme.palette.text.primary,
					textTransform: 'none',
					fontSize: theme.typography.body2.fontSize,
					fontWeight: 500,
					'&:hover': { 
						borderColor: theme.palette.primary.light, 
						backgroundColor: theme.palette.action.hover 
					}
				}}
			>
				Configure Columns
			</Button>
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={onClose}
				PaperProps={{
					sx: {
						width: 280,
						maxHeight: 480,
						boxShadow: theme.shadows[3],
						border: `1px solid ${theme.palette.divider}`,
						overflowY: 'auto',
						'overscrollBehavior': 'contain'
					}
				}}
			>
				<Box sx={{ px: 2, py: 1.5 }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
						Select Columns
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Choose which columns to show in the table.
					</Typography>
				</Box>
				<Divider />
				<Box sx={{ py: 1 }}>
					{['general', 'screening', 'counseling', 'experience', 'candidate', 'batch', 'progress'].map(group => {
						const groupCols = columns.filter(c => (c as any).group === group);
						if (groupCols.length === 0) return null;

						const getGroupLabel = (g: string) => {
							switch (g) {
								case 'general': return 'General Info';
								case 'screening': return 'Screening Info';
								case 'counseling': return 'Counseling Info';
								case 'experience': return 'Work Experience';
								case 'candidate': return 'Candidate Details';
								case 'batch': return 'Batch Details';
								case 'progress': return 'Progress Metrics';
								default: return g;
							}
						};

						return (
							<React.Fragment key={group}>
								<Box sx={{ px: 2, py: 1, bgcolor: theme.palette.action.hover }}>
									<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
										{getGroupLabel(group)}
									</Typography>
								</Box>
								{groupCols.map(col => (
									<MenuItem
										key={col.id}
										onClick={() => onToggleColumn(col.id)}
										sx={{
											py: 0.5,
											'&:hover': { backgroundColor: theme.palette.action.hover }
										}}
									>
										<FormControlLabel
											control={
												<Checkbox
													size="small"
													checked={visibleColumns.includes(col.id)}
													sx={{
														color: theme.palette.divider,
														'&.Mui-checked': { color: theme.palette.primary.main }
													}}
												/>
											}
											label={
												<Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: theme.typography.body2.fontSize }}>
													{col.label}
												</Typography>
											}
											sx={{ m: 0, width: '100%' }}
										/>
									</MenuItem>
								))}
								<Divider />
							</React.Fragment>
						);
					})}
				</Box>
			</Menu>
		</Box>
	);
};

export default ColumnSelector;
