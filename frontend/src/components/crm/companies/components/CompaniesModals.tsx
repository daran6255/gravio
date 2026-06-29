import React from 'react';
import { CompanyFormDialog } from '../forms';
import { ConfirmationDialog } from '../../../common/dialogbox';
import type { Company } from '../../../../models/crm/company';

interface CompaniesModalsProps {
	formOpen: boolean;
	onCloseForm: () => void;
	editingCompany: Company | null;
	onFormSuccess: (company: Company) => void;

	deleteTarget: Company | null;
	onCloseDelete: () => void;
	onConfirmDelete: () => void;
	deleteLoading: boolean;

	bulkDeleteOpen: boolean;
	bulkDeleteCount: number;
	onCloseBulkDelete: () => void;
	onConfirmBulkDelete: () => void;
	bulkDeleteLoading: boolean;
}

export const CompaniesModals: React.FC<CompaniesModalsProps> = ({
	formOpen,
	onCloseForm,
	editingCompany,
	onFormSuccess,
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
			<CompanyFormDialog
				open={formOpen}
				onClose={onCloseForm}
				company={editingCompany}
				onSuccess={onFormSuccess}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={onCloseDelete}
				onConfirm={onConfirmDelete}
				title="Delete Company"
				subtitle="Permanently delete this company"
				message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleteLoading}
			/>

			<ConfirmationDialog
				open={bulkDeleteOpen}
				onClose={onCloseBulkDelete}
				onConfirm={onConfirmBulkDelete}
				title="Delete Companies"
				subtitle="Permanently delete multiple companies"
				message={`Are you sure you want to delete ${bulkDeleteCount} selected company(ies)? This action cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={bulkDeleteLoading}
			/>
		</>
	);
};

export default CompaniesModals;
