import { createTheme, type Theme } from '@mui/material/styles';
import { breakpointValues, media } from './responsive';
import './smoothScroll';

declare module '@mui/material/styles' {
	interface TypographyVariants {
		awsSectionTitle: React.CSSProperties;
		awsFieldLabel: React.CSSProperties;
		navLogo: React.CSSProperties;
		sidebarItem: React.CSSProperties;
		sidebarActive: React.CSSProperties;
		sidebarSectionLabel: React.CSSProperties;
		navBadge: React.CSSProperties;
		footerLink: React.CSSProperties;
		chipLabel: React.CSSProperties;
	}
	interface TypographyVariantsOptions {
		awsSectionTitle?: React.CSSProperties;
		awsFieldLabel?: React.CSSProperties;
		navLogo?: React.CSSProperties;
		sidebarItem?: React.CSSProperties;
		sidebarActive?: React.CSSProperties;
		sidebarSectionLabel?: React.CSSProperties;
		navBadge?: React.CSSProperties;
		footerLink?: React.CSSProperties;
		chipLabel?: React.CSSProperties;
	}
	interface Palette {
		accent: Palette['primary'];
	}
	interface PaletteOptions {
		accent?: PaletteOptions['primary'];
	}
	interface Theme {
		gradients: {
			/** Horizontal brand gradient — primary CTA buttons */
			brand: string;
			/** Diagonal brand gradient — badges, highlights */
			brandDiagonal: string;
			/** Hover state of the diagonal brand gradient */
			brandDiagonalHover: string;
			/** Frost glass gradient for cards */
			card: string;
			/** Fixed dark backdrop for the auth brand panel (mode-independent by design) */
			authPanel: string;
		};
		layout: {
			/** Height of the fixed top Navbar/Toolbar, in px */
			navbarHeight: number;
			/** Expanded Sidebar drawer width, in px */
			drawerWidth: number;
			/** Collapsed (icon-only) Sidebar drawer width, in px */
			drawerWidthCollapsed: number;
			/** Shared corner radii for pill badges/buttons and cards */
			radius: {
				pill: string;
				badge: string;
				card: string;
				button: string;
			};
			/** Fixed height every Navbar pill badge (Super Admin / plan / currency) shares,
			 *  so they line up evenly regardless of whether they render as a Button or a Chip. */
			badgeHeight: number;
			navbar: {
				background: string;
			};
			/** The Sidebar deliberately inverts against the app mode (light mode -> dark
			 *  sidebar, dark mode -> light sidebar), so these can't be derived from `palette`. */
			sidebar: {
				background: string;
				text: string;
				textHover: string;
				textMuted: string;
				divider: string;
				hoverBg: string;
			};
			/** The Settings "unsaved changes" action bar is a fixed dark surface in both
			 *  app modes (for emphasis), so its text/background can't come from `palette` either. */
			unsavedBar: {
				background: string;
				text: string;
				textHover: string;
				hoverBg: string;
			};
			/** The auth pages (login/register/forgot-password) use a fixed dark brand
			 *  aesthetic by design, independent of the app's light/dark mode toggle. */
			authPanel: {
				border: string;
				divider: string;
				text: string;
				textMuted: string;
				textSubtle: string;
			};
		};
	}
	interface ThemeOptions {
		gradients?: Theme['gradients'];
		layout?: Theme['layout'];
	}
}

declare module '@mui/material/Typography' {
	interface TypographyPropsVariantOverrides {
		awsSectionTitle: true;
		awsFieldLabel: true;
		navLogo: true;
		sidebarItem: true;
		sidebarActive: true;
		sidebarSectionLabel: true;
		navBadge: true;
		footerLink: true;
		chipLabel: true;
	}
}

