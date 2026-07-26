import React, { useState } from 'react';
import { Box, Button, Container, Stack, ToggleButton, ToggleButtonGroup, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Check as CheckIcon, Close as CloseIcon, SmartToy as SmartToyIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Reveal from './Reveal';

interface PlanCard {
	tier: string;
	name: string;
	price: number;
	priceSuffix: string;
	seatsLabel: string;
	aiCreditsPerMonth: number;
	aiPer: 'workspace' | 'person';
	features: string[];
	notCovered?: string[];
	popular?: boolean;
	isTeamPlan?: boolean;
}

// Mirrors SOLO_PLANS in frontend/src/pages/settings/BillingSettings.tsx — same tiers,
// prices, and entitlements, rewritten as outcome-first copy for a first-time visitor.
// Keep this in sync manually if the real plans change.
const SOLO_PLANS: PlanCard[] = [
	{
		tier: 'free',
		name: 'Solo Trial',
		price: 0,
		priceSuffix: '/month',
		seatsLabel: 'Just you',
		aiCreditsPerMonth: 20,
		aiPer: 'workspace',
		features: [
			'Run up to 2 projects at once',
			'Keep track of up to 50 contacts',
			'Manage up to 10 deals and companies',
			'1 GB of file storage',
			'Upgrade to a team account anytime',
			'Email support when you need it',
		],
		notCovered: ['Time tracking & billing', 'Advanced performance reports', 'Candidate & placement tracking', 'HR & payroll tools', 'Priority support'],
	},
	{
		tier: 'basic',
		name: 'Solo Standard',
		price: 99,
		priceSuffix: '/month',
		seatsLabel: 'Just you',
		aiCreditsPerMonth: 100,
		aiPer: 'workspace',
		features: [
			'Run up to 5 projects at once',
			'Keep track of up to 200 contacts',
			'Manage up to 50 deals and companies',
			'Bill every hour you work, automatically',
			'5 GB of file storage',
			'Upgrade to a team account anytime',
			'Email support when you need it',
		],
		notCovered: ['Advanced performance reports', 'Candidate & placement tracking', 'HR & payroll tools', 'Priority support'],
		popular: true,
	},
	{
		tier: 'pro',
		name: 'Solo Pro',
		price: 199,
		priceSuffix: '/month',
		seatsLabel: 'Just you',
		aiCreditsPerMonth: 1000,
		aiPer: 'workspace',
		features: [
			'Unlimited projects and contacts',
			'Unlimited deals and companies',
			'Bill every hour you work, automatically',
			"See exactly where your time and money go",
			'20 GB of file storage',
			'Upgrade to a team account anytime',
			'Priority email support',
		],
		notCovered: ['Candidate & placement tracking', 'HR & payroll tools', '24/7 phone support'],
	},
	{
		tier: 'enterprise',
		name: 'Solo Enterprise',
		price: 399,
		priceSuffix: '/month',
		seatsLabel: 'Just you',
		aiCreditsPerMonth: 5000,
		aiPer: 'workspace',
		features: [
			'No limits, anywhere in the platform',
			'Every tool unlocked, including HR & payroll and staffing',
			'100 GB of file storage',
			'Upgrade to a team account anytime',
			'Your own dedicated support manager, day or night',
		],
		notCovered: ['Inviting teammates'],
	},
];

// Mirrors TEAM_PLANS in frontend/src/pages/settings/BillingSettings.tsx.
const TEAM_PLANS: PlanCard[] = [
	{
		tier: 'free',
		name: 'Team Trial',
		price: 0,
		priceSuffix: '/month',
		seatsLabel: 'Up to 5 people',
		aiCreditsPerMonth: 50,
		aiPer: 'person',
		features: [
			'Run up to 5 projects at once',
			'Keep track of up to 500 contacts',
			'Manage up to 100 deals and companies',
			"Bill every hour your team works, automatically",
			'5 GB of file storage',
			'Email support when you need it',
		],
		notCovered: ['Candidate & placement tracking', 'HR & payroll tools', 'Priority support'],
		isTeamPlan: true,
	},
	{
		tier: 'basic',
		name: 'Starter',
		price: 149,
		priceSuffix: '/user/month',
		seatsLabel: 'Unlimited teammates',
		aiCreditsPerMonth: 200,
		aiPer: 'person',
		features: [
			'Run up to 20 projects at once',
			'Keep track of up to 1,000 contacts',
			'Manage up to 500 deals and companies',
			"Bill every hour your team works, automatically",
			'20 GB of file storage',
			'Priority email support',
		],
		notCovered: ['Candidate & placement tracking', 'HR & payroll tools', '24/7 phone support'],
		isTeamPlan: true,
	},
	{
		tier: 'pro',
		name: 'Growth',
		price: 299,
		priceSuffix: '/user/month',
		seatsLabel: 'Unlimited teammates',
		aiCreditsPerMonth: 1000,
		aiPer: 'person',
		features: [
			'Everything in Starter',
			'Unlimited projects and contacts',
			'Track candidates from application to placement',
			'Run HR and payroll without a separate system',
			"See exactly where your team's time and money go",
			'100 GB of file storage',
			'Priority chat and email support',
		],
		notCovered: ['Training & placement tracking', 'Unlimited file storage', '24/7 phone support'],
		popular: true,
		isTeamPlan: true,
	},
	{
		tier: 'enterprise',
		name: 'Enterprise',
		price: 499,
		priceSuffix: '/user/month',
		seatsLabel: 'Unlimited teammates',
		aiCreditsPerMonth: 5000,
		aiPer: 'person',
		features: [
			'Every tool unlocked, from CRM to payroll',
			'Unlimited projects and contacts',
			'Unlimited file storage',
			'Full training and placement tracking',
			'24/7 phone and email support',
			'Your own dedicated success manager',
		],
		isTeamPlan: true,
	},
];

const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

// Honest, derived-from-the-real-limit framing — never invents a number, just
// expresses the existing monthly credit grant as a rough daily rate.
const aiFramingLine = (plan: PlanCard): string => {
	const perDay = Math.max(1, Math.round(plan.aiCreditsPerMonth / 30));
	const who = plan.aiPer === 'person' ? 'per person' : 'for your workspace';
	return `Enough IRIS help for ~${perDay.toLocaleString()} requests a day, ${who}`;
};

const PricingTeaserSection: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const [mode, setMode] = useState<'solo' | 'team'>('team');
	const plans = mode === 'solo' ? SOLO_PLANS : TEAM_PLANS;

	return (
		<Box component="section" id="pricing" sx={{ bgcolor: theme.palette.background.default, py: { xs: 9, md: 12 } }}>
			<Container maxWidth="lg">
				<Reveal>
					<Box sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto', mb: 4 }}>
						<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.accent.dark, mb: 1.5 }}>
							Pricing
						</Typography>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, mb: 2 }}>
							Simple pricing, whether it's just you or a growing team
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.05rem' }}>
							IRIS is built into every plan — no separate AI bill to worry about.
						</Typography>
					</Box>
				</Reveal>

				<Reveal delay={60}>
					<Stack alignItems="center" spacing={1} sx={{ mb: { xs: 5, md: 6 } }}>
						<ToggleButtonGroup
							value={mode}
							exclusive
							onChange={(_, value) => value && setMode(value)}
							sx={{
								bgcolor: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
								borderRadius: theme.layout.radius.pill,
								p: 0.5,
								'& .MuiToggleButton-root': {
									border: 'none',
									borderRadius: `${theme.layout.radius.pill} !important`,
									px: 3,
									py: 0.75,
									fontWeight: 700,
									textTransform: 'none',
									color: theme.palette.text.secondary,
									'&.Mui-selected': {
										bgcolor: theme.palette.primary.main,
										color: '#ffffff',
										'&:hover': { bgcolor: theme.palette.primary.dark },
									},
								},
							}}
						>
							<ToggleButton value="solo">Solo</ToggleButton>
							<ToggleButton value="team">Team</ToggleButton>
						</ToggleButtonGroup>
						<Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
							{mode === 'solo' ? "Solo — it's just you" : 'Team — you and the people you work with'}
						</Typography>
					</Stack>
				</Reveal>

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, alignItems: 'stretch' }}>
					{plans.map((plan, i) => (
						<Reveal key={`${mode}-${plan.tier}`} delay={i * 70}>
							<Box
								sx={{
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									p: 3,
									borderRadius: theme.layout.radius.card,
									border: plan.popular ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.paper,
									boxShadow: plan.popular ? `0 16px 40px -16px ${alpha(theme.palette.primary.main, 0.35)}` : 'none',
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

								<Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: theme.palette.text.primary, mb: 0.5 }}>
									{plan.name}
								</Typography>
								<Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary, mb: 1.5 }}>{plan.seatsLabel}</Typography>

								<Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 2 }}>
									<Typography sx={{ fontWeight: 800, fontSize: '1.9rem', color: theme.palette.text.primary }}>
										{plan.price === 0 ? 'Free' : formatINR(plan.price)}
									</Typography>
									{plan.price > 0 && <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>{plan.priceSuffix}</Typography>}
								</Stack>

								<Stack
									direction="row"
									spacing={1}
									alignItems="flex-start"
									sx={{ mb: 2.5, p: 1.25, borderRadius: theme.layout.radius.card, bgcolor: alpha(theme.palette.primary.main, 0.06) }}
								>
									<SmartToyIcon sx={{ fontSize: 16, color: theme.palette.primary.main, mt: 0.2, flexShrink: 0 }} />
									<Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.primary, lineHeight: 1.5, fontWeight: 600 }}>
										{aiFramingLine(plan)}
									</Typography>
								</Stack>

								<Stack spacing={1} sx={{ flex: 1, mb: 3 }}>
									{plan.features.map((feature) => (
										<Stack key={feature} direction="row" spacing={1} alignItems="flex-start">
											<CheckIcon sx={{ fontSize: 15, color: theme.palette.success.main, mt: 0.3, flexShrink: 0 }} />
											<Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.primary, lineHeight: 1.5 }}>{feature}</Typography>
										</Stack>
									))}
									{plan.notCovered?.map((feature) => (
										<Stack key={feature} direction="row" spacing={1} alignItems="flex-start" sx={{ opacity: 0.5 }}>
											<CloseIcon sx={{ fontSize: 15, color: theme.palette.text.secondary, mt: 0.3, flexShrink: 0 }} />
											<Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary, lineHeight: 1.5, textDecoration: 'line-through' }}>
												{feature}
											</Typography>
										</Stack>
									))}
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
					See full plan comparison →
				</Typography>
			</Container>
		</Box>
	);
};

export default PricingTeaserSection;
