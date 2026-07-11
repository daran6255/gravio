// Helper to format hours display (e.g. 1.5 -> 1h 30m, 8 -> 8h)
export const formatHoursDisplay = (hours: number): string => {
	if (!hours || hours <= 0) return '';
	const h = Math.floor(hours);
	const m = Math.round((hours % 1) * 60);
	if (m > 0) {
		return `${h}h ${m}m`;
	}
	return `${h}h`;
};
