export const formatTime12h = (time24: string) => {
	if (!time24) return '';
	const [h, m] = time24.split(':').map(Number);
	const ampm = h >= 12 ? 'PM' : 'AM';
	const h12 = h % 12 || 12;
	return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export const parseTimeValue = (timeStr: string) => {
	if (!timeStr) return 0;
	const parts = timeStr.split(':');
	return parseInt(parts[0]) + parseInt(parts[1]) / 60;
};
