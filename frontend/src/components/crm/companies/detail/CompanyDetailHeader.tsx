import React from 'react';
import {
	Box,
	Container,
	Typography,
	Stack,
	Button,
	IconButton,
	Breadcrumbs,
	Link,
	Divider,
	Chip,
	Paper
} from '@mui/material';
import {
	Edit as EditIcon,
	Language as WebsiteIcon,
	LocationOn as LocationIcon,
	MoreVert as MoreIcon,
	Category as IndustryIcon,
	Groups as TeamIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EnterpriseAvatar from '../../../common/avatar/Avatar';
import type { Company } from '../../../../models/company';

interface CompanyDetailHeaderProps {
	company: Company;
	onEdit: () => void;
	isMobile: boolean;
}

const CompanyDetailHeader: React.FC<CompanyDetailHeaderProps> = ({ company, onEdit, isMobile }) => {
	const navigate = useNavigate();

	return (
		<Box sx={{ bgcolor: '#232f3e', color: 'white', pt: 2, pb: 4, mb: 0 }}>
			<Container maxWidth="xl">
				<Breadcrumbs
					sx={{
						mb: 2,
						'& .MuiBreadcrumbs-li': { fontSize: '0.85rem', color: '#aab7bd' },
						'& .MuiBreadcrumbs-separator': { color: '#aab7bd' }
					}}
				>
					<Link
						underline="hover"
						sx={{ color: '#aab7bd', cursor: 'pointer' }}
						onClick={() => navigate('/crm/companies')}
					>
						Companies
					</Link>
					<Typography sx={{ fontSize: '0.85rem', color: 'white' }}>{company.name}</Typography>
				</Breadcrumbs>

				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
					<Box>
						<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
							<EnterpriseAvatar name={company.name} size={48} variant="rounded" />
							<Box>
								<Stack direction="row" spacing={1.5} alignItems="center">
									<Typography variant="h4" sx={{ fontWeight: 300, letterSpacing: '-0.02em', fontSize: isMobile ? '1.5rem' : '2rem' }}>
										{company.name}
									</Typography>
									<Chip
										label={company.status.toUpperCase()}
										size="small"
										sx={{
											height: 20,
											fontSize: '0.65rem',
											fontWeight: 900,
											bgcolor: company.status === 'active' ? '#1d8102' : '#d13212',
											color: 'white',
											borderRadius: '2px'
										}}
									/>
								</Stack>
								<Typography variant="body2" sx={{ color: '#aab7bd', maxWidth: 600, mt: 0.5 }}>
									Organizational ID: <Box component="span" sx={{ color: '#ff9900', fontWeight: 700 }}>{company.public_id}</Box>
								</Typography>
							</Box>
						</Stack>
					</Box>

					<Stack direction="row" spacing={1.5}>
						<Button
							variant="outlined"
							startIcon={<EditIcon />}
							onClick={onEdit}
							sx={{
								color: 'white',
								borderColor: 'rgba(255, 255, 255, 0.3)',
								textTransform: 'none',
								fontWeight: 700,
								borderRadius: '2px',
								'&:hover': {
									bgcolor: 'rgba(255, 255, 255, 0.05)',
									borderColor: 'rgba(255, 255, 255, 0.5)'
								}
							}}
						>
							Edit Company
						</Button>
						<IconButton
							size="small"
							sx={{
								color: 'white',
								border: '1px solid rgba(255, 255, 255, 0.3)',
								borderRadius: '2px'
							}}
						>
							<MoreIcon fontSize="small" />
						</IconButton>
					</Stack>
				</Box>

				{/* Service Plate (Info Ribbon) */}
				<Paper
					elevation={0}
					sx={{
						bgcolor: 'rgba(255, 255, 255, 0.05)',
						borderRadius: '2px',
						p: 2,
						border: '1px solid rgba(255, 255, 255, 0.1)',
						display: 'flex',
						flexWrap: 'wrap',
						gap: { xs: 2, md: 4 }
					}}
				>
					<Box sx={{ minWidth: 120 }}>
						<Typography variant="caption" sx={{ color: '#aab7bd', display: 'block', mb: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
							Industry
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center">
							<IndustryIcon sx={{ fontSize: 14, color: '#aab7bd' }} />
							<Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
								{company.industry || 'N/A'}
							</Typography>
						</Stack>
					</Box>
					<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', display: { xs: 'none', sm: 'block' } }} />
					<Box sx={{ minWidth: 100 }}>
						<Typography variant="caption" sx={{ color: '#aab7bd', display: 'block', mb: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
							Company Size
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center">
							<TeamIcon sx={{ fontSize: 14, color: '#aab7bd' }} />
							<Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>{company.company_size || 'N/A'}</Typography>
						</Stack>
					</Box>
					<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', display: { xs: 'none', md: 'block' } }} />
					<Box sx={{ minWidth: 150 }}>
						<Typography variant="caption" sx={{ color: '#aab7bd', display: 'block', mb: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
							Official Website
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center">
							<WebsiteIcon sx={{ fontSize: 14, color: '#aab7bd' }} />
							<Link
								href={company.website}
								target="_blank"
								underline="none"
								sx={{ variant: 'body2', color: '#ff9900', fontWeight: 600, fontSize: '0.875rem', '&:hover': { color: '#ec7211' } }}
							>
								{company.website?.replace(/^https?:\/\//, '') || 'Not configured'}
							</Link>
						</Stack>
					</Box>
					<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', display: { xs: 'none', lg: 'block' } }} />
					<Box sx={{ minWidth: 150 }}>
						<Typography variant="caption" sx={{ color: '#aab7bd', display: 'block', mb: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
							Headquarters
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center">
							<LocationIcon sx={{ fontSize: 14, color: '#aab7bd' }} />
							<Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
								{company.address?.city && company.address?.state ? `${company.address.city}, ${company.address.state}` : 'N/A'}
							</Typography>
						</Stack>
					</Box>
				</Paper>
			</Container>
		</Box>
	);
};

export default CompanyDetailHeader;
