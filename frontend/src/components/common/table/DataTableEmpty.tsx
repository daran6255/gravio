import React from 'react';
import { TableRow, TableCell, Stack, Typography, Box, alpha, useTheme } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

interface DataTableEmptyProps {
	colSpan: number;
	message?: string;
	subMessage?: string;
}

/**
 * Modular empty state component for DataTable.
 * Displayed when no records match the current filters or search.
 */
const DataTableEmpty: React.FC<DataTableEmptyProps> = ({
	colSpan,
	message = 'No records found',
	subMessage = 'Try adjusting your filters or search terms'
}) => {
	const theme = useTheme();

	return (
		<TableRow>
			<TableCell colSpan={colSpan} align="center" sx={{ py: 10, border: 0 }}>
				<Stack spacing={1.5} alignItems="center">
					<Box
						sx={{
							width: 56,
							height: 56,
							borderRadius: '16px',
							bgcolor: alpha(theme.palette.primary.main, 0.08),
							color: theme.palette.primary.main,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center'
						}}
					>
						<InboxOutlined sx={{ fontSize: 28 }} />
					</Box>
					<Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
						{message}
					</Typography>
					{subMessage && (
						<Typography variant="body2" color="text.disabled">
							{subMessage}
						</Typography>
					)}
				</Stack>
			</TableCell>
		</TableRow>
	);
};

export default DataTableEmpty;
