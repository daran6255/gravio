import React, { useEffect, useState } from 'react';
import {
	Box, Typography, Stack, IconButton, Tooltip, useTheme, alpha,
	Grid, TextField, InputAdornment, Button, Chip
} from '@mui/material';
import {
	Business, Person, LocalOffer, Payments, TrendingUp, Launch, InfoOutlined, ContentCopy,
	NotificationsActiveOutlined,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { updateDeal, fetchActiveReminders } from '../../../../../store/slices/crmSlice';
import useToast from '../../../../../hooks/useToast';
import { RichTextViewer, DatePicker } from '../../../../common/form';
import { SetReminderDialog } from '../../../shared';
import useDateTime from '../../../../../hooks/useDateTime';
import { formatReminderTime } from '../../../../../utils/reminders';
import { getCurrencySymbol, formatMoney, formatRate } from '../../../../../utils/currency';
import type { Deal } from '../../../../../models/crm/deal';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';

interface DealDetailsTabProps {
	deal: Deal;
	owners: CRMOwnerOption[];
}

const formatValue = (value: number, currency: string) => formatMoney(value, currency);

export const DealDetailsTab: React.FC<DealDetailsTabProps> = ({ deal, owners }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const { formatDate, formatDateTime } = useDateTime();

	const { companyOptions, contactOptions, activeReminders } = useAppSelector((state) => state.crm);

	const [value, setValue] = useState(deal.value != null ? Number(deal.value).toLocaleString() : '');
	const [closeDate, setCloseDate] = useState(deal.close_date || '');
	const [reminderOpen, setReminderOpen] = useState(false);

	useEffect(() => {
		setValue(deal.value != null ? Number(deal.value).toLocaleString() : '');
		setCloseDate(deal.close_date || '');
	}, [deal.value, deal.close_date, deal.id]);

	useEffect(() => {
		dispatch(fetchActiveReminders({ entityType: 'deal', entityIds: [deal.id] }));
	}, [dispatch, deal.id]);

	const activeReminder = activeReminders.find((r) => r.entity_type === 'deal' && r.entity_id === deal.id);

	const handleChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value.replace(/[^0-9.]/g, '');
		const parts = raw.split('.');
		const integerPart = parts[0] ? Number(parts[0]).toLocaleString() : '';
		const decimalPart = parts[1] !== undefined ? '.' + parts[1].slice(0, 2) : '';
		setValue(integerPart + decimalPart);
	};

	const handleSaveValue = () => {
		const parsed = value ? Number(value.replace(/,/g, '')) : undefined;
		if (parsed !== deal.value) {
			dispatch(updateDeal({ publicId: deal.public_id, payload: { value: parsed } }));
		}
	};

	const handleCloseDateChange = (newValue: string) => {
		setCloseDate(newValue);
		if (newValue !== (deal.close_date || '')) {
			dispatch(updateDeal({ publicId: deal.public_id, payload: { close_date: newValue || undefined } }));
		}
	};

	const company = companyOptions.find((c) => c.id === deal.company_id);
	const contact = contactOptions.find((c) => c.id === deal.contact_id);
	const owner = deal.owner_id != null ? owners.find((o) => o.id === deal.owner_id) : undefined;
	const displayId = `DL-${String(deal.id).padStart(5, '0')}`;
	const description = deal.custom_fields?.description;

	const fieldCardSx = {
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		p: 1.75,
		boxShadow: isDark ? '0px 4px 20px rgba(0,0,0,0.15)' : '0px 4px 20px rgba(0,0,0,0.02)',
	};

	const labelSx = {
		fontWeight: 700,
		color: 'text.secondary',
		textTransform: 'uppercase' as const,
		fontSize: '0.65rem',
		letterSpacing: '0.07em',
		display: 'block' as const,
		mb: 0.5,
	};

	const sectionTitleSx = {
		fontWeight: 800,
		fontSize: '0.7rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.08em',
		color: 'text.primary',
	};

	return (
		<Stack spacing={2.5}>
			{/* Deal Financials Cards */}
			<Grid container spacing={2}>
				<Grid size={{ xs: 6 }}>
					<Box sx={{ ...fieldCardSx, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
						<Box>
							<Typography variant="caption" sx={labelSx}>Deal Value</Typography>
							{deal.display_value != null && deal.display_currency ? (
								<>
									<Tooltip title={`Converted using the exchange rate on ${formatDate(deal.created_at)}`} arrow>
										<Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
											<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
												{formatMoney(deal.display_value, deal.display_currency)}
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
												{deal.display_currency}
											</Typography>
										</Stack>
									</Tooltip>
									{deal.display_rate != null && (
										<Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25, fontSize: '0.68rem' }}>
											{formatRate(deal.currency, deal.display_currency, deal.display_rate)}
										</Typography>
									)}
								</>
							) : (
								<Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
									<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
										{deal.value != null ? formatValue(deal.value, deal.currency) : '—'}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
										{deal.currency}
									</Typography>
								</Stack>
							)}
						</Box>
						<Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), p: 1, borderRadius: '50%', color: 'primary.main', display: 'flex' }}>
							<Payments sx={{ fontSize: 20 }} />
						</Box>
					</Box>
				</Grid>
				<Grid size={{ xs: 6 }}>
					<Box sx={{ ...fieldCardSx, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
						<Box>
							<Typography variant="caption" sx={labelSx}>Win Probability</Typography>
							<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }}>
								{deal.probability}%
							</Typography>
						</Box>
						<Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), p: 1, borderRadius: '50%', color: 'success.main', display: 'flex' }}>
							<TrendingUp sx={{ fontSize: 20 }} />
						</Box>
					</Box>
				</Grid>
			</Grid>

			{/* Description Section */}
			<Box sx={fieldCardSx}>
				<Typography variant="caption" sx={{ ...sectionTitleSx, display: 'block', mb: 1 }}>Description</Typography>
				{description ? (
					<Box 
						sx={{ 
							maxHeight: 150,
							overflowY: 'auto',
							wordBreak: 'break-word',
							overflowWrap: 'break-word'
						}} 
					>
						<RichTextViewer html={description} />
					</Box>
				) : (
					<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
						No description provided. Click Edit to add details.
					</Typography>
				)}
			</Box>

			{/* Quick Updates Section */}
			<Box sx={fieldCardSx}>
				<Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
					<Typography variant="caption" sx={sectionTitleSx}>Quick Updates</Typography>
					<Tooltip title="Changes auto-save when you click away (blur)">
						<InfoOutlined sx={{ fontSize: 13, color: 'text.secondary', cursor: 'help' }} />
					</Tooltip>
				</Stack>
				<Stack direction="row" spacing={2} sx={{ width: '100%' }}>
					<Box sx={{ flex: 1 }}>
						<TextField
							label="Deal Value"
							value={value}
							onChange={handleChangeValue}
							onBlur={handleSaveValue}
							size="small"
							fullWidth
							InputProps={{
								startAdornment: <InputAdornment position="start">{getCurrencySymbol(deal.currency)}</InputAdornment>,
								endAdornment: <InputAdornment position="end">{deal.currency}</InputAdornment>,
							}}
						/>
					</Box>
					<Box sx={{ flex: 1 }}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<DatePicker
								label="Close Date"
								value={closeDate}
								onChange={handleCloseDateChange}
							/>
							<Tooltip title="Set reminder">
								<IconButton size="small" onClick={() => setReminderOpen(true)} sx={{ color: 'text.disabled', '&:hover': { color: 'warning.main' } }}>
									<NotificationsActiveOutlined sx={{ fontSize: 18 }} />
								</IconButton>
							</Tooltip>
						</Stack>
						{activeReminder && (
							<Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.75 }}>
								<NotificationsActiveOutlined sx={{ fontSize: 12, color: 'warning.main' }} />
								<Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600, fontSize: '0.7rem' }}>
									Reminds {formatReminderTime(activeReminder.remind_at)}
								</Typography>
							</Stack>
						)}
					</Box>
				</Stack>
			</Box>

			{/* Associated Entities Section */}
			<Box sx={fieldCardSx}>
				<Typography variant="caption" sx={{ ...sectionTitleSx, display: 'block', mb: 1.5 }}>Associations</Typography>
				<Grid container spacing={2}>
					{/* Company Card */}
					<Grid size={{ xs: 12, sm: 6 }}>
						<Box sx={{
							p: 1.5,
							borderRadius: '8px',
							border: '1px solid',
							borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
							bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							gap: 1
						}}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Business color="primary" fontSize="small" sx={{ opacity: 0.8 }} />
								<Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em' }}>
									Company
								</Typography>
							</Stack>
							
							{company ? (
								<Box>
									<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>
										{company.name}
									</Typography>
									{company.industry && (
										<Typography variant="caption" color="text.secondary" display="block">
											{company.industry}
										</Typography>
									)}
									{company.website && (
										<Button
											href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
											target="_blank"
											rel="noopener noreferrer"
											variant="text"
											size="small"
											endIcon={<Launch sx={{ fontSize: 10 }} />}
											sx={{ 
												p: 0, 
												mt: 0.5, 
												justifyContent: 'flex-start',
												textTransform: 'none', 
												fontSize: '0.72rem',
												fontWeight: 600,
												color: 'primary.main',
												minWidth: 0,
												'&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
											}}
										>
											Visit website
										</Button>
									)}
								</Box>
							) : (
								<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 0.5 }}>
									No company linked
								</Typography>
							)}
						</Box>
					</Grid>

					{/* Contact Card */}
					<Grid size={{ xs: 12, sm: 6 }}>
						<Box sx={{
							p: 1.5,
							borderRadius: '8px',
							border: '1px solid',
							borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
							bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							gap: 1
						}}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Person color="primary" fontSize="small" sx={{ opacity: 0.8 }} />
								<Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em' }}>
									Contact Person
								</Typography>
							</Stack>
							
							{contact ? (
								<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
									<Box sx={{ 
										width: 28, 
										height: 28, 
										borderRadius: '50%', 
										bgcolor: alpha(theme.palette.primary.main, 0.1),
										color: 'primary.main',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontWeight: 700,
										fontSize: '0.75rem',
										flexShrink: 0
									}}>
										{((contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')).toUpperCase()}
									</Box>
									<Box sx={{ minWidth: 0 }}>
										<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
											{contact.first_name} {contact.last_name || ''}
										</Typography>
										{contact.job_title && (
											<Typography variant="caption" color="text.secondary" display="block" noWrap>
												{contact.job_title}
											</Typography>
										)}
										
										{contact.email && (
											<Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
												<Tooltip title={`Copy email: ${contact.email}`}>
													<IconButton 
														size="small" 
														onClick={() => {
															navigator.clipboard.writeText(contact.email || '');
															toast.success('Email copied to clipboard');
														}}
														sx={{ p: 0.1, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
													>
														<ContentCopy sx={{ fontSize: 11 }} />
													</IconButton>
												</Tooltip>
												<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} noWrap>
													{contact.email}
												</Typography>
											</Stack>
										)}
									</Box>
								</Box>
							) : (
								<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 0.5 }}>
									No contact linked
								</Typography>
							)}
						</Box>
					</Grid>
				</Grid>
			</Box>

			{/* System Info Fields */}
			<Box sx={fieldCardSx}>
				<Typography variant="caption" sx={{ ...sectionTitleSx, display: 'block', mb: 1.5 }}>System Details</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Owner</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{owner ? (owner.full_name || owner.email) : 'Unassigned'}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Created On</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{formatDateTime(deal.created_at)}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Last Updated</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{formatDateTime(deal.updated_at)}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Deal ID</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
							{displayId}
						</Typography>
					</Grid>
				</Grid>
			</Box>

			{/* Tags */}
			{deal.tags && deal.tags.length > 0 && (
				<Box sx={fieldCardSx}>
					<Typography variant="caption" sx={labelSx}>Tags</Typography>
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
						{deal.tags.map((t) => (
							<Chip key={t} label={t} size="small" icon={<LocalOffer style={{ fontSize: 12 }} />} />
						))}
					</Stack>
				</Box>
			)}

			{/* Lost Reason banner */}
			{deal.status === 'lost' && deal.lost_reason && (
				<Box sx={{ ...fieldCardSx, borderColor: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.04) }}>
					<Typography variant="caption" sx={{ ...labelSx, color: 'error.main' }}>Reason for loss</Typography>
					<Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
						{deal.lost_reason}
					</Typography>
				</Box>
			)}

			<SetReminderDialog
				open={reminderOpen}
				onClose={() => setReminderOpen(false)}
				entityType="deal"
				entityId={deal.id}
				entityLabel={deal.title}
				defaultDueDate={deal.close_date}
			/>
		</Stack>
	);
};