export const getThemeByMode = (mode: 'light' | 'dark'): Theme => {
	const isDark = mode === 'dark';

	return createTheme({
		breakpoints: {
			values: breakpointValues,
		},
		gradients: {
			brand: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
			brandDiagonal: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
			brandDiagonalHover: 'linear-gradient(135deg, #9C8FFF 0%, #7062E9 100%)',
			card: isDark
				? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
				: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
			authPanel: 'linear-gradient(160deg, #141622 0%, #0c0e17 55%, #0a0b12 100%)',
		},
		layout: {
			navbarHeight: 64,
			drawerWidth: 260,
			drawerWidthCollapsed: 64,
			radius: {
				pill: '5px',
				badge: '5px',
				card: '12px',
				button: '8px',
			},
			badgeHeight: 28,
			navbar: {
				background: isDark ? '#0B0D12' : '#ffffff',
			},
			sidebar: {
				background: isDark ? '#ffffff' : '#0B0D12',
				text: isDark ? '#1e293b' : '#F4F5F7',
				textHover: isDark ? '#0B0D12' : '#ffffff',
				textMuted: isDark ? '#64748b' : '#94A3B8',
				divider: isDark ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
				hoverBg: isDark ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
			},
			unsavedBar: {
				background: isDark ? '#0B0D12' : '#1e293b',
				text: '#94A3B8',
				textHover: '#F4F5F7',
				hoverBg: 'rgba(255, 255, 255, 0.06)',
			},
			authPanel: {
				border: 'rgba(255, 255, 255, 0.07)',
				divider: 'rgba(255, 255, 255, 0.06)',
				text: '#F4F5F7',
				textMuted: '#94A3B8',
				textSubtle: '#64748b',
			},
		},
		palette: {
			mode,
			primary: {
				main: '#8B7CF6', // Logo Purple
				light: '#b2a7ff',
				dark: '#6052d9',
			},
			secondary: {
				main: '#0B0D12', // Logo Dark
				light: isDark ? '#1a1e26' : '#1e293b',
				dark: '#040507',
			},
			background: {
				default: isDark ? '#0B0D12' : '#F4F5F7', // Logo Light Gray / Logo Dark Gray
				paper: isDark ? '#141822' : '#ffffff',
			},
			text: {
				primary: isDark ? '#F4F5F7' : '#1e293b',
				secondary: isDark ? '#94A3B8' : '#64748b',
			},
			divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
			success: {
				main: '#10b981',
			},
			warning: {
				main: '#f59e0b',
			},
			error: {
				main: '#ef4444',
			},
			info: {
				main: '#4EA8FF', // Logo Blue
			},
			accent: {
				main: '#4EA8FF', // Logo Blue
				light: '#85c3ff',
				dark: '#157cd4',
			}
		},
		typography: {
			fontFamily: '"Inter", "Inter UI", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
			h1: {
				fontWeight: 700,
				letterSpacing: '-0.02em',
				fontSize: '2.5rem',
				[media.down('md')]: { fontSize: '2.125rem' },
				[media.down('sm')]: { fontSize: '1.875rem' },
			},
			h2: {
				fontWeight: 700,
				letterSpacing: '-0.02em',
				fontSize: '2.125rem',
				[media.down('md')]: { fontSize: '1.875rem' },
				[media.down('sm')]: { fontSize: '1.625rem' },
			},
			h3: {
				fontWeight: 700,
				letterSpacing: '-0.02em',
				fontSize: '1.875rem',
				[media.down('md')]: { fontSize: '1.625rem' },
				[media.down('sm')]: { fontSize: '1.5rem' },
			},
			h4: {
				fontWeight: 700,
				letterSpacing: '-0.02em',
				fontSize: '1.75rem',
				[media.down('md')]: { fontSize: '1.5rem' },
				[media.down('sm')]: { fontSize: '1.375rem' },
			},
			h5: {
				fontWeight: 600,
				letterSpacing: '-0.01em',
				fontSize: '1.5rem',
				[media.down('md')]: { fontSize: '1.3125rem' },
				[media.down('sm')]: { fontSize: '1.1875rem' },
			},
			h6: {
				fontWeight: 500,
				fontSize: '1.125rem',
				[media.down('sm')]: { fontSize: '1.0625rem' },
			},
			button: {
				textTransform: 'none',
				fontWeight: 600,
			},
			body1: {
				fontSize: '0.9375rem',
				lineHeight: 1.6,
			},
			body2: {
				fontSize: '0.875rem',
				lineHeight: 1.57,
			},
			awsSectionTitle: {
				fontWeight: 700,
				fontSize: '0.9rem',
				color: isDark ? '#F4F5F7' : '#1e293b',
				textTransform: 'uppercase',
				letterSpacing: '0.05em',
				display: 'block'
			},
			awsFieldLabel: {
				fontSize: '0.875rem',
				marginBottom: '8px',
				color: isDark ? '#cbd5e1' : '#334155',
				fontWeight: 600,
				display: 'block'
			},
			navLogo: {
				fontSize: '1.1rem',
				fontWeight: 800,
				letterSpacing: '-0.5px'
			},
			sidebarItem: {
				fontSize: '0.85rem',
				fontWeight: 500
			},
			sidebarActive: {
				fontSize: '0.85rem',
				fontWeight: 800
			},
			sidebarSectionLabel: {
				fontSize: '0.6875rem',
				fontWeight: 700,
				letterSpacing: '0.12em',
				textTransform: 'uppercase',
			},
			navBadge: {
				fontSize: '0.8125rem',
				fontWeight: 700,
				[media.down('sm')]: { fontSize: '0.75rem' },
			},
			footerLink: {
				fontSize: '0.75rem',
				fontWeight: 500,
			},
			chipLabel: {
				fontSize: '0.75rem',
				fontWeight: 700,
			},
		},
		spacing: 8,
		shape: {
			borderRadius: 2, // Sharp enterprise corners
		},
		components: {
			MuiButton: {
				styleOverrides: {
					root: {
						borderRadius: 6,
						padding: '8px 16px',
						boxShadow: 'none',
						'&:hover': {
							boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
						},
						// 40px minimum tap target on touch devices (a11y)
						[media.touch]: {
							minHeight: 40,
						},
					},
					containedPrimary: {
						backgroundColor: '#8B7CF6',
						color: '#ffffff',
						'&:hover': {
							backgroundColor: '#6052d9',
						}
					}
				},
				defaultProps: {
					disableElevation: false,
				}
			},
			MuiContainer: {
				styleOverrides: {
					root: {
						paddingLeft: 24,
						paddingRight: 24,
						[media.down('md')]: {
							paddingLeft: 16,
							paddingRight: 16,
						},
						[media.down('sm')]: {
							paddingLeft: 12,
							paddingRight: 12,
						},
					},
				},
			},
			MuiDialog: {
				styleOverrides: {
					paper: {
						[media.down('sm')]: {
							margin: 12,
							width: 'calc(100% - 24px)',
							maxWidth: 'calc(100% - 24px)',
							maxHeight: 'calc(100% - 24px)',
						},
					},
				},
			},
			MuiDialogContent: {
				styleOverrides: {
					root: {
						[media.down('sm')]: {
							padding: 16,
						},
					},
				},
			},
			MuiTableCell: {
				styleOverrides: {
					root: {
						[media.down('md')]: {
							padding: '8px 10px',
						},
					},
				},
			},
			MuiToolbar: {
				styleOverrides: {
					root: {
						[media.down('sm')]: {
							paddingLeft: 12,
							paddingRight: 12,
						},
					},
				},
			},
			MuiAppBar: {
				defaultProps: {
					elevation: 0,
				},
				styleOverrides: {
					root: {
						borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
					}
				}
			},
			MuiChip: {
				styleOverrides: {
					root: {
						borderRadius: 4,
						fontWeight: 600,
						fontSize: '0.75rem',
						height: '24px',
					},
					outlined: {
						borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
						backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
					}
				}
			},
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundImage: 'none',
					},
					elevation1: {
						boxShadow: isDark
							? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)'
							: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
					}
				}
			},
			MuiDrawer: {
				styleOverrides: {
					paper: {
						backgroundColor: '#0B0D12',
						borderRight: '1px solid #000000',
						color: '#f2f3f3',
					}
				}
			},
			MuiCssBaseline: {
				styleOverrides: {
					html: {
						"@supports not selector(::-webkit-scrollbar)": {
							scrollbarColor: isDark ? "#4a5568 transparent" : "#b0b0b0 transparent",
							scrollbarWidth: 'thin',
						},
						"&::-webkit-scrollbar": {
							width: '4px',
							height: '4px',
						},
						"&::-webkit-scrollbar-track": {
							background: 'transparent',
						},
						"&::-webkit-scrollbar-thumb": {
							background: isDark ? '#4a5568' : '#b0b0b0',
							borderRadius: '0px',
						},
						"&::-webkit-scrollbar-thumb:hover": {
							background: isDark ? '#718096' : '#909090',
						},
					},
					body: {
						"&, & *": {
							"@supports not selector(::-webkit-scrollbar)": {
								scrollbarColor: isDark ? "#4a5568 transparent" : "#b0b0b0 transparent",
								scrollbarWidth: 'thin',
							},
						},
						"&::-webkit-scrollbar, & *::-webkit-scrollbar": {
							width: '4px',
							height: '4px',
						},
						"&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
							background: 'transparent',
						},
						"&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
							background: isDark ? '#4a5568' : '#b0b0b0',
							borderRadius: '0px',
						},
						"&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
							background: isDark ? '#718096' : '#909090',
						},
					},
				},
			},
		},
	});
};

// Central AWS style templates
export const awsStyles = {
	sectionTitle: {
		fontWeight: 700 as const,
		fontSize: '0.9rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		display: 'block'
	},
	awsPanel: {
		border: '1px solid',
		borderColor: 'divider',
		borderRadius: '2px',
		p: 3,
		bgcolor: 'background.paper',
		boxShadow: '0 1px 1px 0 rgba(0,28,36,0.1)'
	},
	fieldLabel: {
		fontSize: '0.875rem',
		marginBottom: '8px',
		fontWeight: 600 as const,
		display: 'block'
	},
	helperBox: {
		bgcolor: 'rgba(0, 126, 185, 0.05)',
		border: '1px solid',
		borderColor: 'info.main',
		borderRadius: '2px',
		p: 1.5,
		display: 'flex',
		alignItems: 'flex-start',
		gap: 1.5,
		mb: 3
	}
};

// Default theme instance for backward compatibility (defaults to dark mode)
const defaultTheme = getThemeByMode('dark');

export default defaultTheme;
