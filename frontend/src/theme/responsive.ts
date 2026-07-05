import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Centralized responsive system — single source of truth for every
 * breakpoint, media query, and responsive style preset in the app.
 *
 * Device coverage:
 *   xs   0px+     small phones (320–599)
 *   sm   600px+   large phones / small tablets (600–899)
 *   md   900px+   tablets / small laptops (900–1199)
 *   lg   1200px+  laptops / desktops (1200–1535)
 *   xl   1536px+  large desktops (1536–1919)
 *   xxl  1920px+  full-HD / ultra-wide / 4K
 *
 * Usage:
 *   - In sx props: use MUI object syntax — sx={{ px: { xs: 1.5, md: 3 } }}
 *   - In components: const { isMobile, isTablet } = useResponsive();
 *   - In plain CSS-in-JS keys: [media.down('sm')]: { ... }
 *   - Presets: sx={{ ...responsiveStyles.pagePadding }}
 */

declare module '@mui/material/styles' {
	interface BreakpointOverrides {
		xs: true;
		sm: true;
		md: true;
		lg: true;
		xl: true;
		xxl: true;
	}
}

export const breakpointValues = {
	xs: 0,
	sm: 600,
	md: 900,
	lg: 1200,
	xl: 1536,
	xxl: 1920,
} as const;

export type BreakpointKey = keyof typeof breakpointValues;

/**
 * Raw media-query strings for use outside sx (plain style objects,
 * emotion css, theme typography overrides). Mirrors MUI semantics:
 * up(key) = min-width of key; down(key) = below key's min-width.
 */
export const media = {
	up: (key: BreakpointKey) => `@media (min-width:${breakpointValues[key]}px)`,
	down: (key: BreakpointKey) =>
		`@media (max-width:${breakpointValues[key] - 0.05}px)`,
	between: (start: BreakpointKey, end: BreakpointKey) =>
		`@media (min-width:${breakpointValues[start]}px) and (max-width:${breakpointValues[end] - 0.05}px)`,
	/** Coarse pointer = touch device, regardless of screen size */
	touch: '@media (hover: none) and (pointer: coarse)',
	landscape: '@media (orientation: landscape)',
	portrait: '@media (orientation: portrait)',
} as const;

/**
 * Device-level flags derived from the active theme breakpoints.
 * Prefer this hook over ad-hoc useMediaQuery calls in components.
 */
export const useResponsive = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600
	const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600–899
	const isLaptop = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 900–1199
	const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200
	const isLargeScreen = useMediaQuery(theme.breakpoints.up('xl')); // >= 1536
	const isUltraWide = useMediaQuery(theme.breakpoints.up('xxl')); // >= 1920
	const isTouch = useMediaQuery(media.touch);

	return {
		isMobile,
		isTablet,
		isLaptop,
		isDesktop,
		isLargeScreen,
		isUltraWide,
		isTouch,
		/** true below md (900px) — phone or tablet-portrait layouts */
		isMobileOrTablet: isMobile || isTablet,
		breakpoints: theme.breakpoints,
	};
};

/**
 * Reusable responsive style presets. Spread into sx:
 *   <Box sx={{ ...responsiveStyles.pagePadding }}>
 */
export const responsiveStyles = {
	/** Standard page gutter that tightens on smaller screens */
	pagePadding: {
		px: { xs: 1.5, sm: 2, md: 3, xl: 4 },
		py: { xs: 1.5, sm: 2, md: 3 },
	},
	/** Vertical rhythm between page sections */
	sectionGap: {
		mb: { xs: 2, sm: 2.5, md: 3 },
	},
	/** Card/stat grids: 1 col on phone, 2 on tablet, 3–4 on desktop */
	cardGrid: {
		display: 'grid',
		gap: { xs: 1.5, sm: 2, md: 2.5 },
		gridTemplateColumns: {
			xs: '1fr',
			sm: 'repeat(2, 1fr)',
			md: 'repeat(3, 1fr)',
			lg: 'repeat(4, 1fr)',
		},
	},
	/** Two-column form that stacks on phones */
	formGrid: {
		display: 'grid',
		gap: { xs: 1.5, sm: 2 },
		gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
	},
	/** Toolbar/header rows: stack vertically on phones */
	headerRow: {
		display: 'flex',
		flexDirection: { xs: 'column', sm: 'row' },
		alignItems: { xs: 'stretch', sm: 'center' },
		justifyContent: 'space-between',
		gap: { xs: 1.5, sm: 2 },
	},
	/** Horizontal scroll wrapper for wide content (tables, kanban) */
	scrollX: {
		overflowX: 'auto',
		WebkitOverflowScrolling: 'touch',
		maxWidth: '100%',
	},
	/** Kanban board: columns shrink on smaller screens, board scrolls */
	kanbanBoard: {
		display: 'flex',
		gap: { xs: 1.5, md: 2 },
		overflowX: 'auto',
		WebkitOverflowScrolling: 'touch',
		pb: 1,
		'& > *': {
			minWidth: { xs: 260, sm: 280, md: 300 },
			flexShrink: 0,
		},
	},
	/** Dialog/drawer content padding */
	dialogContent: {
		p: { xs: 2, sm: 3 },
	},
	/** Side drawer width: full-screen on phones, fixed on larger */
	drawerWidth: {
		width: { xs: '100vw', sm: 480, md: 560, lg: 640 },
		maxWidth: '100vw',
	},
	/** Utility visibility helpers */
	hideOnMobile: { display: { xs: 'none', sm: 'flex' } },
	hideBelowMd: { display: { xs: 'none', md: 'flex' } },
	showOnlyOnMobile: { display: { xs: 'flex', sm: 'none' } },
} as const;
