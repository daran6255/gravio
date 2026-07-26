import React from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Check as CheckIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Reveal from './Reveal';

// Mirrors the real team-plan tiers in BillingSettings.tsx — kept in sync manually
// since this teaser intentionally shows a simplified one-liner, not the full feature list.
const PLANS = [
	{ name: 'Team Trial', price: 'Free', period: 'up to 5 users', differentiator: 'Try every core module before you pay anything', popular: false },
	{ name: 'Starter', price: '₹149', period: '/user/mo', differentiator: 'Unlimited team members, timesheets & billing included', popular: false },
	{ name: 'Growth', price: '₹299', period: '/user/mo', differentiator: 'Adds HR & payroll plus staffing/placement modules', popular: true },
	{ name: 'Enterprise', price: '₹499', period: '/user/mo', differentiator: 'Full suite, unlimited storage, dedicated success manager', popular: false },
];

const PricingTeaserSection: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<Box component="section" id="pricing" sx={{ bgcolor: theme.palette.background.default, py: { xs: 9, md: 12 } }}>
			<Container maxWidth="lg">
				<Reveal>
					<Box sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto', mb: { xs: 6, md: 7 } }}>
						<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.accent.dark, mb: 1.5 }}>
							Pricing
						</Typography>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, mb: 2 }}>
							One price per seat. AI credits included.
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.05rem' }}>
							No separate IRIS subscription — every plan includes a monthly AI credit allowance.
						</Typography>
					</Box>
				</Reveal>

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
					{PLANS.map((plan, i) => (
						<Reveal key={plan.name} delay={i * 70}>
							<Box
								sx={{
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									p: 3,
									borderRadius: theme.layout.radius.card,
									border: plan.popular ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.paper,
									position: 'relative',
								}}
							>
								{plan.popular && (
									<Box
										sx={{
											position: 'absolute',
											top: -12,
											left: '50%',
											transform: 'translateX(-50%)',
											px: 1.5,
											py: 0.4,
											borderRadius: theme.layout.radius.badge,
											bgcolor: theme.palette.primary.main,
										}}
									>
										<Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>
											MOST POPULAR
										</Typography>
									</Box>
								)}

								<Typography sx={{ fontWeight: 700, fontSize: '1rem', color: theme.palette.text.primary, mb: 1.5 }}>
									{plan.name}
								</Typography>
								<Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 2 }}>
									<Typography sx={{ fontWeight: 800, fontSize: '1.75rem', color: theme.palette.text.primary }}>{plan.price}</Typography>
									<Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>{plan.period}</Typography>
								</Stack>

								<Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 3, flex: 1 }}>
									<CheckIcon sx={{ fontSize: 16, color: theme.palette.success.main, mt: 0.3, flexShrink: 0 }} />
									<Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary, lineHeight: 1.5 }}>
										{plan.differentiator}
									</Typography>
								</Stack>

								<Button
									fullWidth
									variant={plan.popular ? 'contained' : 'outlined'}
									onClick={() => navigate('/auth/register')}
									sx={{
										fontWeight: 700,
										borderRadius: theme.layout.radius.button,
										...(plan.popular
											? { bgcolor: theme.palette.primary.main, color: '#ffffff', '&:hover': { bgcolor: theme.palette.primary.dark } }
											: { color: theme.palette.text.primary, borderColor: theme.palette.divider }),
									}}
								>
									Start Free Trial
								</Button>
							</Box>
						</Reveal>
					))}
				</Box>

				<Typography
					component="a"
					href="/auth/register"
					onClick={(e) => {
						e.preventDefault();
						navigate('/auth/register');
					}}
					sx={{
						display: 'block',
						textAlign: 'center',
						mt: 4,
						fontSize: '0.9rem',
						fontWeight: 600,
						color: theme.palette.primary.main,
						textDecoration: 'none',
						cursor: 'pointer',
						'&:hover': { textDecoration: 'underline' },
					}}
				>
					Compare full plan details →
				</Typography>
			</Container>
		</Box>
	);
};

export default PricingTeaserSection;
