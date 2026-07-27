import React from 'react';
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { getThemeByMode } from '../../theme/theme';
import {
	AnnouncementBar,
	LandingNavbar,
	HeroSection,
	LogosStrip,
	ProblemSection,
	FeaturesSection,
	DashboardPreviewSection,
	IRISSection,
	HowItWorksSection,
	TrustStrip,
	TestimonialsSection,
	PricingTeaserSection,
	FAQSection,
	ContactSection,
	CTASection,
	LandingFooter,
} from '../../components/landing';

// The marketing site always presents in light mode regardless of the signed-in
// app's dark/light preference (same precedent as the auth pages fixing their own
// look) — nested MUI ThemeProviders compose, so every section below just reads
// theme.palette/gradients/layout as usual and gets the light variant for free.
const landingTheme = getThemeByMode('light');

const organizationJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: 'Gravit',
	url: 'https://gravit.taydens.com/',
	logo: 'https://gravit.taydens.com/assets/img/logo/gravit-light.svg',
};

const LandingPage: React.FC = () => {
	return (
		<ThemeProvider theme={landingTheme}>
			<Box component="main" sx={{ bgcolor: landingTheme.palette.background.paper, minHeight: '100vh' }}>
				<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
				<AnnouncementBar />
				<LandingNavbar />
				<HeroSection />
				<LogosStrip />
				<ProblemSection />
				<FeaturesSection />
				<DashboardPreviewSection />
				<IRISSection />
				<HowItWorksSection />
				<TrustStrip />
				<TestimonialsSection />
				<PricingTeaserSection />
				<FAQSection />
				<ContactSection />
				<CTASection />
				<LandingFooter />
			</Box>
		</ThemeProvider>
	);
};

export default LandingPage;
