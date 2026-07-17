/** Days remaining until a trial expiry date (negative once expired, 0 on the expiry day itself). */
export const getTrialDaysLeft = (expiryDateStr?: string | null): number => {
	if (!expiryDateStr) return 0;
	const expiry = new Date(expiryDateStr);
	const today = new Date();
	expiry.setHours(0, 0, 0, 0);
	today.setHours(0, 0, 0, 0);
	const diffTime = expiry.getTime() - today.getTime();
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
