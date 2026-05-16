import { useState, useCallback } from 'react';
import { Metadata } from 'libphonenumber-js/core';
import metadataJson from 'libphonenumber-js/metadata.min.json';
import type { MuiTelInputInfo } from 'mui-tel-input';

const preferredLengths: Record<string, number> = {
    'IN': 10, 'AF': 9, 'AL': 9, 'DZ': 9, 'AT': 13, 'AZ': 9, 'BS': 10, 'BE': 10,
    'BR': 12, 'CA': 10, 'CN': 12, 'DK': 8, 'FR': 9, 'DE': 15, 'IT': 12, 'MX': 10,
    'NL': 9, 'RU': 10, 'ZA': 10, 'GB': 10, 'US': 10, 'LK': 9
};

/**
 * Hook for phone number validation and length management.
 * Provides logic for determining maximum national number lengths across countries.
 */
export const usePhoneValidation = () => {
    const [countryCode, setCountryCode] = useState<string>('IN');

    const getMaxLength = useCallback((cc: string | null) => {
        if (!cc) return 15;
        if (preferredLengths[cc]) return preferredLengths[cc];
        try {
            const meta = new Metadata(metadataJson as any);
            meta.selectNumberingPlan(cc as any);
            if (meta.numberingPlan) {
                const lengths = meta.numberingPlan.possibleLengths();
                return Math.max(...lengths);
            }
            return 15;
        } catch (e) {
            return 15;
        }
    }, []);

    const validatePhoneChange = useCallback((info: MuiTelInputInfo) => {
        const cc = info.countryCode || 'IN';
        const maxNationalLength = getMaxLength(cc);
        const nationalNumber = info.nationalNumber || '';

        // Return true if the length is within limits
        return nationalNumber.length <= maxNationalLength;
    }, [getMaxLength]);

    return {
        countryCode,
        setCountryCode,
        getMaxLength,
        validatePhoneChange
    };
};

export default usePhoneValidation;
