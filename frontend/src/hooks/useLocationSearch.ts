import { useState, useEffect } from 'react';

/**
 * Debounced city/region search backed by OpenStreetMap's Nominatim geocoding API.
 * Feeds a freeSolo Autocomplete's `options` — shared by the registration
 * Organization step and the "Convert to Team" dialog so both present the same
 * location-picking experience.
 */
export const useLocationSearch = () => {
	const [locationOptions, setLocationOptions] = useState<string[]>([]);
	const [locationLoading, setLocationLoading] = useState(false);
	const [locationInputValue, setLocationInputValue] = useState('');

	useEffect(() => {
		if (locationInputValue.trim().length < 3) {
			setLocationOptions([]);
			return;
		}

		const fetchLocations = async () => {
			setLocationLoading(true);
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
						locationInputValue
					)}&format=json&addressdetails=1&limit=5&accept-language=en`,
					{
						headers: {
							'User-Agent': 'Gravit-Onboarding-App/1.0',
						},
					}
				);
				const data = await response.json();
				if (Array.isArray(data)) {
					const formattedLocations = data.map((item: any) => {
						const addr = item.address;
						const city = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || addr.state_district || '';
						const state = addr.state || '';
						const country = addr.country || '';

						if (city && state) {
							return `${city}, ${state}`;
						} else if (city && country) {
							return `${city}, ${country}`;
						} else if (state && country) {
							return `${state}, ${country}`;
						}
						return item.display_name;
					});

					const uniqueLocations = Array.from(new Set(formattedLocations.filter(Boolean))) as string[];
					setLocationOptions(uniqueLocations);
				}
			} catch (error) {
				console.error('Failed to fetch locations:', error);
			} finally {
				setLocationLoading(false);
			}
		};

		const debounceTimer = setTimeout(() => {
			fetchLocations();
		}, 400);

		return () => clearTimeout(debounceTimer);
	}, [locationInputValue]);

	return { locationOptions, locationLoading, locationInputValue, setLocationInputValue };
};

export default useLocationSearch;
