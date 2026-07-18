export interface TimezoneOption {
	tz: string;
	label: string;
}

export const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const getTimezoneMeta = (tz: string): { offset: string; abbreviation: string } => {
	const now = new Date();
	try {
		const offsetPart =
			new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
				.formatToParts(now)
				.find((p) => p.type === 'timeZoneName')?.value || '';
		const abbrPart =
			new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
				.formatToParts(now)
				.find((p) => p.type === 'timeZoneName')?.value || '';
		return { offset: offsetPart.replace('GMT', 'UTC'), abbreviation: abbrPart };
	} catch {
		return { offset: '', abbreviation: '' };
	}
};

export const getTimezoneLabel = (tz: string): string => {
	const { offset, abbreviation } = getTimezoneMeta(tz);
	const showAbbr = abbreviation && abbreviation !== offset;
	return `(${offset}) ${tz.replace(/_/g, ' ')}${showAbbr ? ` — ${abbreviation}` : ''}`;
};

let cachedOptions: TimezoneOption[] | null = null;

/** All IANA timezones recognized by the runtime's ICU data, with a human-readable "(UTC±HH:MM) Region/City — ABBR" label. */
export const getTimezoneOptions = (): TimezoneOption[] => {
	if (cachedOptions) return cachedOptions;

	let zones: string[];
	try {
		zones = Intl.supportedValuesOf('timeZone');
	} catch {
		zones = [BROWSER_TIMEZONE];
	}
	cachedOptions = zones.map((tz) => ({ tz, label: getTimezoneLabel(tz) }));
	return cachedOptions;
};
