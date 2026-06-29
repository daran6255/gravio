import React from 'react';
import { Box, Typography, Stack, Grid, Button, useTheme } from '@mui/material';
import { Language, Phone, Email, LocationOn, Launch } from '@mui/icons-material';
import type { Company } from '../../../../../models/crm/company';

interface CompanyDetailsTabProps {
	company: Company;
	address: string | null;
}

export const CompanyDetailsTab: React.FC<CompanyDetailsTabProps> = ({ company, address }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const displayId = `CO-${String(company.id).padStart(5, '0')}`;

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
			{/* Company Profile Card */}
			<Box sx={getFieldCardSx('primary.main')}>
				<Typography variant="caption" sx={{ ...sectionTitleSx, mb: 1.5, display: 'block' }}>Profile</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Industry</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{company.industry || '—'}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Company Size</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
							{company.size || '—'}
						</Typography>
					</Grid>
				</Grid>
			</Box>

			{/* Contact Details Card */}
			<Box sx={getFieldCardSx('success.main')}>
				<Typography variant="caption" sx={{ ...sectionTitleSx, mb: 1.5, display: 'block' }}>Contact Information</Typography>
				<Stack spacing={1.5}>
					{company.website && (
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Language fontSize="small" sx={{ color: 'text.secondary' }} />
							<Box>
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
					)}
					{company.phone && (
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Phone fontSize="small" sx={{ color: 'text.secondary' }} />
							<Box>
								<Typography variant="caption" sx={labelSx}>Phone</Typography>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>{company.phone}</Typography>
							</Box>
						</Stack>
					)}
					{company.email && (
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Email fontSize="small" sx={{ color: 'text.secondary' }} />
							<Box>
								<Typography variant="caption" sx={labelSx}>Email</Typography>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>{company.email}</Typography>
							</Box>
						</Stack>
					)}
					{address && (
						<Stack direction="row" spacing={1.5} alignItems="center">
							<LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
							<Box>
								<Typography variant="caption" sx={labelSx}>Address</Typography>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>{address}</Typography>
							</Box>
						</Stack>
					)}
					{!company.website && !company.phone && !company.email && !address && (
						<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
							No contact details provided.
						</Typography>
					)}
				</Stack>
			</Box>

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
							{new Date(company.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6 }}>
						<Typography variant="caption" sx={labelSx}>Last Updated</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{new Date(company.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
						</Typography>
					</Grid>
				</Grid>
			</Box>
		</Stack>
	);
};

export default CompanyDetailsTab;
