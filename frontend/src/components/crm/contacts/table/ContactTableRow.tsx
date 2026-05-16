import React, { memo } from 'react';
import { TableRow, TableCell, Stack, Typography, Box, Tooltip, Chip } from '@mui/material';
import {
	Email as EmailIcon,
	Phone as PhoneIcon,
	Star as StarIcon,
	WhatsApp as WhatsAppIcon,
	Edit as EditIcon,
	Delete as DeleteIcon
} from '@mui/icons-material';
import EnterpriseAvatar from '../../../common/avatar/Avatar';
import DataTableActions, { type TableMenuAction } from '../../../common/table/DataTableActions';
import { useDateTime } from '../../../../hooks/useDateTime';
import type { Contact } from '../../../../models/contact';

interface ContactTableRowProps {
	contact: Contact;
	isAdmin: boolean;
	onEdit: (contact: Contact) => void;
	onDelete?: (contact: Contact) => void;
	onClick: (contact: Contact) => void;
}

const ContactTableRow: React.FC<ContactTableRowProps> = memo(({
	contact,
	isAdmin,
	onEdit,
	onDelete,
	onClick,
}) => {
	const { formatDate } = useDateTime();

	const actions: TableMenuAction<Contact>[] = [
		{
			label: 'Edit',
			icon: <EditIcon fontSize="small" />,
			onClick: (item) => onEdit(item)
		},
		{
			label: 'Delete',
			icon: <DeleteIcon fontSize="small" />,
			onClick: (item) => onDelete?.(item),
			color: 'error.main',
			hidden: !isAdmin || !onDelete
		}
	];

	return (
		<TableRow
			hover
			tabIndex={-1}
			onClick={() => onClick(contact)}
			sx={{
				cursor: 'pointer',
				'&:hover': { bgcolor: 'action.hover' },
				'&:last-child td': { borderBottom: 0 },
			}}
		>
			{/* Contact Name & Details */}
			<TableCell>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<EnterpriseAvatar name={`${contact.first_name} ${contact.last_name}`} size={32} />
					<Box>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Typography
								variant="body2"
								sx={{ fontWeight: 700, color: 'primary.main' }}
							>
								{contact.first_name} {contact.last_name}
							</Typography>
							{contact.is_primary && (
								<Tooltip title="Primary Contact">
									<StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
								</Tooltip>
							)}
						</Stack>
						<Typography variant="caption" color="text.secondary">
							{contact.designation || 'No Designation'}
						</Typography>
					</Box>
				</Stack>
			</TableCell>

			{/* Company */}
			<TableCell>
				<Typography variant="body2" color="text.primary">
					{contact.company?.name || '—'}
				</Typography>
			</TableCell>

			{/* Email */}
			<TableCell>
				{contact.email ? (
					<Stack direction="row" spacing={1} alignItems="center">
						<EmailIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
						<Typography variant="body2" color="text.primary">
							{contact.email}
						</Typography>
					</Stack>
				) : (
					<Typography variant="body2" color="text.disabled">—</Typography>
				)}
			</TableCell>

			{/* Phone */}
			<TableCell>
				{contact.phone ? (
					<Stack direction="row" spacing={1} alignItems="center">
						<PhoneIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
						<Typography variant="body2" color="text.primary">
							{contact.phone}
						</Typography>
					</Stack>
				) : (
					<Typography variant="body2" color="text.disabled">—</Typography>
				)}
			</TableCell>

			{/* Decision Maker */}
			<TableCell>
				{contact.is_decision_maker ? (
					<Typography
						variant="caption"
						sx={{
							color: 'success.main',
							fontWeight: 700,
							textTransform: 'uppercase',
							letterSpacing: '0.02em'
						}}
					>
						Yes
					</Typography>
				) : (
					<Typography variant="body2" color="text.disabled">—</Typography>
				)}
			</TableCell>

			{/* Source */}
			<TableCell>
				{contact.contact_source === 'whatsapp' ? (
					<Chip
						icon={<WhatsAppIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
						label="WhatsApp"
						size="small"
						sx={{
							bgcolor: '#25D366',
							color: '#fff',
							fontWeight: 700,
							fontSize: '0.7rem',
							height: 20,
							'& .MuiChip-label': { px: 0.75 },
						}}
					/>
				) : contact.contact_source ? (
					<Chip
						label={contact.contact_source.replace(/_/g, ' ')}
						size="small"
						variant="outlined"
						sx={{
							fontSize: '0.7rem',
							height: 20,
							textTransform: 'capitalize',
							'& .MuiChip-label': { px: 0.75 }
						}}
					/>
				) : (
					<Typography variant="body2" color="text.disabled">—</Typography>
				)}
			</TableCell>

			{/* Date Added */}
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{formatDate(contact.created_at)}
				</Typography>
			</TableCell>

			{/* Actions */}
			<TableCell align="right" onClick={(e) => e.stopPropagation()}>
				<DataTableActions
					item={contact}
					actions={actions}
				/>
			</TableCell>
		</TableRow>
	);
});

ContactTableRow.displayName = 'ContactTableRow';

export default ContactTableRow;
