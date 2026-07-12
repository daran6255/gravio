import React from 'react';
import { Stack, Tabs, Tab, Chip, useTheme, alpha } from '@mui/material';
import {
	PlaylistAddCheckOutlined as TrackersIcon,
	AssignmentOutlined as TemplatesIcon,
} from '@mui/icons-material';

export type LifecycleTab = 'trackers' | 'templates';

interface LifecycleTabsProps {
	value: LifecycleTab;
	onChange: (tab: LifecycleTab) => void;
	trackersCount: number;
	templatesCount: number;
}

export const LifecycleTabs: React.FC<LifecycleTabsProps> = ({ value, onChange, trackersCount, templatesCount }) => {
	const theme = useTheme();

	const tabs: { value: LifecycleTab; label: string; icon: React.ReactElement; count: number }[] = [
		{ value: 'trackers', label: 'Active Trackers', icon: <TrackersIcon fontSize="small" />, count: trackersCount },
		{ value: 'templates', label: 'Checklist Templates', icon: <TemplatesIcon fontSize="small" />, count: templatesCount },
	];

	return (
		<Tabs
			value={value}
			onChange={(_, v: LifecycleTab) => onChange(v)}
			variant="scrollable"
			scrollButtons={false}
			sx={{
				minHeight: 44,
				display: 'inline-flex',
				maxWidth: '100%',
				bgcolor: alpha(theme.palette.text.primary, 0.03),
				borderRadius: 3,
				p: 0.5,
				'& .MuiTabs-flexContainer': { gap: 0.25 },
				'& .MuiTabs-indicator': { display: 'none' },
				'& .MuiTab-root': {
					minHeight: 38,
					borderRadius: 2.5,
					textTransform: 'none',
					fontWeight: 600,
					fontSize: '0.85rem',
					color: 'text.secondary',
					px: 2,
					transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
				},
				'& .Mui-selected': {
					bgcolor: 'background.paper',
					color: 'text.primary',
					boxShadow: theme.shadows[1],
				},
			}}
		>
			{tabs.map((t) => (
				<Tab
					key={t.value}
					value={t.value}
					icon={t.icon}
					iconPosition="start"
					label={
						<Stack direction="row" spacing={0.75} alignItems="center">
							<span>{t.label}</span>
							<Chip
								label={t.count}
								size="small"
								sx={{
									height: 18,
									fontSize: '0.65rem',
									fontWeight: 700,
									bgcolor: value === t.value ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.primary, 0.08),
									color: value === t.value ? 'primary.main' : 'text.secondary',
								}}
							/>
						</Stack>
					}
				/>
			))}
		</Tabs>
	);
};

export default LifecycleTabs;
