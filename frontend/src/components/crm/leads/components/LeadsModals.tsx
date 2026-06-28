import React from 'react';
import { LeadFormDialog, ConvertLeadDialog } from '../forms';
import { ConfirmationDialog } from '../../../common/dialogbox';
import type { Lead } from '../../../../models/crm/lead';
import type { Deal } from '../../../../models/crm/deal';

interface LeadsModalsProps {
	formOpen: boolean;
	onCloseForm: () => void;
	editingLead: Lead | null;
	onFormSuccess: (lead: Lead) => void;

	convertOpen: boolean;
	onCloseConvert: () => void;
	convertingLead: Lead | null;
	onConverted: (deal: Deal) => void;

	deleteTarget: Lead | null;
	onCloseDelete: () => void;
	onConfirmDelete: () => void;
	deleteLoading: boolean;

	bulkDeleteOpen: boolean;
	bulkDeleteCount: number;
	onCloseBulkDelete: () => void;
	onConfirmBulkDelete: () => void;
	bulkDeleteLoading: boolean;
}

export const LeadsModals: React.FC<LeadsModalsProps> = ({
	formOpen,
	onCloseForm,
	editingLead,
	onFormSuccess,
	convertOpen,
	onCloseConvert,
	convertingLead,
	onConverted,
	deleteTarget,
	onCloseDelete,
	onConfirmDelete,
	deleteLoading,
	bulkDeleteOpen,
	bulkDeleteCount,
	onCloseBulkDelete,
	onConfirmBulkDelete,
	bulkDeleteLoading,
}) => {
	return (
		<>
			<LeadFormDialog
				open={formOpen}
				onClose={onCloseForm}
				lead={editingLead}
				onSuccess={onFormSuccess}
			/>

			<ConvertLeadDialog
				open={convertOpen}
				onClose={onCloseConvert}
				lead={convertingLead}
				onConverted={onConverted}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={onCloseDelete}
				onConfirm={onConfirmDelete}
				title="Delete Lead"
				subtitle="Permanently delete this lead"
				message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleteLoading}
			/>

			<ConfirmationDialog
				open={bulkDeleteOpen}
				onClose={onCloseBulkDelete}
				onConfirm={onConfirmBulkDelete}
				title="Delete Leads"
				subtitle="Permanently delete multiple leads"
				message={`Are you sure you want to delete ${bulkDeleteCount} selected lead(s)? This action cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={bulkDeleteLoading}
			/>
		</>
	);
};

export default LeadsModals;
