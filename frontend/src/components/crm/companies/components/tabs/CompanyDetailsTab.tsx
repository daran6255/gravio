import React from 'react';
import { Box, Typography, Stack, Grid, Button, useTheme, alpha } from '@mui/material';
import {
	Language, Phone, Email, LocationOn, Launch, Handshake, Groups, LocalOffer, Person, ChevronRight,
	Business, ContactPhone, InfoOutlined,
} from '@mui/icons-material';
import type { Company } from '../../../../../models/crm/company';
import type { Deal } from '../../../../../models/crm/deal';
import type { Contact } from '../../../../../models/crm/contact';
import useDateTime from '../../../../../hooks/useDateTime';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';

// theme.palette.secondary.main is the near-black brand "logo dark" color, not a
// real accent hue — it's invisible against the dark-mode background. Use a fixed
// accent for the Primary Contact card instead of that palette slot.
const PRIMARY_CONTACT_COLOR = '#EC4899';

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

	const getFieldCardSx = () => ({
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		p: 2,
		boxShadow: isDark ? '0px 4px 20px rgba(0,0,0,0.15)' : '0px 4px 20px rgba(0,0,0,0.02)',
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

	const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; color: string; action?: React.ReactNode }> = ({ icon, title, color, action }) => (
		<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
			<Stack direction="row" spacing={1.25} alignItems="center">
				<Box sx={{ bgcolor: alpha(color, 0.12), color, p: 0.7, borderRadius: '8px', display: 'flex' }}>
					{icon}
				</Box>
				<Typography variant="caption" sx={sectionTitleSx}>{title}</Typography>
			</Stack>
			{action}
		</Stack>
	);

	return (
		<Stack spacing={2.5}>
			{/* Quick Stats — jump straight to the Deals/Contacts tabs */}
			<Grid container spacing={2}>
				<Grid size={{ xs: 6 }}>
					<Box
						onClick={() => onNavigateTab?.(2)}
						sx={{
							borderRadius: '14px',
							border: '1px solid',
							borderColor: alpha(theme.palette.primary.main, 0.18),
							bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.05),
							p: 2,
							cursor: onNavigateTab ? 'pointer' : 'default',
							transition: 'transform 0.15s, border-color 0.15s',
							'&:hover': onNavigateTab ? {
								transform: 'translateY(-2px)',
								borderColor: alpha(theme.palette.primary.main, 0.4),
							} : undefined,
						}}
					>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), p: 0.75, borderRadius: '10px', color: 'primary.main', display: 'flex' }}>
								<Handshake sx={{ fontSize: 18 }} />
							</Box>
							{onNavigateTab && <ChevronRight sx={{ fontSize: 18, color: alpha(theme.palette.primary.main, 0.5) }} />}
						</Stack>
						<Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 1.5, lineHeight: 1 }}>
							{linkedDeals.length}
						</Typography>
						<Typography variant="caption" sx={{ ...labelSx, mt: 0.75, mb: 0.25 }}>Deals</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', lineHeight: 1.3 }}>
							Open pipeline deals linked to this company
						</Typography>
					</Box>
				</Grid>
				<Grid size={{ xs: 6 }}>
					<Box
						onClick={() => onNavigateTab?.(1)}
						sx={{
							borderRadius: '14px',
							border: '1px solid',
							borderColor: alpha(theme.palette.success.main, 0.18),
							bgcolor: alpha(theme.palette.success.main, isDark ? 0.08 : 0.05),
							p: 2,
							cursor: onNavigateTab ? 'pointer' : 'default',
							transition: 'transform 0.15s, border-color 0.15s',
							'&:hover': onNavigateTab ? {
								transform: 'translateY(-2px)',
								borderColor: alpha(theme.palette.success.main, 0.4),
							} : undefined,
						}}
					>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), p: 0.75, borderRadius: '10px', color: 'success.main', display: 'flex' }}>
								<Groups sx={{ fontSize: 18 }} />
							</Box>
							{onNavigateTab && <ChevronRight sx={{ fontSize: 18, color: alpha(theme.palette.success.main, 0.5) }} />}
						</Stack>
						<Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 1.5, lineHeight: 1 }}>
							{linkedContacts.length}
						</Typography>
						<Typography variant="caption" sx={{ ...labelSx, mt: 0.75, mb: 0.25 }}>Contacts</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', lineHeight: 1.3 }}>
							People linked to this company
						</Typography>
					</Box>
				</Grid>
			</Grid>

			{/* Company Profile Card */}
			<Box sx={getFieldCardSx()}>
				<SectionHeader icon={<Business sx={{ fontSize: 16 }} />} title="Profile" color={theme.palette.primary.main} />
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
			<Box sx={getFieldCardSx()}>
				<SectionHeader icon={<ContactPhone sx={{ fontSize: 16 }} />} title="Contact Information" color={theme.palette.success.main} />
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
				<Box sx={getFieldCardSx()}>
					<SectionHeader
						icon={<Person sx={{ fontSize: 16 }} />}
						title="Primary Contact"
						color={PRIMARY_CONTACT_COLOR}
						action={linkedContacts.length > 1 && onNavigateTab && (
							<Typography
								variant="caption"
								onClick={() => onNavigateTab(1)}
								sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
							>
								+{linkedContacts.length - 1} more
							</Typography>
						)}
					/>
					{(() => {
						const contact = linkedContacts[0];
						return (
							<Stack direction="row" spacing={1.5} alignItems="center">
								<Box sx={{
									width: 32,
									height: 32,
									borderRadius: '50%',
									bgcolor: alpha(PRIMARY_CONTACT_COLOR, 0.12),
									color: PRIMARY_CONTACT_COLOR,
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
					<SectionHeader icon={<LocalOffer sx={{ fontSize: 16 }} />} title="Tags" color={theme.palette.warning.main} />
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
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
			<Box sx={getFieldCardSx()}>
				<SectionHeader icon={<InfoOutlined sx={{ fontSize: 16 }} />} title="System Details" color={theme.palette.info.main} />
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
