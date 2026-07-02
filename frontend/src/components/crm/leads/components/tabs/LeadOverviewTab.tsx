import React from 'react';
import { Box, Typography, Stack, IconButton, Tooltip, useTheme, alpha, Grid, Chip, Alert, Button } from '@mui/material';
import { Business, Person, LocalOffer, Payments, TrendingUp, Launch, Phone, ContentCopy } from '@mui/icons-material';
import { useAppSelector } from '../../../../../store/hooks';
import { RichTextViewer } from '../../../../common/form';
import useToast from '../../../../../hooks/useToast';
import useDateTime from '../../../../../hooks/useDateTime';
import type { Lead } from '../../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';

interface LeadOverviewTabProps {
	lead: Lead;
	owners: CRMOwnerOption[];
}

const getCurrencySymbol = (currency?: string): string => {
	const map: Record<string, string> = {
		USD: '$',
		EUR: '€',
		INR: '₹',
		GBP: '£',
		JPY: '¥',
		AUD: 'A$',
		CAD: 'C$',
		CNY: '¥',
		SGD: 'S$',
	};
	return currency ? (map[currency.toUpperCase()] || '') : '';
};

const formatValue = (value: number, currency: string) => {
	const symbol = getCurrencySymbol(currency);
	const formattedNum = new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
	return symbol ? `${symbol}${formattedNum}` : formattedNum;
};

export const LeadOverviewTab: React.FC<LeadOverviewTabProps> = ({ lead, owners }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const { formatDateTime } = useDateTime();

	const { companyOptions, contactOptions } = useAppSelector((state) => state.crm);

	const company = companyOptions.find((c) => c.id === lead.company_id);
	const contact = contactOptions.find((c) => c.id === lead.contact_id);
	const owner = lead.owner_id != null ? owners.find((o) => o.id === lead.owner_id) : undefined;
	const displayId = `LD-${String(lead.id).padStart(5, '0')}`;

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
			{lead.status === 'converted' && (
				<Alert 
					severity="success" 
					sx={{ 
						borderRadius: '12px', 
						fontWeight: 600,
						'& .MuiAlert-icon': { color: 'success.main' }
					}}
				>
					This lead has been successfully converted into an active placement deal.
				</Alert>
			)}

			{/* Financial & Priority Cards */}
			<Grid container spacing={2}>
				<Grid size={{ xs: 6 }}>
					<Box sx={{ ...fieldCardSx, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
						<Box>
							<Typography variant="caption" sx={labelSx}>Est. Value</Typography>
							<Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
								<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
									{lead.estimated_value != null ? formatValue(lead.estimated_value, lead.currency) : '—'}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
									{lead.currency}
								</Typography>
							</Stack>
						</Box>
						<Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), p: 1, borderRadius: '50%', color: 'primary.main', display: 'flex' }}>
							<Payments sx={{ fontSize: 20 }} />
						</Box>
					</Box>
				</Grid>
				<Grid size={{ xs: 6 }}>
					<Box sx={{ ...fieldCardSx, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid', borderLeftColor: 'warning.main' }}>
						<Box>
							<Typography variant="caption" sx={labelSx}>Priority</Typography>
							<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5, textTransform: 'capitalize' }}>
								{lead.priority}
							</Typography>
						</Box>
						<Box sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08), p: 1, borderRadius: '50%', color: 'warning.main', display: 'flex' }}>
							<TrendingUp sx={{ fontSize: 20 }} />
						</Box>
					</Box>
				</Grid>
			</Grid>

			{/* Description Section */}
			<Box sx={fieldCardSx}>
				<Typography variant="caption" sx={{ ...sectionTitleSx, display: 'block', mb: 1 }}>Description</Typography>
				{lead.description ? (
					<Box 
						sx={{ 
							maxHeight: 150,
							overflowY: 'auto',
							wordBreak: 'break-word',
							overflowWrap: 'break-word'
						}}
					>
						<RichTextViewer html={lead.description} />
					</Box>
				) : (
					<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
						No description provided. Click Edit to add details.
					</Typography>
				)}
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
									<Box sx={{ minWidth: 0, flex: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
											{contact.first_name} {contact.last_name || ''}
										</Typography>
										{contact.job_title && (
											<Typography variant="caption" color="text.secondary" display="block" noWrap>
												{contact.job_title}
											</Typography>
										)}
										
										{/* Email & Phone */}
										<Stack spacing={0.5} sx={{ mt: 0.5 }}>
											{contact.email && (
												<Stack direction="row" spacing={0.5} alignItems="center" sx={{ overflow: 'hidden' }}>
													<Tooltip title="Copy email">
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
											{(contact.phone || contact.mobile) && (
												<Stack direction="row" spacing={0.5} alignItems="center" sx={{ overflow: 'hidden' }}>
													<Phone sx={{ fontSize: 11, color: 'text.secondary' }} />
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} noWrap>
														{contact.phone || contact.mobile}
													</Typography>
												</Stack>
											)}
										</Stack>
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
							{formatDateTime(lead.created_at)}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Last Updated</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{formatDateTime(lead.updated_at)}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Lead ID</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
							{displayId}
						</Typography>
					</Grid>
				</Grid>
			</Box>

			{/* Tags */}
			{lead.tags && lead.tags.length > 0 && (
				<Box sx={fieldCardSx}>
					<Typography variant="caption" sx={labelSx}>Tags</Typography>
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
						{lead.tags.map((t) => (
							<Chip key={t} label={t} size="small" icon={<LocalOffer style={{ fontSize: 12 }} />} />
						))}
					</Stack>
				</Box>
			)}
		</Stack>
	);
};
