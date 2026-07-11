import React, { useState } from 'react';
import { Box, Stack, Tabs, Tab, Chip, useTheme, alpha } from '@mui/material';
import {
	PeopleAltOutlined as EmployeesIcon,
	AccountTreeOutlined as DeptIcon,
	WorkOutlined as DesignationIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../../store/hooks';
import EmployeesPanel from './employee/EmployeesPanel';
import DepartmentsPanel from './department/DepartmentsPanel';
import DesignationsPanel from './designation/DesignationsPanel';

type WorkforceTab = 'employees' | 'departments' | 'designations';

export const WorkforcePanel: React.FC = () => {
	const theme = useTheme();
	const [tab, setTab] = useState<WorkforceTab>('employees');
	const { employeesTotal, departments, designations } = useAppSelector((state) => state.hr);

	const tabs: { value: WorkforceTab; label: string; icon: React.ReactElement; count: number }[] = [
		{ value: 'employees', label: 'Employees', icon: <EmployeesIcon fontSize="small" />, count: employeesTotal },
		{ value: 'departments', label: 'Departments', icon: <DeptIcon fontSize="small" />, count: departments.length },
		{ value: 'designations', label: 'Designations', icon: <DesignationIcon fontSize="small" />, count: designations.length },
	];

	return (
		<Box>
			<Tabs
				value={tab}
				onChange={(_, v: WorkforceTab) => setTab(v)}
				sx={{
					mb: 3,
					minHeight: 44,
					display: 'inline-flex',
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
										bgcolor: tab === t.value ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.primary, 0.08),
										color: tab === t.value ? 'primary.main' : 'text.secondary',
									}}
								/>
							</Stack>
						}
					/>
				))}
			</Tabs>

			{tab === 'employees' && <EmployeesPanel />}
			{tab === 'departments' && <DepartmentsPanel />}
			{tab === 'designations' && <DesignationsPanel />}
		</Box>
	);
};

export default WorkforcePanel;
