import React from 'react';
import { Box, Tabs, Tab, useTheme } from '@mui/material';
import CounselingTable from '../table/CounselingTable';
import type { CandidateListItem } from '../../../models/candidate';

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`counseling-tabpanel-${index}`}
			aria-labelledby={`counseling-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

interface CounselingTabsProps {
	tabValue: number;
	handleTabChange: (_event: React.SyntheticEvent, newValue: number) => void;
	stats: any;
	handleAction: (action: 'counsel' | 'edit', candidate: CandidateListItem) => void;
	refreshKey: number;
}

const CounselingTabs: React.FC<CounselingTabsProps> = ({
	tabValue,
	handleTabChange,
	stats,
	handleAction,
	refreshKey
}) => {
	const theme = useTheme();

	const getCount = (status: string) => {
		if (!stats?.counseling_distribution) return 0;
		return stats.counseling_distribution[status] || 0;
	};

	const notCounseledCount = (stats?.screening_distribution?.['Completed'] || 0) - 
		(getCount('selected') + getCount('rejected') + getCount('pending'));

	const renderTabLabel = (label: string, count: number) => (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
			{label}
			<Box
				component="span"
				sx={{
					bgcolor: theme.palette.mode === 'dark' ? 'action.selected' : 'grey.200',
					color: 'text.primary',
					px: 0.8,
					py: 0.2,
					borderRadius: '12px',
					fontSize: '0.75rem',
					fontWeight: 600
				}}
			>
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
					<Tab label={renderTabLabel("Not Counseled", notCounseledCount)} />
					<Tab label={renderTabLabel("In Progress", getCount('pending'))} />
					<Tab label={renderTabLabel("Selected", getCount('selected'))} />
					<Tab label={renderTabLabel("Rejected", getCount('rejected'))} />
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<CounselingTable
					type="not_counseled"
					onAction={handleAction}
					refreshKey={refreshKey}
				/>
			</TabPanel>
			<TabPanel value={tabValue} index={1}>
				<CounselingTable
					type="pending"
					onAction={handleAction}
					refreshKey={refreshKey}
				/>
			</TabPanel>
			<TabPanel value={tabValue} index={2}>
				<CounselingTable
					type="selected"
					onAction={handleAction}
					refreshKey={refreshKey}
				/>
			</TabPanel>
			<TabPanel value={tabValue} index={3}>
				<CounselingTable
					type="rejected"
					onAction={handleAction}
					refreshKey={refreshKey}
				/>
			</TabPanel>
		</Box>
	);
};

export default CounselingTabs;
