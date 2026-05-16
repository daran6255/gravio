import React from 'react';
import {
	Box,
	Typography,
	Stack,
	Grid,
	Paper,
	Link,
	Divider
} from '@mui/material';
import {
	Language as WebsiteIcon,
	Email as EmailIcon,
	Phone as PhoneIcon,
	LocationOn as LocationIcon,
	People as PeopleIcon,
	Assignment as LeadIcon,
	MonetizationOn as DealIcon,
	Info as InfoIcon
} from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import type { Company } from '../../../../models/company';

interface OverviewTabProps {
	company: Company;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ company }) => {
	const activeLeads = company.leads?.filter((l: any) => l.lead_status !== 'lost' && l.lead_status !== 'converted') || [];
	const totalDealValue = company.deals?.reduce((sum: number, d: any) => sum + Number(d.deal_value), 0) || 0;

	return (
		<Grid container spacing={3}>
			<Grid size={{ xs: 12, md: 8 }}>
				<Stack spacing={3}>
					{/* Company Overview Section */}
					<Paper 
						elevation={0}
						sx={{ 
							p: 3, 
							borderRadius: '2px', 
							border: '1px solid #eaeded',
							bgcolor: 'white'
						}}
					>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
							<InfoIcon sx={{ color: '#545b64', fontSize: 20 }} />
							<Typography variant="h6" sx={{ fontWeight: 700, color: '#16191f' }}>
								Company details
							</Typography>
						</Stack>
						
						<Grid container spacing={4}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<Stack spacing={3}>
									<Box>
										<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
											Official Website
										</Typography>
										{company.website ? (
											<Link 
												href={company.website} 
												target="_blank" 
												underline="hover" 
												sx={{ fontWeight: 600, color: '#007eb9', display: 'flex', alignItems: 'center', gap: 1 }}
											>
												<WebsiteIcon sx={{ fontSize: 16 }} />
												{company.website}
											</Link>
										) : <Typography variant="body2" sx={{ color: '#aab7b7' }}>Not provided</Typography>}
									</Box>
									
									<Box>
										<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
											Contact Email
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
											<EmailIcon sx={{ fontSize: 16, color: '#545b64' }} />
											{company.email || 'N/A'}
										</Typography>
									</Box>

									<Box>
										<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
											Phone number
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
											<PhoneIcon sx={{ fontSize: 16, color: '#545b64' }} />
											{company.phone || 'N/A'}
										</Typography>
									</Box>
								</Stack>
							</Grid>
							
							<Grid size={{ xs: 12, sm: 6 }}>
								<Stack spacing={3}>
									<Box>
										<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
											Address
										</Typography>
										<Stack direction="row" spacing={1} alignItems="flex-start">
											<LocationIcon sx={{ fontSize: 16, color: '#545b64', mt: 0.3 }} />
											<Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
												{company.address?.street ? (
													<>
														{company.address.street}<br />
														{company.address.city}, {company.address.state} {company.address.zip_code}
													</>
												) : 'No address record found'}
											</Typography>
										</Stack>
									</Box>

									<Box>
										<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
											Industry segment
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600 }}>
											{company.industry || 'Uncategorized'}
										</Typography>
									</Box>
								</Stack>
							</Grid>
						</Grid>

						<Divider sx={{ my: 4, borderColor: '#eaeded' }} />

						<Box>
							<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
								Social Media & External Links
							</Typography>
							<Grid container spacing={2}>
								{company.social_media && Object.entries(company.social_media as Record<string, any>).map(([platform, url]) => (
									<Grid key={platform} size={{ xs: 12, sm: 4 }}>
										<Paper 
											elevation={0}
											sx={{ 
												p: 1.5, 
												bgcolor: '#f2f3f3', 
												borderRadius: '2px',
												border: '1px solid #eaeded'
											}}
										>
											<Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'capitalize', color: '#16191f', display: 'block' }}>
												{platform}
											</Typography>
											<Link 
												href={String(url)} 
												target="_blank" 
												sx={{ fontSize: '0.75rem', color: '#007eb9', wordBreak: 'break-all', mt: 0.5, display: 'block' }}
											>
												{String(url).replace(/^https?:\/\//, '')}
											</Link>
										</Paper>
									</Grid>
								))}
								{(!company.social_media || Object.keys(company.social_media).length === 0) && (
									<Grid size={{ xs: 12 }}>
										<Typography variant="body2" sx={{ color: '#aab7b7', fontStyle: 'italic' }}>
											No connected social accounts.
										</Typography>
									</Grid>
								)}
							</Grid>
						</Box>
					</Paper>
				</Stack>
			</Grid>

			<Grid size={{ xs: 12, md: 4 }}>
				<Stack spacing={3}>
					<StatCard
						title="Associated Contacts"
						value={company.contacts?.length || 0}
						icon={<PeopleIcon />}
						color="#007eb9"
					/>
					<StatCard
						title="Active Leads"
						value={activeLeads.length}
						icon={<LeadIcon />}
						color="#ff9900"
					/>
					<StatCard
						title="Pipeline Value"
						value={`₹${totalDealValue.toLocaleString()}`}
						icon={<DealIcon />}
						color="#1d8102"
					/>
				</Stack>
			</Grid>
		</Grid>
	);
};

export default OverviewTab;
