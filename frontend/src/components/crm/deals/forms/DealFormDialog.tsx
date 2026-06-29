import React, { useEffect, useMemo, useState } from 'react';
import {
	Dialog,
} from '@mui/material';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createDeal, updateDeal, searchCompanyOptions, searchContactOptions, fetchOwners } from '../../../../store/slices/crmSlice';
import type { Deal, DealStatus } from '../../../../models/crm/deal';
import type { Company } from '../../../../models/crm/company';
import type { Contact } from '../../../../models/crm/contact';
import useToast from '../../../../hooks/useToast';
import { getWorldCurrencies } from '../../../../utils/currency';
import { DealDetailsStep, DealValueDescriptionStep, DealAssociationsStep } from './steps';

interface DealFormDialogProps {
	open: boolean;
	onClose: () => void;
	deal?: Deal | null;
	activePipelineId: number | null;
	onSuccess: (deal: Deal) => void;
}

const DEAL_STATUSES: { value: DealStatus; label: string }[] = [
	{ value: 'open', label: 'Open' },
	{ value: 'won', label: 'Won' },
	{ value: 'lost', label: 'Lost' },
	{ value: 'on_hold', label: 'On Hold' },
];

export const DealFormDialog: React.FC<DealFormDialogProps> = ({ open, onClose, deal, activePipelineId, onSuccess }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isEdit = !!deal;

	const { companyOptions, contactOptions, owners, pipelines } = useAppSelector((state) => state.crm);
	const currencies = useMemo(() => getWorldCurrencies(), []);

	const [title, setTitle] = useState('');
	const [value, setValue] = useState<string>('');
	const [currency, setCurrency] = useState('USD');
	const [closeDate, setCloseDate] = useState<string>('');
	const [ownerId, setOwnerId] = useState<number | ''>('');
	const [pipelineId, setPipelineId] = useState<number | ''>('');
	const [stageId, setStageId] = useState<number | ''>('');
	const [status, setStatus] = useState<DealStatus>('open');
	const [lostReason, setLostReason] = useState('');
	const [description, setDescription] = useState('');
	const [tags, setTags] = useState<string[]>([]);
	const [company, setCompany] = useState<Company | null>(null);
	const [contact, setContact] = useState<Contact | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [touched, setTouched] = useState<{ title?: boolean; pipelineId?: boolean; stageId?: boolean }>({});

	const selectedPipeline = useMemo(() => {
		return pipelines.find((p) => p.id === pipelineId);
	}, [pipelines, pipelineId]);

	const fieldErrors = {
		title: title.trim() ? '' : 'Title is required',
		pipelineId: pipelineId ? '' : 'Pipeline is required',
		stageId: stageId ? '' : 'Stage is required',
	};

	const isValid = !fieldErrors.title && !fieldErrors.pipelineId && !fieldErrors.stageId;

	useEffect(() => {
		if (!open) return;
		dispatch(searchCompanyOptions(undefined));
		dispatch(searchContactOptions(undefined));
		dispatch(fetchOwners());

		if (deal) {
			setTitle(deal.title);
			setValue(deal.value != null ? String(deal.value) : '');
			setCurrency(deal.currency || 'USD');
			setCloseDate(deal.close_date ? deal.close_date.split('T')[0] : '');
			setOwnerId(deal.owner_id || '');
			setPipelineId(deal.pipeline_id || '');
			setStageId(deal.stage_id || '');
			setStatus(deal.status || 'open');
			setLostReason(deal.lost_reason || '');
			setDescription(deal.custom_fields?.description || '');
			setTags(deal.tags || []);
			// Resolve company/contact options if loaded
			const comp = companyOptions.find((c) => c.id === deal.company_id);
			if (comp) setCompany(comp);
			else setCompany(null);

			const cont = contactOptions.find((c) => c.id === deal.contact_id);
			if (cont) setContact(cont);
			else setContact(null);
		} else {
			setTitle('');
			setValue('');
			setCurrency('USD');
			setCloseDate('');
			setOwnerId('');
			setPipelineId(activePipelineId || '');
			setStatus('open');
			setLostReason('');
			setDescription('');
			setTags([]);
			setCompany(null);
			setContact(null);

			const activePipe = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
			if (activePipe) {
				setPipelineId(activePipe.id);
				if (activePipe.stages?.length) setStageId(activePipe.stages[0].id);
			} else {
				setStageId('');
			}
		}
		setError(null);
		setTouched({});
	}, [open, deal, activePipelineId, pipelines, dispatch]);

	// Auto select first stage of a newly selected pipeline
	useEffect(() => {
		if (!open || isEdit) return;
		if (selectedPipeline && selectedPipeline.stages?.length) {
			setStageId(selectedPipeline.stages[0].id);
		} else {
			setStageId('');
		}
	}, [selectedPipeline, open, isEdit]);

	const handleSave = async () => {
		setTouched({ title: true, pipelineId: true, stageId: true });
		if (!isValid) return;

		setSubmitting(true);
		setError(null);
		try {
			const hasDescription = description.replace(/<[^>]*>/g, '').trim().length > 0;
			const payload = {
				title: title.trim(),
				value: value ? Number(value) : undefined,
				currency,
				close_date: closeDate || undefined,
				owner_id: ownerId || undefined,
				pipeline_id: Number(pipelineId),
				stage_id: Number(stageId),
				status,
				lost_reason: status === 'lost' ? lostReason.trim() : undefined,
				tags: tags.length ? tags : undefined,
				company_id: company?.id || undefined,
				contact_id: contact?.id || undefined,
				custom_fields: hasDescription ? { description } : undefined,
			};

			let result: Deal;
			if (isEdit && deal) {
				result = await dispatch(updateDeal({ publicId: deal.public_id, payload })).unwrap();
				toast.success('Deal updated successfully');
			} else {
				result = await dispatch(createDeal(payload)).unwrap();
				toast.success('Deal created successfully');
			}

			onSuccess(result);
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to save deal');
		} finally {
			setSubmitting(false);
		}
	};

	const steps: FormStep[] = [
		{
			label: 'Deal Details',
			description: 'Basic information, pipeline progress, owner, and status',
			content: (
				<DealDetailsStep
					title={title}
					setTitle={setTitle}
					pipelineId={pipelineId}
					setPipelineId={setPipelineId}
					pipelines={pipelines}
					stageId={stageId}
					setStageId={setStageId}
					selectedPipeline={selectedPipeline}
					ownerId={ownerId}
					setOwnerId={setOwnerId}
					owners={owners}
					closeDate={closeDate}
					setCloseDate={setCloseDate}
					status={status}
					setStatus={setStatus}
					lostReason={lostReason}
					setLostReason={setLostReason}
					touched={touched}
					fieldErrors={fieldErrors}
					DEAL_STATUSES={DEAL_STATUSES}
				/>
			)
		},
		{
			label: 'Value & Description',
			description: 'Financial values and description details',
			content: (
				<DealValueDescriptionStep
					value={value}
					setValue={setValue}
					currency={currency}
					setCurrency={setCurrency}
					currencies={currencies}
					description={description}
					setDescription={setDescription}
					tags={tags}
					setTags={setTags}
				/>
			)
		},
		{
			label: 'Associations',
			description: 'Link organization and candidate connections',
			content: (
				<DealAssociationsStep
					company={company}
					setCompany={setCompany}
					companyOptions={companyOptions}
					contact={contact}
					setContact={setContact}
					contactOptions={contactOptions}
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
				title={isEdit ? 'Edit Deal' : 'New Deal'}
				subtitle={isEdit ? 'Modify deal information' : 'Create a new sales opportunity'}
				mode={isEdit ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSave}
				onCancel={onClose}
				isSubmitting={submitting}
				saveButtonText={isEdit ? 'Save Changes' : 'Create Deal'}
				error={error}
			/>
		</Dialog>
	);
};

export default DealFormDialog;
