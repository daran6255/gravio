import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import Reveal from './Reveal';

const FAQS = [
	{
		question: 'Can we migrate our existing CRM and project data into Gravit?',
		answer: 'Yes. When you set up your organization, you bring your team and data in directly — leads, deals, companies, and projects don\'t need to start from zero.',
	},
	{
		question: 'Is our data isolated from other companies using Gravit?',
		answer: 'Yes. Gravit is multi-tenant by design — each organization\'s data is scoped and isolated at the database level, behind JWT-based authentication and strict access controls.',
	},
	{
		question: 'Is IRIS a separate AI subscription on top of our plan?',
		answer: 'No. Every plan includes a monthly AI credit allowance for IRIS, so there\'s no separate AI add-on bill to manage — one price per seat covers the platform and the AI agent together.',
	},
	{
		question: 'Do we have to use every module, or can we start with just a few?',
		answer: 'You can use only the modules that fit how you work today — CRM and projects, for example — and turn on timesheets, HR, or booking later without switching systems.',
	},
	{
		question: 'How long does it take to get a team up and running?',
		answer: 'There\'s no implementation project. Most teams can invite their staff, set up their pipelines, and start working the same day they sign up.',
	},
	{
		question: 'What happens if we need to downgrade or cancel?',
		answer: 'You can change or cancel your plan at any time from your billing settings — there\'s no long-term contract lock-in.',
	},
];

// Built directly from FAQS above so the structured data can never drift out of
// sync with what's actually rendered on the page.
const faqJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: FAQS.map((faq) => ({
		'@type': 'Question',
		name: faq.question,
		acceptedAnswer: { '@type': 'Answer', text: faq.answer },
	})),
};

const FAQSection: React.FC = () => {
	const theme = useTheme();

	return (
		<Box component="section" id="faq" sx={{ bgcolor: theme.palette.background.paper, py: { xs: 9, md: 12 } }}>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
			<Container maxWidth="md">
				<Reveal>
					<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, textAlign: 'center', mb: { xs: 6, md: 7 } }}>
						Frequently asked questions
					</Typography>
				</Reveal>

				<Reveal delay={80}>
					<Box>
						{FAQS.map((faq, i) => (
							<Accordion
								key={faq.question}
								disableGutters
								elevation={0}
								sx={{
									bgcolor: 'transparent',
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: `${theme.layout.radius.card} !important`,
									mb: 1.5,
									'&::before': { display: 'none' },
									overflow: 'hidden',
								}}
							>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.text.secondary }} />}
									aria-controls={`faq-panel-${i}-content`}
									id={`faq-panel-${i}-header`}
									sx={{ px: 3, py: 0.5 }}
								>
									<Typography sx={{ fontWeight: 700, fontSize: '0.98rem', color: theme.palette.text.primary }}>
										{faq.question}
									</Typography>
								</AccordionSummary>
								<AccordionDetails sx={{ px: 3, pb: 2.5 }}>
									<Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.92rem', lineHeight: 1.65 }}>
										{faq.answer}
									</Typography>
								</AccordionDetails>
							</Accordion>
						))}
					</Box>
				</Reveal>
			</Container>
		</Box>
	);
};

export default FAQSection;
