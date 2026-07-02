import React from 'react';
import { Box, Typography, Stack, Grid, Button, useTheme, alpha } from '@mui/material';
import { Language, Phone, Email, LocationOn, Launch, Handshake, Groups, LocalOffer, Person } from '@mui/icons-material';
import type { Company } from '../../../../../models/crm/company';
import type { Deal } from '../../../../../models/crm/deal';
import type { Contact } from '../../../../../models/crm/contact';
import useDateTime from '../../../../../hooks/useDateTime';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';

interface CompanyDetailsTabProps {
	company: Company;
	address: string | null;
	owners: CRMOwnerOption[];
	linkedDeals: Deal[];
	linkedContacts: Contact[];
	onNavigateTab?: (tab: number) => void;
}

export const CompanyDetailsTab: React.FC<CompanyDetailsTabProps> = ({
	company, address, owners, linkedDeals, linkedContacts, onNavigateTab,
}) => {
	const { formatDateTime } = useDateTime();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const displayId = `CO-${String(company.id).padStart(5, '0')}`;
	const owner = company.owner_id != null ? owners.find((o) => o.id === company.owner_id) : undefined;

	const getFieldCardSx = (accentColor?: string) => ({
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		p: 2,
		boxShadow: isDark ? '0px 4px 20px rgba(0,0,0,0.15)' : '0px 4px 20px rgba(0,0,0,0.02)',
		...(accentColor && {
			borderLeft: '4px solid',
			borderLeftColor: accentColor,
		}),
	});

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
			{/* Quick Stats — jump straight to the Deals/Contacts tabs */}
			<Grid container spacing={2}>
				<Grid size={{ xs: 6 }}>
					<Box
						onClick={() => onNavigateTab?.(2)}
						sx={{
							...getFieldCardSx('primary.main'),
							p: 2,
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							cursor: onNavigateTab ? 'pointer' : 'default',
							transition: 'transform 0.15s',
							'&:hover': onNavigateTab ? { transform: 'translateY(-2px)' } : undefined,
						}}
					>
						<Box>
							<Typography variant="caption" sx={labelSx}>Deals</Typography>
							<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }}>
								{linkedDeals.length}
							</Typography>
						</Box>
						<Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), p: 1, borderRadius: '50%', color: 'primary.main', display: 'flex' }}>
							<Handshake sx={{ fontSize: 20 }} />
						</Box>
					</Box>
				</Grid>
				<Grid size={{ xs: 6 }}>
					<Box
						onClick={() => onNavigateTab?.(1)}
						sx={{
							...getFieldCardSx('success.main'),
							p: 2,
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							cursor: onNavigateTab ? 'pointer' : 'default',
							transition: 'transform 0.15s',
							'&:hover': onNavigateTab ? { transform: 'translateY(-2px)' } : undefined,
						}}
					>
						<Box>
							<Typography variant="caption" sx={labelSx}>Contacts</Typography>
							<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }}>
								{linkedContacts.length}
							</Typography>
						</Box>
						<Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), p: 1, borderRadius: '50%', color: 'success.main', display: 'flex' }}>
							<Groups sx={{ fontSize: 20 }} />
						</Box>
					</Box>
				</Grid>
			</Grid>

			{/* Company Profile Card */}
			<Box sx={getFieldCardSx('primary.main')}>
				<Typography variant="caption" sx={{ ...sectionTitleSx, mb: 1.5, display: 'block' }}>Profile</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 6, sm: 4 }}>
						<Typography variant="caption" sx={labelSx}>Industry</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{company.industry || '—'}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6, sm: 4 }}>
						<Typography variant="caption" sx={labelSx}>Company Size</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
							{company.size || '—'}
						</Typography>
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Typography variant="caption" sx={labelSx}>Owner</Typography>
						{owner ? (
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
								<Box sx={{
									width: 22,
									height: 22,
									borderRadius: '50%',
									bgcolor: alpha(theme.palette.primary.main, 0.1),
									color: 'primary.main',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 700,
									fontSize: '0.65rem',
									flexShrink: 0,
								}}>
									{(owner.full_name || owner.email)[0]?.toUpperCase()}
								</Box>
								<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
									{owner.full_name || owner.email}
								</Typography>
							</Stack>
						) : (
							<Typography variant="body2" sx={{ fontWeight: 600 }}>Unassigned</Typography>
						)}
					</Grid>
				</Grid>
			</Box>

			{/* Contact Details Card */}
			<Box sx={getFieldCardSx('success.main')}>
				<Typography variant="caption" sx={{ ...sectionTitleSx, mb: 1.5, display: 'block' }}>Contact Information</Typography>
				<Grid container spacing={2}>
					{company.website && (
						<Grid size={{ xs: 12, sm: 6 }}>
							<Stack direction="row" spacing={1.5} alignItems="center">
								<Language fontSize="small" sx={{ color: 'text.secondary' }} />
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="caption" sx={labelSx}>Website</Typography>
									<Button
										href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
										target="_blank"
										rel="noopener noreferrer"
										variant="text"
										size="small"
										endIcon={<Launch sx={{ fontSize: 10 }} />}
										sx={{
											p: 0,
											textTransform: 'none',
											fontSize: '0.85rem',
											fontWeight: 600,
											color: 'primary.main',
											minWidth: 0,
											'&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
										}}
									>
										{company.website}
									</Button>
								</Box>
							</Stack>
						</Grid>
					)}
					{company.phone && (
						<Grid size={{ xs: 12, sm: 6 }}>
							<Stack direction="row" spacing={1.5} alignItems="center">
								<Phone fontSize="small" sx={{ color: 'text.secondary' }} />
								<Box>
									<Typography variant="caption" sx={labelSx}>Phone</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>{company.phone}</Typography>
								</Box>
							</Stack>
						</Grid>
					)}
					{company.email && (
						<Grid size={{ xs: 12, sm: 6 }}>
							<Stack direction="row" spacing={1.5} alignItems="center">
								<Email fontSize="small" sx={{ color: 'text.secondary' }} />
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="caption" sx={labelSx}>Email</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{company.email}</Typography>
								</Box>
							</Stack>
						</Grid>
					)}
					{address && (
						<Grid size={{ xs: 12, sm: company.email ? 12 : 6 }}>
							<Stack direction="row" spacing={1.5} alignItems="center">
								<LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
								<Box>
									<Typography variant="caption" sx={labelSx}>Address</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>{address}</Typography>
								</Box>
							</Stack>
						</Grid>
					)}
					{!company.website && !company.phone && !company.email && !address && (
						<Grid size={{ xs: 12 }}>
							<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
								No contact details provided.
							</Typography>
						</Grid>
					)}
				</Grid>
			</Box>

			{/* Key Contact preview (first linked contact) */}
			{linkedContacts.length > 0 && (
				<Box sx={getFieldCardSx('secondary.main')}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
						<Typography variant="caption" sx={sectionTitleSx}>Primary Contact</Typography>
						{linkedContacts.length > 1 && onNavigateTab && (
							<Typography
								variant="caption"
								onClick={() => onNavigateTab(1)}
								sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
							>
								+{linkedContacts.length - 1} more
							</Typography>
						)}
					</Stack>
					{(() => {
						const contact = linkedContacts[0];
						return (
							<Stack direction="row" spacing={1.5} alignItems="center">
								<Box sx={{
									width: 32,
									height: 32,
									borderRadius: '50%',
									bgcolor: alpha(theme.palette.secondary.main, 0.1),
									color: 'secondary.main',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 700,
									fontSize: '0.8rem',
									flexShrink: 0,
								}}>
									<Person sx={{ fontSize: 16 }} />
								</Box>
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
										{contact.first_name} {contact.last_name || ''}
									</Typography>
									<Typography variant="caption" color="text.secondary" noWrap display="block">
										{contact.job_title || contact.email || '—'}
									</Typography>
								</Box>
							</Stack>
						);
					})()}
				</Box>
			)}

			{/* Tags */}
			{company.tags && company.tags.length > 0 && (
				<Box sx={getFieldCardSx()}>
					<Typography variant="caption" sx={labelSx}>Tags</Typography>
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
						{company.tags.map((t) => (
							<Box
								key={t}
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 0.5,
									px: 1,
									py: 0.4,
									borderRadius: '6px',
									bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
									fontSize: '0.72rem',
									fontWeight: 600,
								}}
							>
								<LocalOffer sx={{ fontSize: 12 }} />
								{t}
							</Box>
						))}
					</Stack>
				</Box>
			)}

			{/* System Info Card */}
			<Box sx={getFieldCardSx('info.main')}>
				<Typography variant="caption" sx={{ ...sectionTitleSx, mb: 1.5, display: 'block' }}>System Details</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Company ID</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
							{displayId}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Created On</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{formatDateTime(company.created_at)}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Last Updated</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{formatDateTime(company.updated_at)}
						</Typography>
					</Grid>
				</Grid>
			</Box>
		</Stack>
	);
};

export default CompanyDetailsTab;
