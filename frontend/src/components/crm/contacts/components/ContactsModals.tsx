import React from 'react';
import { ContactFormDialog } from '../forms';
import { ConfirmationDialog } from '../../../common/dialogbox';
import type { Contact } from '../../../../models/crm/contact';

interface ContactsModalsProps {
	formOpen: boolean;
	onCloseForm: () => void;
	editingContact: Contact | null;
	onFormSuccess: (contact: Contact) => void;

	deleteTarget: Contact | null;
	onCloseDelete: () => void;
	onConfirmDelete: () => void;
	deleteLoading: boolean;
}

export const ContactsModals: React.FC<ContactsModalsProps> = ({
	formOpen,
	onCloseForm,
	editingContact,
	onFormSuccess,
	deleteTarget,
	onCloseDelete,
	onConfirmDelete,
	deleteLoading,
}) => {
	return (
		<>
			<ContactFormDialog
				open={formOpen}
				onClose={onCloseForm}
				contact={editingContact}
				onSuccess={onFormSuccess}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={onCloseDelete}
				onConfirm={onConfirmDelete}
				title="Delete Contact"
				subtitle="Permanently delete this contact"
				message={`Are you sure you want to delete "${deleteTarget?.first_name} ${deleteTarget?.last_name || ''}"? This action cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleteLoading}
			/>
		</>
	);
};

export default ContactsModals;
