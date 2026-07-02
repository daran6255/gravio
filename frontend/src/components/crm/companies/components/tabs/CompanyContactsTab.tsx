import React, { useState } from 'react';
import { Box, Typography, Grid, Tooltip, IconButton, useTheme, Button, Stack, alpha } from '@mui/material';
import { Person, ContentCopy, Add, Phone, Star } from '@mui/icons-material';
import type { Contact } from '../../../../../models/crm/contact';
import type { Company } from '../../../../../models/crm/company';
import { fetchLinkedContacts } from '../../../../../store/slices/crmSlice';
import { useAppDispatch } from '../../../../../store/hooks';
import ContactFormDialog from '../../../contacts/forms/ContactFormDialog';
import useToast from '../../../../../hooks/useToast';

interface CompanyContactsTabProps {
	company: Company;
	linkedContacts: Contact[];
	linkedContactsLoading: boolean;
}

export const CompanyContactsTab: React.FC<CompanyContactsTabProps> = ({
	company,
	linkedContacts,
	linkedContactsLoading,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const dispatch = useAppDispatch();

	const [dialogOpen, setDialogOpen] = useState(false);

	const fieldCardSx = {
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		boxShadow: isDark ? '0px 4px 20px rgba(0,0,0,0.15)' : '0px 4px 20px rgba(0,0,0,0.02)',
		p: 1.75,
		height: '100%',
	};

	return (
		<Box>
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
				<Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.primary' }}>
					Linked Contacts ({linkedContacts.length})
				</Typography>
				<Button
					variant="contained"
					size="small"
					startIcon={<Add />}
					onClick={() => setDialogOpen(true)}
					sx={{
						borderRadius: '8px',
						textTransform: 'none',
						fontWeight: 700,
						py: 0.5,
						px: 1.5,
						fontSize: '0.75rem',
						background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
						boxShadow: '0 2px 8px rgba(139, 124, 246, 0.25)',
					}}
				>
					Add Contact
				</Button>
			</Stack>

			{linkedContactsLoading ? (
				<Typography variant="caption" color="text.secondary">Loading contacts...</Typography>
			) : linkedContacts.length === 0 ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 1.5 }}>
					<Box sx={{ width: 56, height: 56, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
						<Person sx={{ fontSize: 26, color: 'text.disabled' }} />
					</Box>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>No contacts yet</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 260 }}>
						Add the people you work with at this company to keep track of who to reach.
					</Typography>
				</Box>
			) : (
				<Grid container spacing={1.5}>
					{linkedContacts.map((contact) => (
						<Grid size={{ xs: 12, sm: 6 }} key={contact.public_id}>
							<Box sx={fieldCardSx}>
								<Stack direction="row" spacing={1.25} alignItems="flex-start">
									<Box sx={{
										width: 32,
										height: 32,
										borderRadius: '50%',
										bgcolor: alpha(theme.palette.primary.main, 0.1),
										color: 'primary.main',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontWeight: 700,
										fontSize: '0.8rem',
										flexShrink: 0,
									}}>
										{((contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')).toUpperCase()}
									</Box>
									<Box sx={{ minWidth: 0, flex: 1 }}>
										<Stack direction="row" spacing={0.5} alignItems="center">
											<Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
												{contact.first_name} {contact.last_name || ''}
											</Typography>
											{contact.is_primary && (
												<Tooltip title="Primary contact">
													<Star sx={{ fontSize: 14, color: 'warning.main' }} />
												</Tooltip>
											)}
										</Stack>
										{(contact.job_title || contact.department) && (
											<Typography variant="caption" color="text.secondary" display="block" noWrap>
												{[contact.job_title, contact.department].filter(Boolean).join(' · ')}
											</Typography>
										)}
										{contact.email && (
											<Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
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
											<Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
												<Phone sx={{ fontSize: 12, color: 'text.secondary' }} />
												<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
													{contact.phone || contact.mobile}
												</Typography>
											</Stack>
										)}
									</Box>
								</Stack>
							</Box>
						</Grid>
					))}
				</Grid>
			)}

			<ContactFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				defaultCompany={company}
				onSuccess={() => {
					dispatch(fetchLinkedContacts(company.id));
				}}
			/>
		</Box>
	);
};

export default CompanyContactsTab;
