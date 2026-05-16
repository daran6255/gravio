import React from 'react';
import { Container } from '@mui/material';
import HolidayTable from '../../components/projects/dsr/admin/HolidayTable';

const HolidayManagement: React.FC = () => {
	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<HolidayTable />
		</Container>
	);
};

export default HolidayManagement;
