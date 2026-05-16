import React, { useCallback, useRef } from 'react';
import { Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import CompanyList from '../../components/crm/companies/CompanyList';
import PageHeader from '../../components/common/page-header';

/**
 * Company Management Module
 * Standardized page for managing organizational profiles and corporate partnerships.
 */
const CompanyManagement: React.FC = () => {
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';

	// Holds the trigger exposed by CompanyList once it mounts
	const addTriggerRef = useRef<(() => void) | null>(null);

	const handleRegisterAddTrigger = useCallback((trigger: () => void) => {
		addTriggerRef.current = trigger;
	}, []);

	const handleAddCompany = () => {
		addTriggerRef.current?.();
	};

	const headerAction = isAdmin ? (
		<Button
			variant="contained"
			startIcon={<AddIcon />}
			onClick={handleAddCompany}
			sx={{
				textTransform: 'none',
				fontWeight: 600,
				px: 3,
				py: 1,
				borderRadius: 3,
				boxShadow: 'none',
				'&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
			}}
		>
			Add Company
		</Button>
	) : undefined;

	return (
		<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
			<PageHeader
				title="Company Management"
				subtitle="Manage organizational profiles, account statuses, and corporate partnerships"
				action={headerAction}
			/>
			<CompanyList onAddClick={handleRegisterAddTrigger} />
		</Container>
	);
};

export default CompanyManagement;
