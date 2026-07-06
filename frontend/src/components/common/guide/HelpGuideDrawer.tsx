import React, { useState } from 'react';
import { Box, Typography, Stack, Tabs, Tab, useTheme, alpha, type SvgIconProps } from '@mui/material';
import DetailDrawer from '../drawer/DetailDrawer';

type GuideAccent = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface GuideStep {
	marker: React.ReactNode;
	accent?: GuideAccent;
	title: string;
	description: string;
}

export interface GuideInfoCard {
	title: string;
	description: string;
	icons?: React.ElementType<SvgIconProps>[];
}

export interface GuideInfoSection {
	heading: string;
	cards: GuideInfoCard[];
}

export interface GuideTip {
	icon: React.ElementType<SvgIconProps>;
	accent: GuideAccent;
	title: string;
	description: string;
}

export interface GuideTab {
	label: string;
	intro?: string;
	steps?: GuideStep[];
	infoSections?: GuideInfoSection[];
	tips?: GuideTip[];
}

export interface HelpGuideContent {
	icon: React.ElementType<SvgIconProps>;
	title: string;
	subtitle: string;
	tabs: GuideTab[];
}

interface HelpGuideDrawerProps {
	open: boolean;
	onClose: () => void;
	content: HelpGuideContent;
}

export const HelpGuideDrawer: React.FC<HelpGuideDrawerProps> = ({ open, onClose, content }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [activeTab, setActiveTab] = useState(0);

	const HeaderIcon = content.icon;

	const sectionTitleSx = {
		fontWeight: 800,
		fontSize: '0.7rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.08em',
		color: 'text.primary',
		mb: 1.5,
		mt: 1.5,
	};

	const stepCardSx = {
		p: 2,
		borderRadius: '12px',
		bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
		position: 'relative' as const,
		transition: 'all 0.2s',
		'&:hover': {
			borderColor: 'primary.main',
			bgcolor: isDark ? 'rgba(33, 150, 243, 0.04)' : 'rgba(33, 150, 243, 0.02)',
			transform: 'translateY(-2px)',
		}
	};

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			width={520}
			hideDivider
			title={
				<Stack direction="row" spacing={1.5} alignItems="center">
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: '10px',
							bgcolor: 'primary.main',
							color: 'white',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 4px 12px 0 rgba(33, 150, 243, 0.3)',
						}}
					>
						<HeaderIcon sx={{ fontSize: 20 }} />
					</Box>
					<Box>
						<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
							{content.title}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{content.subtitle}
						</Typography>
					</Box>
				</Stack>
			}
		>
			<Tabs
				value={activeTab}
				onChange={(_e, val) => setActiveTab(val)}
				sx={{
					mb: 2.5,
					minHeight: 36,
					borderBottom: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
					'& .MuiTabs-indicator': { height: 2, bgcolor: 'primary.main', borderRadius: '2px 2px 0 0' },
					'& .MuiTab-root': {
						textTransform: 'none',
						fontWeight: 700,
						minHeight: 36,
						px: 2,
						py: 1,
						fontSize: '0.82rem',
						color: 'text.secondary',
						'&.Mui-selected': { color: 'primary.main' },
					},
				}}
			>
				{content.tabs.map((tab, idx) => (
					<Tab key={idx} label={tab.label} />
				))}
			</Tabs>

			{content.tabs.map((tab, idx) => (
				<Box
					key={idx}
					sx={{ display: activeTab === idx ? 'flex' : 'none', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1, pr: 0.5 }}
				>
					{tab.intro && (
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.6 }}>
							{tab.intro}
						</Typography>
					)}

					{tab.steps && (
						<Stack spacing={2}>
							{tab.steps.map((step, sIdx) => (
								<Box key={sIdx} sx={stepCardSx}>
									<Stack direction="row" spacing={2} alignItems="flex-start">
										<Box
											sx={{
												width: 28,
												height: 28,
												borderRadius: '50%',
												bgcolor: alpha(theme.palette[step.accent || 'primary'].main, 0.1),
												color: `${step.accent || 'primary'}.main`,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontWeight: 800,
												fontSize: '0.85rem',
												flexShrink: 0,
											}}
										>
											{step.marker}
										</Box>
										<Box>
											<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
												{step.title}
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
												{step.description}
											</Typography>
										</Box>
									</Stack>
								</Box>
							))}
						</Stack>
					)}

					{tab.infoSections?.map((section, secIdx) => (
						<Box key={secIdx}>
							<Typography sx={sectionTitleSx}>{section.heading}</Typography>
							<Stack spacing={1.5}>
								{section.cards.map((card, cIdx) => (
									<Box
										key={cIdx}
										sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff' }}
									>
										<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
											{card.title}
										</Typography>
										{card.icons && card.icons.length > 0 && (
											<Stack direction="row" spacing={1.25} sx={{ my: 0.75 }}>
												{card.icons.map((CardIcon, iIdx) => (
													<CardIcon key={iIdx} sx={{ fontSize: 16, color: 'primary.main' }} />
												))}
											</Stack>
										)}
										<Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
											{card.description}
										</Typography>
									</Box>
								))}
							</Stack>
						</Box>
					))}

					{tab.tips && (
						<Stack spacing={2} sx={{ mt: 1 }}>
							{tab.tips.map((tip, tIdx) => {
								const TipIcon = tip.icon;
								return (
									<Box
										key={tIdx}
										sx={{
											p: 2,
											borderRadius: '12px',
											borderLeft: '4px solid',
											borderLeftColor: `${tip.accent}.main`,
											bgcolor: alpha(theme.palette[tip.accent].main, isDark ? 0.05 : 0.02),
										}}
									>
										<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
											<TipIcon color={tip.accent} sx={{ fontSize: 20 }} />
											<Typography variant="body2" sx={{ fontWeight: 700 }}>
												{tip.title}
											</Typography>
										</Stack>
										<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
											{tip.description}
										</Typography>
									</Box>
								);
							})}
						</Stack>
					)}
				</Box>
			))}
		</DetailDrawer>
	);
};

export default HelpGuideDrawer;
