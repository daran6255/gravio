import React from 'react';
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { getThemeByMode } from '../../theme/theme';
import {
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
	CTASection,
	LandingFooter,
} from '../../components/landing';

// The marketing site always presents in light mode regardless of the signed-in
// app's dark/light preference (same precedent as the auth pages fixing their own
// look) — nested MUI ThemeProviders compose, so every section below just reads
// theme.palette/gradients/layout as usual and gets the light variant for free.
const landingTheme = getThemeByMode('light');

const LandingPage: React.FC = () => {
	return (
		<ThemeProvider theme={landingTheme}>
			<Box component="main" sx={{ bgcolor: landingTheme.palette.background.paper, minHeight: '100vh' }}>
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
				<CTASection />
				<LandingFooter />
			</Box>
		</ThemeProvider>
	);
};

export default LandingPage;
