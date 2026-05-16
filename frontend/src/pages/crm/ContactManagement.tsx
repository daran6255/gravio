import React, { useRef, useCallback } from 'react';
import { Box, Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import ContactList from '../../components/crm/contacts/ContactList';
import { useAppSelector } from '../../store/hooks';

const ContactManagement: React.FC = () => {
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';
	
	// Bridge for "Add Contact" action
	const addContactTrigger = useRef<(() => void) | null>(null);

	const handleAddClick = useCallback(() => {
		if (addContactTrigger.current) {
			addContactTrigger.current();
		}
	}, []);

	return (
		<Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
			<Container maxWidth="xl">
				<PageHeader
					title="Contact Management"
					subtitle="Manage individual stakeholder profiles and professional relationships"
					action={
						isAdmin ? (
							<Button
								variant="contained"
								color="primary"
								startIcon={<AddIcon />}
								onClick={handleAddClick}
							>
								Add Contact
							</Button>
						) : undefined
					}
				/>
				
				<ContactList onAddClick={(trigger) => { addContactTrigger.current = trigger; }} />
			</Container>
		</Box>
	);
};

export default ContactManagement;
