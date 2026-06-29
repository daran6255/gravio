import React from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography, useTheme } from '@mui/material';

export interface TableColumnDef {
	id: string;
	label: string;
	width?: number | string;
	align?: 'left' | 'center' | 'right';
}

export interface TableViewProps<T> {
	columns: TableColumnDef[];
	items: T[];
	getItemId: (item: T) => string | number;
	renderRow: (item: T, index: number) => React.ReactNode;
	loading?: boolean;
	emptyMessage?: string;
}

export function TableView<T>({
	columns,
	items,
	getItemId,
	renderRow,
	loading = false,
	emptyMessage = 'No records found.',
}: TableViewProps<T>) {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress size={32} />
			</Box>
		);
	}

	if (items.length === 0) {
		return (
			<Box sx={{ p: 4, textAlign: 'center' }}>
				<Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
					{emptyMessage}
				</Typography>
			</Box>
		);
	}

	return (
		<TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
			<Table sx={{ minWidth: 650 }}>
				<TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)' }}>
					<TableRow>
						{columns.map((col) => (
							<TableCell
								key={col.id}
								align={col.align || 'left'}
								sx={{
									width: col.width,
									fontWeight: 700,
									color: 'text.secondary',
									fontSize: '0.75rem',
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
									py: 2,
								}}
							>
								{col.label}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{items.map((item, index) => (
						<React.Fragment key={getItemId(item)}>
							{renderRow(item, index)}
						</React.Fragment>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

export default TableView;
