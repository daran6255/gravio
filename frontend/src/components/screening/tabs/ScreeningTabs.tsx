import React from 'react';
import { Box, Tabs, Tab, useTheme } from '@mui/material';
import ScreeningTable from '../table/ScreeningTable';
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
			id={`screening-tabpanel-${index}`}
			aria-labelledby={`screening-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

interface ScreeningTabsProps {
	tabValue: number;
	handleTabChange: (_event: React.SyntheticEvent, newValue: number) => void;
	stats: any;
	handleAction: (action: 'screen' | 'edit', candidate: CandidateListItem) => void;
	refreshKey: number;
}

const ScreeningTabs: React.FC<ScreeningTabsProps> = ({
	tabValue,
	handleTabChange,
	stats,
	handleAction,
	refreshKey
}) => {
	const theme = useTheme();

	const getCount = (status: string) => {
		if (!stats?.screening_distribution) return 0;
		return stats.screening_distribution[status] || 0;
	};

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
					<Tab label={renderTabLabel("Not Screened", stats?.not_screened || 0)} />
					<Tab label={renderTabLabel("In Progress", getCount('In Progress'))} />
					<Tab label={renderTabLabel("Completed", getCount('Completed'))} />
					<Tab label={renderTabLabel("Rejected", getCount('Rejected'))} />
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<ScreeningTable
					type="unscreened"
					onAction={handleAction}
					refreshTrigger={refreshKey}
				/>
			</TabPanel>
			<TabPanel value={tabValue} index={1}>
				<ScreeningTable
					type="screened"
					status="In Progress"
					onAction={handleAction}
					refreshTrigger={refreshKey}
				/>
			</TabPanel>
			<TabPanel value={tabValue} index={2}>
				<ScreeningTable
					type="screened"
					status="Completed"
					onAction={handleAction}
					refreshTrigger={refreshKey}
				/>
			</TabPanel>
			<TabPanel value={tabValue} index={3}>
				<ScreeningTable
					type="screened"
					status="Rejected"
					onAction={handleAction}
					refreshTrigger={refreshKey}
				/>
			</TabPanel>
		</Box>
	);
};

export default ScreeningTabs;
