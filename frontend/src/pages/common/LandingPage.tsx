import React from 'react';
import { Box } from '@mui/material';
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

const organizationJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: 'Gravit',
	url: 'https://gravit.taydens.com/',
	logo: 'https://gravit.taydens.com/assets/img/logo/gravit-light.svg',
};

const LandingPage: React.FC = () => {
	return (
		<Box component="main" sx={{ bgcolor: 'background.paper', minHeight: '100vh' }}>
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
	);
};

export default LandingPage;
