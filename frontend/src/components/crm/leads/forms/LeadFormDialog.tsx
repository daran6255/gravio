import React, { useEffect, useMemo, useState } from 'react';
import {
	Dialog,
} from '@mui/material';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createLead, updateLead, searchCompanyOptions, searchContactOptions } from '../../../../store/slices/crmSlice';
import type { Lead, LeadSource, LeadPriority } from '../../../../models/crm/lead';
import type { Company } from '../../../../models/crm/company';
import type { Contact } from '../../../../models/crm/contact';
import useToast from '../../../../hooks/useToast';
import { getWorldCurrencies } from '../../../../utils/currency';
import { LeadDetailsStep, LeadValueDetailsStep, LeadAssociationsStep } from './steps';

interface LeadFormDialogProps {
	open: boolean;
	onClose: () => void;
	lead?: Lead | null;
	onSuccess: (lead: Lead) => void;
}

export const LeadFormDialog: React.FC<LeadFormDialogProps> = ({ open, onClose, lead, onSuccess }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isEdit = !!lead;

	const { companyOptions, companyOptionsLoading, contactOptions, contactOptionsLoading } = useAppSelector((state) => state.crm);
	const currencies = useMemo(() => getWorldCurrencies(), []);

	const [title, setTitle] = useState('');
	const [source, setSource] = useState<LeadSource | ''>('');
	const [priority, setPriority] = useState<LeadPriority>('medium');
	const [estimatedValue, setEstimatedValue] = useState<string>('');
	const [currency, setCurrency] = useState('USD');
	const [description, setDescription] = useState('');
	const [tags, setTags] = useState<string[]>([]);
	const [company, setCompany] = useState<Company | null>(null);
	const [contact, setContact] = useState<Contact | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [touched, setTouched] = useState<{ title?: boolean; currency?: boolean }>({});

	const fieldErrors = {
		title: title.trim() ? '' : 'Title is required',
		currency: estimatedValue && !currency ? 'Select a currency for the estimated value' : '',
	};
	const isValid = !fieldErrors.title && !fieldErrors.currency;

	useEffect(() => {
		if (!open) return;
		setTitle(lead?.title || '');
		setSource(lead?.source || '');
		setPriority(lead?.priority || 'medium');
		setEstimatedValue(lead?.estimated_value != null ? String(lead.estimated_value) : '');
		setCurrency(lead?.currency || 'USD');
		setDescription(lead?.description || '');
		setTags(lead?.tags || []);
		setCompany(null);
		setContact(null);
		setError(null);
		setTouched({});
		dispatch(searchCompanyOptions(undefined));
		dispatch(searchContactOptions(undefined));
	}, [open, lead, dispatch]);

	const handleSave = async () => {
		setTouched({ title: true, currency: true });
		if (!isValid) return;

		setSubmitting(true);
		setError(null);
		try {
			const hasDescription = description.replace(/<[^>]*>/g, '').trim().length > 0;
			const payload = {
				title: title.trim(),
				source: source || undefined,
				priority,
				estimated_value: estimatedValue ? Number(estimatedValue) : undefined,
				currency,
				description: hasDescription ? description : undefined,
				tags: tags.length ? tags : undefined,
				company_id: company?.id,
				contact_id: contact?.id,
			};

			if (isEdit) {
				const result = await dispatch(
					updateLead({ publicId: lead!.public_id, payload: { ...payload, version: lead!.version } })
				).unwrap();
				toast.success('Lead updated');
				onSuccess(result);
				onClose();
			} else {
				const result = await dispatch(createLead(payload)).unwrap();
				toast.success('Lead created');
				if (result.duplicate_warning) {
					toast.warning(result.duplicate_warning);
				}
				onSuccess(result);
				onClose();
			}
		} catch (err: any) {
			if (err && typeof err === 'object' && err.status === 409) {
				toast.error('This lead was changed by someone else. Refresh to see the latest version.');
				setError(err.message);
			} else {
				setError((err && typeof err === 'object' ? err.message : err) || 'Failed to save lead');
			}
		} finally {
			setSubmitting(false);
		}
	};

	const steps: FormStep[] = [
		{
			label: 'Lead Details',
			description: 'Basic information about the lead opportunity',
			content: (
				<LeadDetailsStep
					title={title}
					setTitle={setTitle}
					source={source}
					setSource={setSource}
					priority={priority}
					setPriority={setPriority}
					touched={touched}
					setTouched={setTouched}
					fieldErrors={fieldErrors}
				/>
			)
		},
		{
			label: 'Value & Details',
			description: 'Estimated financial scope and descriptions',
			content: (
				<LeadValueDetailsStep
					estimatedValue={estimatedValue}
					setEstimatedValue={setEstimatedValue}
					currency={currency}
					setCurrency={setCurrency}
					currencies={currencies}
					description={description}
					setDescription={setDescription}
					tags={tags}
					setTags={setTags}
					touched={touched}
					setTouched={setTouched}
					fieldErrors={fieldErrors}
				/>
			)
		},
		{
			label: 'Associations',
			description: 'Link organization and candidate connections',
			content: (
				<LeadAssociationsStep
					company={company}
					setCompany={setCompany}
					companyOptions={companyOptions}
					companyOptionsLoading={companyOptionsLoading}
					contact={contact}
					setContact={setContact}
					contactOptions={contactOptions}
					contactOptionsLoading={contactOptionsLoading}
				/>
			)
		}
	];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' } }}
		>
			<EnterpriseForm
				title={isEdit ? 'Edit Lead' : 'New Lead'}
				subtitle={isEdit ? lead?.title : 'Capture a new sales opportunity'}
				mode={isEdit ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSave}
				onCancel={onClose}
				isSubmitting={submitting}
				saveButtonText={isEdit ? 'Save Changes' : 'Create Lead'}
				error={error}
			/>
		</Dialog>
	);
};

export default LeadFormDialog;
