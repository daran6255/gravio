import React from 'react';
import { Box, Container } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { ContactsTable, ContactDetailDrawer, ContactsModals, useContactsManagement } from '../../components/crm';

/**
 * CRM Contacts — individual person records linked to companies and deals.
 */
const ContactsPage: React.FC = () => {
	const {
		contacts,
		contactsTotal,
		contactsLoading,
		companyOptions,
		page,
		rowsPerPage,
		searchTerm,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,
		refreshData,
		formOpen,
		setFormOpen,
		editingContact,
		detailOpen,
		setDetailOpen,
		selectedContact,
		deleteTarget,
		setDeleteTarget,
		deleteLoading,
		handleCreateClick,
		handleEdit,
		handleRowClick,
		handleDeleteRequest,
		handleConfirmDelete,
		handleFormSuccess,
	} = useContactsManagement();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Contacts"
					subtitle="People linked to your companies and deals"
				/>

				<ContactsTable
					contacts={contacts}
					companyOptions={companyOptions}
					loading={contactsLoading}
					totalCount={contactsTotal}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={handlePageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					searchTerm={searchTerm}
					onSearchChange={handleSearchChange}
					onRefresh={refreshData}
					onCreateClick={handleCreateClick}
					onRowClick={handleRowClick}
					onEdit={handleEdit}
					onDelete={handleDeleteRequest}
				/>

				<ContactDetailDrawer
					open={detailOpen}
					onClose={() => setDetailOpen(false)}
					contact={selectedContact}
					onEdit={handleEdit}
				/>

				<ContactsModals
					formOpen={formOpen}
					onCloseForm={() => setFormOpen(false)}
					editingContact={editingContact}
					onFormSuccess={handleFormSuccess}
					deleteTarget={deleteTarget}
					onCloseDelete={() => setDeleteTarget(null)}
					onConfirmDelete={handleConfirmDelete}
					deleteLoading={deleteLoading}
				/>
			</Container>
		</Box>
	);
};

export default ContactsPage;
