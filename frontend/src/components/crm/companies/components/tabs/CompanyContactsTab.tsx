import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Tooltip, IconButton, useTheme, Button, Stack } from '@mui/material';
import { Person, ContentCopy, Add } from '@mui/icons-material';
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

	return (
		<Box>
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
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
				<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
					No contacts linked yet.
				</Typography>
			) : (
				<List dense disablePadding>
					{linkedContacts.map((contact) => (
						<ListItem
							key={contact.public_id}
							sx={{
								borderRadius: '8px',
								mb: 1.25,
								border: '1px solid',
								borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
								bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
								px: 1.5,
								py: 1
							}}
						>
							<Person fontSize="small" sx={{ color: 'text.secondary', mr: 1.5 }} />
							<ListItemText
								primary={`${contact.first_name} ${contact.last_name || ''}`.trim()}
								secondary={contact.job_title || contact.email}
								primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
								secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
							/>
							{contact.email && (
								<Tooltip title="Copy Email">
									<IconButton
										size="small"
										onClick={() => {
											navigator.clipboard.writeText(contact.email || '');
											toast.success('Email copied to clipboard');
										}}
									>
										<ContentCopy sx={{ fontSize: 13 }} />
									</IconButton>
								</Tooltip>
							)}
						</ListItem>
					))}
				</List>
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
