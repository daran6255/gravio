import React from 'react';
import {
	Typography,
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material';
import { formatValue } from './ActivityHelpers';

/**
 * A generic table to display metadata key-value pairs
 */
export const MetadataTable: React.FC<{ data: Record<string, any>, title?: string }> = ({ data, title }) => {
	// Filter out common internal keys but allow them if they are the ONLY keys
	const allKeys = Object.keys(data);
	const filteredKeys = allKeys.filter(key =>
		key !== 'changes' && key !== 'before' && key !== 'after' && data[key] !== null
	);

	// If filtered keys is empty but we have some keys, use the original keys
	const displayKeys = filteredKeys.length > 0 ? filteredKeys : allKeys.filter(k => data[k] !== null);

	if (displayKeys.length === 0) return null;

	return (
		<Box sx={{ mt: 2 }}>
			{title && (
				<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
					{title}
				</Typography>
			)}
			<TableContainer sx={{ border: '1px solid #d5dbdb', borderRadius: 0 }}>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', width: '35%', py: 1.5, borderBottom: '1px solid #d5dbdb' }}>
								Property
							</TableCell>
							<TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', width: '65%', py: 1.5, borderBottom: '1px solid #d5dbdb' }}>
								Value
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{displayKeys.map((key, index) => (
							<TableRow key={key} sx={{
								'&:hover': { bgcolor: '#f5f8fa' },
								'& td': { borderBottom: index === displayKeys.length - 1 ? 0 : '1px solid #d5dbdb' }
							}}>
								<TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 1.5, textTransform: 'capitalize' }}>
									{key.replace(/_/g, ' ')}
								</TableCell>
								<TableCell sx={{ py: 1.5, color: 'text.primary' }}>
									{formatValue(data[key])}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};

export default MetadataTable;
