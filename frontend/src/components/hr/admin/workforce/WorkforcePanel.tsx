import React from 'react';
import { Box } from '@mui/material';
import EmployeesPanel from './employee/EmployeesPanel';
import DepartmentsPanel from './department/DepartmentsPanel';
import DesignationsPanel from './designation/DesignationsPanel';
import { ManagerAllocationPanel } from '../../../timesheets/manager-allocation/ManagerAllocationPanel';
import type { WorkforceTab } from './WorkforceTabs';

interface WorkforcePanelProps {
	tab: WorkforceTab;
}

export const WorkforcePanel: React.FC<WorkforcePanelProps> = ({ tab }) => (
	<Box>
		{tab === 'employees' && <EmployeesPanel />}
		{tab === 'departments' && <DepartmentsPanel />}
		{tab === 'designations' && <DesignationsPanel />}
		{tab === 'managers' && <ManagerAllocationPanel />}
	</Box>
);

export default WorkforcePanel;
