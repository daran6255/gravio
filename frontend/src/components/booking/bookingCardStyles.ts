import { useTheme, alpha } from '@mui/material';

/** Shared card/field styling for the Booking Page Settings screen — mirrors the
 * "premium" glass-morphism language used by StatCard/BaseDialog elsewhere in the
 * app (soft gradient surface, blur, glow-on-hover, generous radius) rather than a
 * flatter one-off look, so this module reads as part of the same product.
 *
 * `accent` also drives a subtle hover lift + colored glow (StatCard's own recipe:
 * translateY + a color-matched shadow) and the `.glow-bubble` corner decoration —
 * pass a different accent per card so the page reads as color-coded sections
 * rather than one flat wall of purple. */
export const useBookingCardStyles = (accent: string = '#8B7CF6') => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const cardBg = isDark ? '#141822' : '#ffffff';
	const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
	const labelColor = isDark ? '#8B7CF6' : '#7C3AED';
	const mutedColor = isDark ? '#94A3B8' : '#64748b';
	const iconColor = isDark ? '#64748b' : '#94A3B8';

	const cardSx = {
		position: 'relative' as const,
		overflow: 'hidden',
		background: isDark
			? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
			: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
		backdropFilter: 'blur(20px)',
		border: `1px solid ${isDark ? alpha(accent, 0.15) : alpha(accent, 0.12)}`,
		borderRadius: '16px',
		boxShadow: isDark
			? '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
			: '0 8px 32px 0 rgba(139, 124, 246, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
		p: { xs: 2.5, sm: 3 },
		transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s',
		'&:hover': {
			transform: 'translateY(-3px)',
			borderColor: alpha(accent, isDark ? 0.3 : 0.25),
			boxShadow: isDark
				? `0 16px 40px 0 rgba(0, 0, 0, 0.4), 0 0 24px 0 ${alpha(accent, 0.18)}`
				: `0 16px 40px 0 ${alpha(accent, 0.12)}, 0 0 20px 0 ${alpha(accent, 0.08)}`,
			'& .glow-bubble': { transform: 'scale(1.2)', opacity: 0.22 },
		},
	};

	/** Decorative radial-gradient blob for a card's corner — render as the first
	 * child of a `position: relative` card with `overflow: hidden` (cardSx already
	 * sets both). Purely visual, `pointerEvents: 'none'`. */
	const glowBubbleSx = {
		position: 'absolute' as const,
		top: -40,
		right: -40,
		width: 140,
		height: 140,
		borderRadius: '50%',
		background: `radial-gradient(circle, ${alpha(accent, 0.3)} 0%, rgba(255,255,255,0) 70%)`,
		filter: 'blur(15px)',
		opacity: 0.14,
		zIndex: 0,
		pointerEvents: 'none' as const,
		transition: 'all 0.4s ease-in-out',
	};

	const fieldSx = (readOnly?: boolean) => ({
		'& .MuiOutlinedInput-root': {
			bgcolor: readOnly ? (isDark ? '#1a1e28' : '#f1f5f9') : (isDark ? '#1a1e28' : '#f8fafc'),
			borderRadius: '10px',
			transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
			'& fieldset': {
				borderColor: readOnly ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
			},
			'&:hover fieldset': { borderColor: readOnly ? undefined : alpha(accent, 0.4) },
			'&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(accent, 0.12)}` },
			'&.Mui-focused fieldset': { borderColor: accent },
		},
		'& .MuiInputBase-input': {
			color: readOnly ? mutedColor : (isDark ? '#F4F5F7' : '#1e293b'),
			fontWeight: readOnly ? 500 : 600,
		},
	});

	const fieldLabelSx = { color: mutedColor, fontWeight: 700, display: 'block' as const, mb: 0.75, fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' };

	return { theme, isDark, cardBg, cardBorder, labelColor, mutedColor, iconColor, cardSx, glowBubbleSx, fieldSx, fieldLabelSx };
};
