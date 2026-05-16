import React from 'react';
import { Box, Tabs, Tab, useTheme } from '@mui/material';
import DocumentCollectionTable from '../table/DocumentCollectionTable';
import type { CandidateStats } from '../../../models/candidate';

interface DocumentTabsProps {
	tabValue: number;
	handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
	stats: CandidateStats | null;
}

/**
 * DocumentTabs - Specialized tab navigation for the Document module.
 * Provides filtered views based on documentation compliance status.
 */
const DocumentTabs: React.FC<DocumentTabsProps> = ({ tabValue, handleTabChange, stats }) => {
	const theme = useTheme();

	const renderTabLabel = (label: string, count: number) => (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
			{label}
			<Box sx={{
				bgcolor: theme.palette.mode === 'dark' ? 'action.selected' : 'grey.200',
				color: 'text.primary',
				px: 0.8,
				py: 0.2,
				borderRadius: '12px',
				fontSize: '0.75rem',
				fontWeight: 600,
				minWidth: '24px',
				textAlign: 'center'
			}}>
				{count}
			</Box>
		</Box>
	);

	return (
		<Box>
			<Box
				sx={{
					bgcolor: 'background.paper',
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: '8px 8px 0 0'
				}}
			>
				<Tabs 
					value={tabValue} 
					onChange={handleTabChange} 
					variant="scrollable"
					scrollButtons="auto"
					allowScrollButtonsMobile
					sx={{ 
						px: 2,
						'& .MuiTab-root': {
							textTransform: 'none',
							fontSize: '0.95rem',
							fontWeight: 500,
							minHeight: 48
						}
					}}
				>
					<Tab label={renderTabLabel("Not Collected", stats?.candidates_not_submitted || 0)} />
					<Tab label={renderTabLabel("Pending Collection", stats?.candidates_partially_submitted || 0)} />
					<Tab label={renderTabLabel("Collection Completed", stats?.candidates_fully_submitted || 0)} />
				</Tabs>
			</Box>

			<Box sx={{ mt: 3 }}>
				{tabValue === 0 && <DocumentCollectionTable type="not_collected" />}
				{tabValue === 1 && <DocumentCollectionTable type="pending" />}
				{tabValue === 2 && <DocumentCollectionTable type="collected" />}
			</Box>
		</Box>
	);
};

export default DocumentTabs;
