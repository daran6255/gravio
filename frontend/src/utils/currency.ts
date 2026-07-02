export interface CurrencyOption {
	code: string;
	name: string;
	symbol: string;
}

const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });

const resolveSymbol = (code: string): string => {
	const part = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'symbol' })
		.formatToParts(0)
		.find((p) => p.type === 'currency');
	return part?.value || code;
};

let cachedOptions: CurrencyOption[] | null = null;

/** All ISO 4217 currency codes recognized by the runtime's ICU data, with display name and symbol. */
export const getWorldCurrencies = (): CurrencyOption[] => {
	if (cachedOptions) return cachedOptions;

	cachedOptions = Intl.supportedValuesOf('currency')
		.map((code) => {
			let name = code;
			try {
				name = currencyNames.of(code) || code;
			} catch {
				// fall back to the bare code if ICU has no display name for it
			}
			return { code, name, symbol: resolveSymbol(code) };
		})
		.sort((a, b) => a.code.localeCompare(b.code));

	return cachedOptions;
};

export const getCurrencySymbol = (code?: string): string => {
	if (!code) return '';
	return getWorldCurrencies().find((c) => c.code === code)?.symbol || resolveSymbol(code);
};

/** Formats a numeric value as money in the given ISO 4217 currency (defaults to USD). */
export const formatMoney = (value: number, currencyCode?: string): string => {
	return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode || 'USD' }).format(value);
};
