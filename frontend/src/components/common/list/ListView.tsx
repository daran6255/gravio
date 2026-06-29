import React from 'react';
import { Box, List, ListItem, CircularProgress, Typography } from '@mui/material';

export interface ListViewProps<T> {
	items: T[];
	getItemId: (item: T) => string | number;
	renderItem: (item: T, index: number) => React.ReactNode;
	loading?: boolean;
	emptyMessage?: string;
	divider?: boolean;
}

export function ListView<T>({
	items,
	getItemId,
	renderItem,
	loading = false,
	emptyMessage = 'No items to display.',
	divider = true,
}: ListViewProps<T>) {

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
		<List disablePadding sx={{ width: '100%' }}>
			{items.map((item, index) => (
				<ListItem
					key={getItemId(item)}
					divider={divider && index !== items.length - 1}
					sx={{
						px: 3,
						py: 2,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					{renderItem(item, index)}
				</ListItem>
			))}
		</List>
	);
}

export default ListView;
